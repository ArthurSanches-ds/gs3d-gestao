-- CreateEnum
CREATE TYPE "FilamentMovementType" AS ENUM ('WEIGH_IN', 'PURCHASE', 'CONSUMPTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SupplyMovementType" AS ENUM ('PURCHASE', 'USE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "Filament" (
    "id" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "material" TEXT NOT NULL DEFAULT 'PLA',
    "rollPrice" DECIMAL(10,2) NOT NULL,
    "rollNetGrams" INTEGER NOT NULL DEFAULT 1000,
    "spoolTareGrams" DECIMAL(7,1) NOT NULL DEFAULT 200,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Filament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilamentMovement" (
    "id" TEXT NOT NULL,
    "filamentId" TEXT NOT NULL,
    "type" "FilamentMovementType" NOT NULL,
    "grams" DECIMAL(8,1) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilamentMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "packPrice" DECIMAL(10,2) NOT NULL,
    "packQuantity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyMovement" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "type" "SupplyMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Filament_color_brand_material_key" ON "Filament"("color", "brand", "material");

-- CreateIndex
CREATE INDEX "FilamentMovement_filamentId_occurredAt_idx" ON "FilamentMovement"("filamentId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Supply_name_key" ON "Supply"("name");

-- CreateIndex
CREATE INDEX "SupplyMovement_supplyId_occurredAt_idx" ON "SupplyMovement"("supplyId", "occurredAt");

-- AddForeignKey
ALTER TABLE "FilamentMovement" ADD CONSTRAINT "FilamentMovement_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "Filament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyMovement" ADD CONSTRAINT "SupplyMovement_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
