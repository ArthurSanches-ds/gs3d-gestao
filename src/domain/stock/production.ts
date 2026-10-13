import Decimal from "decimal.js";

export type ProductionInput = {
  piecesPerPlate: number;
  filaments: { filamentId: string; gramsPerPlate: Decimal.Value }[];
  plates: number;
  goodPieces?: number; // vazio = todas as peças saíram boas
};

export function planProduction(input: ProductionInput) {
  if (!Number.isInteger(input.plates) || input.plates < 1) {
    throw new Error("Informe pelo menos 1 placa.");
  }

  const expectedPieces = input.plates * input.piecesPerPlate;
  const goodPieces = input.goodPieces ?? expectedPieces;

  if (!Number.isInteger(goodPieces) || goodPieces < 0) {
    throw new Error("Peças boas precisa ser um número inteiro, zero ou mais.");
  }
  if (goodPieces > expectedPieces) {
    throw new Error(
      `${input.plates} ${input.plates === 1 ? "placa rende" : "placas rendem"} no máximo ${expectedPieces} peças.`,
    );
  }

  // O filamento sai pelas placas inteiras, mesmo que alguma peça tenha falhado
  const consumption = input.filaments.map((filament) => ({
    filamentId: filament.filamentId,
    grams: new Decimal(filament.gramsPerPlate).mul(input.plates),
  }));

  return { expectedPieces, goodPieces, consumption };
}
