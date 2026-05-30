-- CreateEnum
CREATE TYPE "CropStatus" AS ENUM ('PLANTED', 'GROWING', 'HARVESTED');

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plantedDate" TIMESTAMP(3) NOT NULL,
    "harvestDate" TIMESTAMP(3),
    "status" "CropStatus" NOT NULL DEFAULT 'PLANTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Crop_fieldId_idx" ON "Crop"("fieldId");

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
