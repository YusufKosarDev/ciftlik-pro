-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "customer" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_transactionId_key" ON "Sale"("transactionId");

-- CreateIndex
CREATE INDEX "Sale_date_idx" ON "Sale"("date");
