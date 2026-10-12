import { describe, expect, it } from "vitest";
import { filamentCostPerPiece, hourlyCostPerPiece } from "./piece";

describe("custo de filamento por peça", () => {
  it("chaveiro fazendinha recortada: 33,2 g na placa, 5 peças = R$ 0,60", () => {
    const filaments = [
      { gramsPerPlate: 22.9, costPerGram: 0.09 }, // branco
      { gramsPerPlate: 1.6, costPerGram: 0.09 }, // preto
      { gramsPerPlate: 8.7, costPerGram: 0.09 }, // marrom claro
    ];
    expect(filamentCostPerPiece(filaments, 5).toFixed(2)).toBe("0.60");
  });

  it("recusa placa com zero peças", () => {
    expect(() => filamentCostPerPiece([], 0)).toThrow();
  });
});

describe("energia e desgaste por peça", () => {
  it("energia: R$ 0,08/h, placa de 113 min, 5 peças = R$ 0,03", () => {
    expect(hourlyCostPerPiece(0.08, 113, 5).toFixed(2)).toBe("0.03");
  });

  it("desgaste: R$ 0,50/h, placa de 113 min, 5 peças = R$ 0,19", () => {
    expect(hourlyCostPerPiece(0.5, 113, 5).toFixed(2)).toBe("0.19");
  });
});