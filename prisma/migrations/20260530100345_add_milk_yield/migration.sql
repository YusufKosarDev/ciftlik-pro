-- CreateTable
CREATE TABLE "MilkYield" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilkYield_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MilkYield_animalId_idx" ON "MilkYield"("animalId");

-- AddForeignKey
ALTER TABLE "MilkYield" ADD CONSTRAINT "MilkYield_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
