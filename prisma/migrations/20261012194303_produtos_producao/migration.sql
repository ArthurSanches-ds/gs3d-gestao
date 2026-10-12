-- CreateEnum
CREATE TYPE "ProductMovementType" AS ENUM ('PRODUCTION', 'SALE', 'ADJUSTMENT', 'LOSS');

-- AlterTable
ALTER TABLE "FilamentMovement" ADD COLUMN     "productionRunId" TEXT;

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "piecesPerPlate" INTEGER NOT NULL,
    "plateMinutes" INTEGER NOT NULL,
    "laborMinutes" INTEGER,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFilament" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "filamentId" TEXT NOT NULL,
    "gramsPerPlate" DECIMAL(8,1) NOT NULL,

    CONSTRAINT "ProductFilament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSupply" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "quantityPerPiece" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "ProductSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionRun" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "plates" INTEGER NOT NULL,
    "goodPieces" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "ProductMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "productionRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductFilament_productId_filamentId_key" ON "ProductFilament"("productId", "filamentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupply_productId_supplyId_key" ON "ProductSupply"("productId", "supplyId");

-- CreateIndex
CREATE INDEX "ProductMovement_productId_occurredAt_idx" ON "ProductMovement"("productId", "occurredAt");

-- AddForeignKey
ALTER TABLE "FilamentMovement" ADD CONSTRAINT "FilamentMovement_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "ProductionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFilament" ADD CONSTRAINT "ProductFilament_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFilament" ADD CONSTRAINT "ProductFilament_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "Filament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupply" ADD CONSTRAINT "ProductSupply_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupply" ADD CONSTRAINT "ProductSupply_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionRun" ADD CONSTRAINT "ProductionRun_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMovement" ADD CONSTRAINT "ProductMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMovement" ADD CONSTRAINT "ProductMovement_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "ProductionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
