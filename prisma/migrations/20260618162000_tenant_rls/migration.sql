-- Cok-kiracilik RLS (Row-Level Security): her tenant-tablosunda satir bazli
-- izolasyon. Politika, app.tenant_id ayarli degilse (NULL) hicbir satira izin
-- vermez (fail-closed). NOT: superuser RLS'i bypass eder; uygulama uretimde
-- NON-SUPERUSER bir rolle baglanmalidir (bkz. docs/SAAS-PLAN.md).

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "AuditLog"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "User"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Task"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Animal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Animal" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Animal"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "HealthRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HealthRecord" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "HealthRecord"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Vaccination" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vaccination" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Vaccination"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Transaction"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "InventoryItem"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "FeedLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "FeedLog"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Field" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Field" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Field"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Crop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Crop" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Crop"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "MilkYield" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MilkYield" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "MilkYield"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "WeightRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeightRecord" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "WeightRecord"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "BreedingRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BreedingRecord" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "BreedingRecord"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Structure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Structure" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Structure"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Customer"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Sale"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Product"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Order"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "OrderItem"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

