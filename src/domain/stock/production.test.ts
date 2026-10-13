import { describe, expect, it } from "vitest";
import { planProduction } from "./production";

const recortada = {
  piecesPerPlate: 5,
  filaments: [
    { filamentId: "branco", gramsPerPlate: 22.9 },
    { filamentId: "preto", gramsPerPlate: 1.6 },
    { filamentId: "marrom", gramsPerPlate: 8.7 },
  ],
};

describe("produção", () => {
  it("2 placas de chaveiro: sugere 10 peças", () => {
    const plan = planProduction({ ...recortada, plates: 2 });
    expect(plan.expectedPieces).toBe(10);
    expect(plan.goodPieces).toBe(10);
  });

  it("filamento sai pelas placas inteiras: 2 × 22,9 g de branco = 45,8 g", () => {
    const plan = planProduction({ ...recortada, plates: 2 });
    const branco = plan.consumption.find((c) => c.filamentId === "branco");
    expect(branco?.grams.toFixed(1)).toBe("45.8");
  });

  it("uma peça falhou: estoque recebe 9, mas o filamento é das 2 placas", () => {
    const plan = planProduction({ ...recortada, plates: 2, goodPieces: 9 });
    expect(plan.goodPieces).toBe(9);
    const preto = plan.consumption.find((c) => c.filamentId === "preto");
    expect(preto?.grams.toFixed(1)).toBe("3.2");
  });

  it("placa perdida inteira: 0 peças boas, filamento gasto mesmo assim", () => {
    const plan = planProduction({ ...recortada, plates: 1, goodPieces: 0 });
    expect(plan.goodPieces).toBe(0);
    expect(plan.consumption).toHaveLength(3);
  });

  it("recusa mais peças boas do que cabem nas placas", () => {
    expect(() => planProduction({ ...recortada, plates: 1, goodPieces: 6 })).toThrow();
  });

  it("recusa zero placas", () => {
    expect(() => planProduction({ ...recortada, plates: 0 })).toThrow();
  });
});
