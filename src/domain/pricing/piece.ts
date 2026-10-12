import Decimal from "decimal.js";

export type FilamentUsage = {
  gramsPerPlate: Decimal.Value;
  costPerGram: Decimal.Value;
};

export type SupplyUsage = {
  unitCost: Decimal.Value;
  quantityPerPiece: Decimal.Value;
};

export type PieceCostInput = {
  filaments: FilamentUsage[];
  piecesPerPlate: Decimal.Value;
  plateMinutes: Decimal.Value;
  energyCostPerHour: Decimal.Value;
  wearCostPerHour: Decimal.Value;
  laborMinutes: Decimal.Value;
  laborHourlyRate: Decimal.Value;
  supplies: SupplyUsage[];
  failureReserve: Decimal.Value;
};

function assertPiecesPerPlate(piecesPerPlate: Decimal.Value) {
  if (new Decimal(piecesPerPlate).lte(0)) {
    throw new Error("A placa precisa ter pelo menos 1 peça.");
  }
}

export function filamentCostPerPiece(filaments: FilamentUsage[], piecesPerPlate: Decimal.Value) {
  assertPiecesPerPlate(piecesPerPlate);

  const plateCost = filaments.reduce(
    (total, filament) => total.plus(new Decimal(filament.gramsPerPlate).mul(filament.costPerGram)),
    new Decimal(0),
  );

  return plateCost.div(piecesPerPlate);
}

export function hourlyCostPerPiece(
  costPerHour: Decimal.Value,
  plateMinutes: Decimal.Value,
  piecesPerPlate: Decimal.Value,
) {
  assertPiecesPerPlate(piecesPerPlate);

  return new Decimal(costPerHour).mul(plateMinutes).div(60).div(piecesPerPlate);
}

export function laborCostPerPiece(laborMinutes: Decimal.Value, laborHourlyRate: Decimal.Value) {
  return new Decimal(laborMinutes).mul(laborHourlyRate).div(60);
}

export function suppliesCostPerPiece(supplies: SupplyUsage[]) {
  return supplies.reduce(
    (total, supply) => total.plus(new Decimal(supply.unitCost).mul(supply.quantityPerPiece)),
    new Decimal(0),
  );
}

export function pieceCost(input: PieceCostInput) {
  const filament = filamentCostPerPiece(input.filaments, input.piecesPerPlate);
  const energy = hourlyCostPerPiece(input.energyCostPerHour, input.plateMinutes, input.piecesPerPlate);
  const wear = hourlyCostPerPiece(input.wearCostPerHour, input.plateMinutes, input.piecesPerPlate);

  // Reserva de falhas só sobre o que se perde quando a placa falha
  const print = filament.plus(energy).plus(wear).mul(new Decimal(1).plus(input.failureReserve));

  const labor = laborCostPerPiece(input.laborMinutes, input.laborHourlyRate);
  const supplies = suppliesCostPerPiece(input.supplies);
  const total = print.plus(labor).plus(supplies);

  return { filament, energy, wear, print, labor, supplies, total };
}