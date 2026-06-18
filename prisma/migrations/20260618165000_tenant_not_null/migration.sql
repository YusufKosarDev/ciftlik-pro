-- Cok-kiracilik Faz 1 tamamlama: tenantId NOT NULL sikilastirmasi.
-- Kapsam: 17 veri tablosu. HARIC tutulanlar (nullable kalir):
--   * AuditLog  — LOGIN_FAILED gibi sistem kayitlarinin tenant'i olmayabilir.
--   * Order / OrderItem — per-tenant vitrin (public checkout) Faz 4'e ertelendi.
-- Her tablo icin once savunmaci backfill (kalan NULL'lari varsayilan tenant'a
-- ata), ardindan SET NOT NULL. Backfill migration zaten doldurmus olsa da bu,
-- gocun bagimsiz/idempotent calismasini garantiler.

UPDATE "User" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Task" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Task" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Animal" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Animal" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "HealthRecord" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "HealthRecord" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Vaccination" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Vaccination" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Transaction" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "InventoryItem" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "InventoryItem" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "FeedLog" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "FeedLog" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Field" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Field" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Crop" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Crop" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "MilkYield" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "MilkYield" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "WeightRecord" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "WeightRecord" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "BreedingRecord" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "BreedingRecord" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Structure" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Structure" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Customer" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Customer" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Sale" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Sale" ALTER COLUMN "tenantId" SET NOT NULL;

UPDATE "Product" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;
