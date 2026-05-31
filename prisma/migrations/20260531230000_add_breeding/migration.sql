-- CreateEnum
CREATE TYPE "BreedingStatus" AS ENUM ('PLANNED', 'PREGNANT', 'BORN', 'FAILED');

-- CreateTable
CREATE TABLE "BreedingRecord" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "sireTag" TEXT,
    "breedingDate" TIMESTAMP(3) NOT NULL,
    "expectedBirthDate" TIMESTAMP(3),
    "actualBirthDate" TIMESTAMP(3),
    "status" "BreedingStatus" NOT NULL DEFAULT 'PLANNED',
    "offspringCount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreedingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BreedingRecord_animalId_idx" ON "BreedingRecord"("animalId");

-- AddForeignKey
ALTER TABLE "BreedingRecord" ADD CONSTRAINT "BreedingRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
