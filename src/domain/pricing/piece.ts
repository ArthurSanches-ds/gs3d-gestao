import Decimal from "decimal.js";

export type FilamentUsage = {
  gramsPerPlate: Decimal.Value;
  costPerGram: Decimal.Value;
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