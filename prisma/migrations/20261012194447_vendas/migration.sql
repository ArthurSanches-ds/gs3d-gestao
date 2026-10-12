/*
  Warnings:

  - You are about to alter the column `quantity` on the `SupplyMovement` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(8,2)`.

*/
-- AlterTable
ALTER TABLE "ProductMovement" ADD COLUMN     "saleItemId" TEXT;

-- AlterTable
ALTER TABLE "SupplyMovement" ADD COLUMN     "saleItemId" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(8,2);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT,
    "channelId" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "passFeeToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "cardFeeRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "cardFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountCharged" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(10,4) NOT NULL,
    "unitLaborCost" DECIMAL(10,4) NOT NULL,
    "unitWearCost" DECIMAL(10,4) NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "fixedFee" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sale_occurredAt_idx" ON "Sale"("occurredAt");

-- AddForeignKey
ALTER TABLE "SupplyMovement" ADD CONSTRAINT "SupplyMovement_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMovement" ADD CONSTRAINT "ProductMovement_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "SalesChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
