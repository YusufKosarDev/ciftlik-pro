-- Invitation RLS: davet tablosu artik tenant-kapsamli.
--
-- ONCEKI DURUM: 20260618166000_invitations, "RLS ETKINLESTIRILMEZ" notuyla bu
-- tabloyu bilerek disarida birakmisti; gerekce, herkese acik kabul akisinin
-- daveti token ile, tenant baglami OLMADAN okumak zorunda olmasiydi. Bu, tenantId
-- tasiyan tek RLS'siz tablo demekti — yani "her tenant tablosu RLS altinda"
-- ifadesinin tek istisnasi.
--
-- SIMDIKI COZUM: Login'de kullanilan desenin ayni (bkz. 20260618167000_auth_lookup_function):
-- baglamsiz okuma, SECURITY DEFINER bir fonksiyona tasinir; tablonun kendisi RLS'e
-- alinir. Boylece istisna ortadan kalkar.

-- Token ile baglamsiz davet okumasi. Fonksiyon SAHIBININ (migration'i calistiran
-- owner/superuser; RLS'i bypass eder) yetkileriyle calisir.
--
-- Guvenlik: yalnizca token esitligiyle filtreler (tahmin edilemez sir; enumerasyona
-- yardim etmez) ve TOKEN'IN KENDISINI DONDURMEZ — cagiran zaten elinde tutar.
CREATE OR REPLACE FUNCTION invitation_by_token(p_token text)
RETURNS TABLE (
  id           text,
  "tenantId"   text,
  email        text,
  role         "Role",
  "expiresAt"  timestamp(3),
  "acceptedAt" timestamp(3)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i."id", i."tenantId", i."email", i."role", i."expiresAt", i."acceptedAt"
  FROM "Invitation" i
  WHERE i."token" = p_token
  LIMIT 1;
$$;

-- Diger 20 tenant tablosuyla ayni politika govdesi (bkz. 20260618162000_tenant_rls).
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Invitation"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
