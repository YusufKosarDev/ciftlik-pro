-- CreateEnum
CREATE TYPE "AnimalSpecies" AS ENUM ('CATTLE', 'SHEEP', 'GOAT', 'CHICKEN', 'OTHER');

-- CreateEnum
CREATE TYPE "AnimalGender" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('ACTIVE', 'SOLD', 'DECEASED');

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT,
    "species" "AnimalSpecies" NOT NULL,
    "breed" TEXT,
    "gender" "AnimalGender" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "status" "AnimalStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Animal_tagNumber_key" ON "Animal"("tagNumber");
