-- AuditLog RLS: tenant'siz SISTEM kayitlarina (orn. LOGIN_FAILED, auth oncesi)
-- izin ver. Okuma yine tenant-kapsamli (USING). Yazmada tenantId NULL kabul edilir.
DROP POLICY IF EXISTS "tenant_isolation" ON "AuditLog";
CREATE POLICY "tenant_isolation" ON "AuditLog"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK (
    "tenantId" = current_setting('app.tenant_id', true)
    OR "tenantId" IS NULL
  );
