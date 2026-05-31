-- CreateEnum
CREATE TYPE "StructureType" AS ENUM ('BARN', 'COOP', 'STORAGE', 'OTHER');

-- CreateTable
CREATE TABLE "Structure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StructureType" NOT NULL,
    "posX" DOUBLE PRECISION,
    "posY" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Structure_pkey" PRIMARY KEY ("id")
);
