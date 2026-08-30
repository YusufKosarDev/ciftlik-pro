-- Uretim icin NON-SUPERUSER uygulama rolu — Postgres RLS'in GERCEKTEN uygulanmasi
-- icin sarttir. Superuser ve (FORCE olmadan) tablo sahibi RLS'i bypass eder; bu
-- yuzden uygulama, asagidaki en-az-yetkili rolle baglanmalidir. Tablolarda
-- FORCE ROW LEVEL SECURITY etkin oldugundan, bu rol icin tenant_isolation
-- politikasi DAIMA uygulanir (bkz. migration 20260618162000_tenant_rls).
--
-- Idempotent: tekrar calistirilabilir. Superuser veya veritabani sahibi ile,
-- uygulama veritabanina bagliyken calistirin:
--
--   psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -v app_pw='GUCLU_BIR_PAROLA' \
--     -f prisma/rls-app-role.sql
--
-- ⚠️ SIRA: Bu betik MIGRATION'LARDAN SONRA calistirilmalidir. GRANT'lar MEVCUT
--    tablolara ve fonksiyonlara verilir; sema henuz yoksa rol yetkisiz kalir.
--    (CI bu sirayi uyguluyor: .github/workflows/ci.yml)
--
-- ⚠️ AYNI PAROLA: Tekrar calistirirken AYNI app_pw'yi verin. ALTER ROLE parolayi
--    kosulsuz yeniden yazar; farkli bir deger verilirse uygulamanin
--    DATABASE_URL'i guncellenene kadar tum baglantilar kimlik dogrulamada duser.
--
-- Ardindan uygulamanin DATABASE_URL'ini bu rolle baglanacak sekilde guncelleyin;
-- DIRECT_URL owner'da KALMALIDIR (migration + SECURITY DEFINER sahipligi).
-- Ornek icin docs/PRODUCTION-RLS.md.

\set app_role ciftlik_app

-- 1) Rol yoksa olustur (parola sonraki adimda atanir).
--    Yeni rol varsayilan olarak NOSUPERUSER + NOBYPASSRLS + NOCREATEDB +
--    NOCREATEROLE dogar; adim 3 bunu yalnizca TEYIT eder.
SELECT format('CREATE ROLE %I LOGIN', :'app_role')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

-- 2) Parola + LOGIN. Bu adim HER KOSULDA gecmelidir: rolu olusturabilen
--    (CREATEROLE) her rol, olusturdugu rolun parolasini da atayabilir.
ALTER ROLE :"app_role" WITH LOGIN PASSWORD :'app_pw';

-- 3) Guvenlik ozniteliklerinin TEYIDI — hata toleransli.
--
--    NEDEN AYRI VE TOLERANSLI: PostgreSQL'de SUPERUSER ozniteligini degistirmek
--    (kapatmak dahil) GERCEK superuser gerektirir. Neon'da baglanilabilen en
--    yetkili rol `neondb_owner`'dir ve rolsuper = false'tur; dolayisiyla
--    NOSUPERUSER "must be superuser to change superuser attribute" ile duser.
--    BYPASSRLS ise PG16+'ta CREATEROLE + ayni ozniteligi tasiyan rol tarafindan
--    verilebilir, yani `neondb_owner` ile GECMESI beklenir (Neon PG 17.11).
--
--    Her oznitelik AYRI bir alt blokta: ALTER ROLE atomiktir, hepsi tek
--    ifadede olsaydi NOSUPERUSER'in hatasi guvenlik acisindan KRITIK olan
--    NOBYPASSRLS'i de uygulanmadan birakirdi.
--
--    Bir alt blok duserse betik DEVAM eder: adim 1'de olusturulan rol bu
--    ozniteliklerin hepsini zaten dogru degerlerle tasir. Gercegi adim 8'deki
--    dogrulama soyler.
--
--    NOT: Rol adi burada duz metin tekrarlanir; psql, :'app_role' degiskenini
--    dolar-tirnakli ($$) govde icinde YERINE KOYMAZ.
DO $$
DECLARE
  r CONSTANT text := 'ciftlik_app';
