-- Uretim icin NON-SUPERUSER uygulama rolu — Postgres RLS'in GERCEKTEN uygulanmasi
-- icin sarttir. Superuser ve (FORCE olmadan) tablo sahibi RLS'i bypass eder; bu
-- yuzden uygulama, asagidaki en-az-yetkili rolle baglanmalidir. Tablolarda
-- FORCE ROW LEVEL SECURITY etkin oldugundan, bu rol icin tenant_isolation
-- politikasi DAIMA uygulanir (bkz. migration 20260618162000_tenant_rls).
--
-- Idempotent: tekrar calistirilabilir. Superuser veya veritabani sahibi ile,
-- uygulama veritabanina bagliyken calistirin:
--
--   psql "$DIRECT_URL" -v app_pw='GUCLU_BIR_PAROLA' -f prisma/rls-app-role.sql
--
-- Ardindan uygulamanin DATABASE_URL ve DIRECT_URL'lerini bu rolle baglanacak
-- sekilde guncelleyin (ornek icin docs/PRODUCTION-RLS.md).

\set app_role ciftlik_app

-- 1) Rol yoksa olustur (parola sonraki adimda atanir).
SELECT format('CREATE ROLE %I LOGIN', :'app_role')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

-- 2) Guvenlik nitelikleri + parola. Bu rol ASLA RLS'i bypass etmemeli.
ALTER ROLE :"app_role"
  WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD :'app_pw';

-- 3) Veritabani/sema erisimi (db adi ortamla degisir; current_database ile portatif).
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_role')
\gexec
GRANT USAGE ON SCHEMA public TO :"app_role";

-- 4) Tablo/sekans yetkileri (DDL haric; rol sema degistiremez).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_role";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_role";

-- 5) Gelecekte (migration ile) eklenecek tablo/sekanslar icin de otomatik yetki.
--    Varsayilan yetkiler, nesneleri olusturan rol (sema sahibi) icin tanimlanir.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"app_role";

-- Dogrulama: rolun bypassrls=false ve superuser=false oldugunu gosterir.
SELECT rolname, rolsuper, rolbypassrls
FROM pg_roles WHERE rolname = :'app_role';
