import { describe, expect, it } from "vitest";
import { countAdjustment, supplyBalance } from "./supply";

describe("saldo de insumo", () => {
  it("soma compras e subtrai usos", () => {
    const movements = [{ quantity: 100 }, { quantity: -12 }, { quantity: -1 }];
    expect(supplyBalance(movements).toString()).toBe("87");
  });

  it("aceita frações (0,2 caixa por peça em kit)", () => {
    const movements = [{ quantity: 25 }, { quantity: "-0.6" }];
    expect(supplyBalance(movements).toString()).toBe("24.4");
  });

  it("sem movimentos, saldo zero", () => {
    expect(supplyBalance([]).toString()).toBe("0");
  });
});

describe("contagem de insumo", () => {
  it("sistema acha 100, contei 87: ajuste de −13", () => {
    expect(countAdjustment(100, 87).toString()).toBe("-13");
  });

  it("sistema acha 0, contei 50: ajuste de +50", () => {
    expect(countAdjustment(0, 50).toString()).toBe("50");
  });

  it("contagem igual ao saldo: ajuste zero", () => {
    expect(countAdjustment(40, 40).isZero()).toBe(true);
  });

  it("recusa contagem negativa", () => {
    expect(() => countAdjustment(10, -1)).toThrow();
  });
});
