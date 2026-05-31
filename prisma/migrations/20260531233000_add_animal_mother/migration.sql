-- AlterTable
ALTER TABLE "Animal" ADD COLUMN "motherId" TEXT;

-- CreateIndex
CREATE INDEX "Animal_motherId_idx" ON "Animal"("motherId");

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
