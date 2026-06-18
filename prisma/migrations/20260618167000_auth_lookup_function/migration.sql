-- Login icin RLS-bypass eden e-posta aramasi (Faz 2).
--
-- Sorun: Kimlik dogrulama (authorize) tenant BILINMEDEN, yani app.tenant_id
-- baglami AYARLANMADAN once kullaniciyi e-postayla bulmak zorundadir. User
-- tablosunda RLS (FORCE) etkin oldugundan, non-superuser uygulama rolu baglam
-- olmadan 0 satir gorur → giris hep basarisiz olurdu.
--
-- Cozum: SECURITY DEFINER bir fonksiyon. Fonksiyon, SAHIBININ (migration'i
-- calistiran ayricalikli/owner rol; RLS'i bypass eder) yetkileriyle calisir ve
-- yalnizca tek bir e-postayla eslesince minimal alanlari dondurur. Boylece giris
-- tum tenant'lar arasinda calisir; RLS izolasyonu diger tum yollarda korunur.
--
-- Guvenlik: fonksiyon yalnizca e-posta esitligiyle filtreler (kesfe/enumerasyona
-- yardim etmez) ve parolanin HASH'ini doner (bcrypt.compare icin gerekli; duz
-- metin degil). EXECUTE varsayilan olarak PUBLIC'tedir; uygulama rolu cagirabilir.

CREATE OR REPLACE FUNCTION auth_user_by_email(p_email text)
RETURNS TABLE (
  id            text,
  name          text,
  email         text,
  password      text,
  role          "Role",
  "tenantId"    text,
  "onboardedAt" timestamp(3)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u."id", u."name", u."email", u."password", u."role", u."tenantId", u."onboardedAt"
  FROM "User" u
  WHERE u."email" = p_email
  LIMIT 1;
$$;
