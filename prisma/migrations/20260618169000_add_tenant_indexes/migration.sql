-- Performans: her tenant-tablosunda tenantId uzerine index. RLS politikasi ve
-- forTenant, her sorguya "tenantId = ..." filtresi enjekte ettiginden bu index
-- tenant-kapsamli okumalari hizlandirir.
--
-- Haric: Animal (zaten @@unique([tenantId, tagNumber]) tenantId-onculu index
-- saglar) ve Invitation (zaten tenantId index'i var).

CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "Task_tenantId_idx" ON "Task"("tenantId");
CREATE INDEX "HealthRecord_tenantId_idx" ON "HealthRecord"("tenantId");
CREATE INDEX "Vaccination_tenantId_idx" ON "Vaccination"("tenantId");
CREATE INDEX "Transaction_tenantId_idx" ON "Transaction"("tenantId");
CREATE INDEX "InventoryItem_tenantId_idx" ON "InventoryItem"("tenantId");
CREATE INDEX "FeedLog_tenantId_idx" ON "FeedLog"("tenantId");
CREATE INDEX "Field_tenantId_idx" ON "Field"("tenantId");
CREATE INDEX "Crop_tenantId_idx" ON "Crop"("tenantId");
CREATE INDEX "MilkYield_tenantId_idx" ON "MilkYield"("tenantId");
CREATE INDEX "WeightRecord_tenantId_idx" ON "WeightRecord"("tenantId");
CREATE INDEX "BreedingRecord_tenantId_idx" ON "BreedingRecord"("tenantId");
CREATE INDEX "Structure_tenantId_idx" ON "Structure"("tenantId");
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");
CREATE INDEX "Sale_tenantId_idx" ON "Sale"("tenantId");
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");
CREATE INDEX "OrderItem_tenantId_idx" ON "OrderItem"("tenantId");
