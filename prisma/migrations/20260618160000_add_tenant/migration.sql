-- Cok-kiracilik (SaaS) Faz 1 — additive: Tenant tablosu + her tabloya nullable
-- tenantId kolonu. FK / index / unique-degisiklikleri / RLS sonraki adimlarda.

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- AlterTable (her tenant-kapsamli tabloya nullable tenantId)
ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Task" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Animal" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "HealthRecord" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Vaccination" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "FeedLog" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Field" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Crop" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "MilkYield" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WeightRecord" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "BreedingRecord" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Structure" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Sale" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Product" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Order" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "tenantId" TEXT;
