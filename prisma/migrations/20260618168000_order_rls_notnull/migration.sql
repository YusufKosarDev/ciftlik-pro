-- Faz 4: Order/OrderItem per-tenant vitrin. RLS (ENABLE+FORCE + tenant_isolation)
-- bu tablolarda ZATEN etkindir (ilk RLS migration'i 20 tabloyu kapsamisti); burada
-- yalnizca daha once ertelenen tenantId NOT NULL sikilastirmasi yapilir.
--
-- Savunmaci backfill: kalan NULL satirlari (eski tek-tenant siparisler) varsayilan
-- tenant'a atanir; ardindan SET NOT NULL.

UPDATE "Order" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "OrderItem" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "tenantId" SET NOT NULL;
