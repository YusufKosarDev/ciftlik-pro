-- Cok-kiracilik backfill: mevcut tum veriyi tek bir varsayilan tenant'a atar.
-- (Bos string yerine sabit id; idempotent — ON CONFLICT DO NOTHING.)

INSERT INTO "Tenant" ("id", "name", "slug", "plan", "createdAt")
VALUES ('default-tenant', 'Varsayilan Ciftlik', 'default', 'FREE', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

UPDATE "AuditLog" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "User" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Task" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Animal" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "HealthRecord" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Vaccination" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Transaction" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "InventoryItem" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "FeedLog" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Field" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Crop" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "MilkYield" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "WeightRecord" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "BreedingRecord" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Structure" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Customer" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Sale" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Product" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Order" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "OrderItem" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