BEGIN
  BEGIN
    EXECUTE format('ALTER ROLE %I WITH NOBYPASSRLS', r);
    RAISE NOTICE '[ok] NOBYPASSRLS ayarlandi.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[atlandi] NOBYPASSRLS ayarlanamadi: %', SQLERRM;
  END;

  BEGIN
    EXECUTE format('ALTER ROLE %I WITH NOSUPERUSER', r);
    RAISE NOTICE '[ok] NOSUPERUSER ayarlandi.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[atlandi] NOSUPERUSER ayarlanamadi: %', SQLERRM;
  END;

  BEGIN
    EXECUTE format('ALTER ROLE %I WITH NOCREATEDB NOCREATEROLE', r);
    RAISE NOTICE '[ok] NOCREATEDB NOCREATEROLE ayarlandi.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[atlandi] NOCREATEDB/NOCREATEROLE ayarlanamadi: %', SQLERRM;
  END;
END
$$;

-- 4) Veritabani/sema erisimi (db adi ortamla degisir; current_database ile portatif).
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_role')
\gexec
GRANT USAGE ON SCHEMA public TO :"app_role";

-- 5) Tablo/sekans yetkileri (DDL haric; rol sema degistiremez).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_role";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_role";

-- 6) Fonksiyon yetkileri.
--
--    Uc SECURITY DEFINER fonksiyon, tenant baglami OLMADAN calismak zorunda olan
--    okumalari tasir. Bunlar olmadan giris, davet kabulu ve magaza dizini kirilir:
--      auth_user_by_email       -> giris (20260618167000_auth_lookup_function)
--      invitation_by_token      -> davet kabulu (20260826120000_invitation_rls)
--      public_storefront_tenants-> magaza dizini (20260830120000_public_storefront_function)
--
--    Postgres yeni fonksiyonlara EXECUTE'u varsayilan olarak PUBLIC'e verir, yani
--    bunlar bugun zaten calisir. GRANT'lari ACIKCA yaziyoruz ki koruma bir
--    varsayilana degil, yazili bir karara dayansin: biri ileride
--    `REVOKE EXECUTE ... FROM PUBLIC` calistirirsa giris sessizce olmesin.
GRANT EXECUTE ON FUNCTION auth_user_by_email(text) TO :"app_role";
GRANT EXECUTE ON FUNCTION invitation_by_token(text) TO :"app_role";
GRANT EXECUTE ON FUNCTION public_storefront_tenants() TO :"app_role";

-- 7) Gelecekte (migration ile) eklenecek tablo/sekans/fonksiyonlar icin otomatik yetki.
--
--    ⚠️ KAPSAM UYARISI: FOR ROLE verilmedigi icin bu varsayilanlar YALNIZCA BU
--    BETIGI CALISTIRAN ROLUN olusturacagi nesnelere uygulanir. Betigi ve
--    `prisma migrate deploy`'u AYNI rolle (Neon'da neondb_owner) calistirin;
--    aksi halde sonraki migration'larin ekledigi tablolarda ciftlik_app
--    yetkisiz kalir ve o tablolara ilk erisimde "permission denied" alirsiniz.
--    Farkli bir rol kullanilacaksa: ALTER DEFAULT PRIVILEGES FOR ROLE <owner> ...
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO :"app_role";

-- 8) Dogrulama. Adim 3 kismen dusmus olabilir; GERCEK DURUM budur.
--    Beklenen: dort sutun da `f`.
SELECT rolname, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
FROM pg_roles WHERE rolname = :'app_role';

-- Kritik olan tek oznitelik icin sesli uyari: rolbypassrls = true ise RLS bu
-- rol icin HIC UYGULANMAZ ve butun izolasyon sessizce devre disi kalir.
DO $$
DECLARE
  bypass boolean;
BEGIN
  SELECT rolbypassrls INTO bypass FROM pg_roles WHERE rolname = 'ciftlik_app';
  IF bypass THEN
    RAISE WARNING 'ciftlik_app rolu RLS''i BYPASS EDIYOR. Uygulamayi bu rolle baglamayin; once NOBYPASSRLS''i superuser ile ayarlayin.';
  ELSE
    RAISE NOTICE '[ok] ciftlik_app RLS''e tabi (rolbypassrls = false).';
  END IF;
END
$$;
