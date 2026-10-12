import { describe, expect, it } from "vitest";
import {
  filamentCostPerPiece,
  hourlyCostPerPiece,
  laborCostPerPiece,
  pieceCost,
  suppliesCostPerPiece,
} from "./piece";

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

describe("mão de obra e insumos por peça", () => {
  it("mão de obra: 5 min a R$ 20/h = R$ 1,67", () => {
    expect(laborCostPerPiece(5, 20).toFixed(2)).toBe("1.67");
  });

  it("insumos: 1 argola de R$ 0,2365 = R$ 0,24", () => {
    const supplies = [{ unitCost: 0.2365, quantityPerPiece: 1 }];
    expect(suppliesCostPerPiece(supplies).toFixed(2)).toBe("0.24");
  });
});

describe("custo total da peça", () => {
  const chaveiroRecortada = {
    filaments: [
      { gramsPerPlate: 22.9, costPerGram: 0.09 },
      { gramsPerPlate: 1.6, costPerGram: 0.09 },
      { gramsPerPlate: 8.7, costPerGram: 0.09 },
    ],
    piecesPerPlate: 5,
    plateMinutes: 113,
    energyCostPerHour: 0.08,
    wearCostPerHour: 0.5,
    laborMinutes: 5,
    laborHourlyRate: 20,
    supplies: [{ unitCost: 0.2365, quantityPerPiece: 1 }],
    failureReserve: 0.1,
  };

  it("reserva de falhas incide só sobre a impressão: R$ 0,90", () => {
    expect(pieceCost(chaveiroRecortada).print.toFixed(2)).toBe("0.90");
  });

  it("custo total do chaveiro fazendinha recortada = R$ 2,80", () => {
    expect(pieceCost(chaveiroRecortada).total.toFixed(2)).toBe("2.80");
  });
});