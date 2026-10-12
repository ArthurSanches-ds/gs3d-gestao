import { describe, expect, it } from "vitest";
import { energyCostPerHour, wearCostPerHour } from "./machine";

describe("custos por hora da impressora", () => {
  it("desgaste: R$ 2.500 em 5.000 h = R$ 0,50 por hora", () => {
    expect(wearCostPerHour(2500, 5000).toFixed(2)).toBe("0.50");
  });

  it("energia: 0,08 kW × R$ 1,00/kWh = R$ 0,08 por hora", () => {
    expect(energyCostPerHour(0.08, 1).toFixed(2)).toBe("0.08");
  });

  it("recusa vida útil zero", () => {
    expect(() => wearCostPerHour(2500, 0)).toThrow();
  });
});
