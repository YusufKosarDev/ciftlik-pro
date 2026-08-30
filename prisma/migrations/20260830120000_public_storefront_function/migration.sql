-- Herkese acik magaza dizini icin RLS-bypass eden tenant listesi.
--
-- SORUN: /magaza dizini, satista urunu olan TUM ciftlikleri listeler. Bu okuma
-- tasarim geregi KIRACILAR ARASIDIR ve ziyaretci giris yapmamistir, yani
-- app.tenant_id baglami ayarlanamaz. Product tablosunda RLS (FORCE) etkin
-- oldugundan, non-superuser uygulama rolu baglam olmadan 0 satir gorur → dizin
-- uretimde her zaman bos gorunurdu.
--
-- COZUM: Login ve davet okumasindaki desenin ayni (bkz. migration
-- 20260618167000_auth_lookup_function ve 20260826120000_invitation_rls).
-- SECURITY DEFINER bir fonksiyon, SAHIBININ (migration'i calistiran owner rol;
-- RLS'i bypass eder) yetkileriyle calisir ve yalnizca dizinin ihtiyac duydugu
-- alanlari dondurur. Boylece Product tablosunun politikasi zayiflatilmaz ve
-- 21 tablodaki tek tip tenant_isolation politikasi bozulmaz.
--
-- GUVENLIK:
--   1) "Product" tablosu YALNIZCA bir EXISTS alt sorgusunda gecer ve o alt
--      sorgunun secim listesi sabit 1'dir. Hicbir urun alani (ad, aciklama,
--      fiyat, birim) fonksiyondan disari cikamaz — sizacak bir sutun yok.
--   2) active = false olan urun tenant'i listeye SOKMAZ; kosul alt sorgunun
--      icindedir, yani "en az bir AKTIF urun" semantigi korunur.
--   3) Donen uc alan zaten herkese acik vitrin kimligidir: /magaza/[slug]
--      sayfasi ayni ad ve slug'i oturumsuz ziyaretciye gosterir (Tenant tablosu
--      RLS disidir). Fonksiyon yeni bir bilgi acmiyor, yalnizca hangi
--      ciftliklerin katalogunu yayinladigini soyluyor.
--   4) Parametre almaz: enumerasyon ya da kullaniciya bagli filtre yuzeyi yok.

CREATE OR REPLACE FUNCTION public_storefront_tenants()
RETURNS TABLE (
  id   text,
  name text,
  slug text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t."id", t."name", t."slug"
  FROM "Tenant" t
  WHERE EXISTS (
    SELECT 1
    FROM "Product" p
    WHERE p."tenantId" = t."id"
      AND p."active" = true
  )
  ORDER BY t."name" ASC;
$$;
