import { describe, expect, it } from "vitest";
import { weighInNetGrams } from "./weigh-in";

describe("pesagem de filamento", () => {
  it("branco da planilha: 1.082 g na balança − 200 g de carretel = 882 g", () => {
    const net = weighInNetGrams({
      scaleGrams: 1082,
      spoolTareGrams: 200,
      closedRolls: 0,
      rollNetGrams: 1000,
    });
    expect(net.toFixed(1)).toBe("882.0");
  });

  it("rolo aberto + 2 rolos fechados: (450 − 200) + 2 × 1.000 = 2.250 g", () => {
    const net = weighInNetGrams({
      scaleGrams: 450,
      spoolTareGrams: 200,
      closedRolls: 2,
      rollNetGrams: 1000,
    });
    expect(net.toFixed(1)).toBe("2250.0");
  });

  it("aceita gramas com casa decimal na balança", () => {
    const net = weighInNetGrams({
      scaleGrams: "912.5",
      spoolTareGrams: 200,
      closedRolls: 0,
      rollNetGrams: 1000,
    });
    expect(net.toFixed(1)).toBe("712.5");
  });

  it("recusa balança mais leve que o carretel vazio", () => {
    expect(() =>
      weighInNetGrams({ scaleGrams: 150, spoolTareGrams: 200, closedRolls: 0, rollNetGrams: 1000 }),
    ).toThrow();
  });

  it("recusa rolos fechados negativos", () => {
    expect(() =>
      weighInNetGrams({
        scaleGrams: 500,
        spoolTareGrams: 200,
        closedRolls: -1,
        rollNetGrams: 1000,
      }),
    ).toThrow();
  });
});
