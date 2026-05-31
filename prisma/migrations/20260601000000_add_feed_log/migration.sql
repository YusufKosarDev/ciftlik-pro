-- CreateTable
CREATE TABLE "FeedLog" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedLog_inventoryItemId_idx" ON "FeedLog"("inventoryItemId");

-- AddForeignKey
ALTER TABLE "FeedLog" ADD CONSTRAINT "FeedLog_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
