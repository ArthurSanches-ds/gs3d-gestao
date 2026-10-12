import { describe, expect, it } from "vitest";
import { filamentBalance, type FilamentMovementInput } from "./filament";

const at = (iso: string) => new Date(iso);

describe("saldo de filamento", () => {
  it("preto da planilha: pesagem de 712 g menos o consumo depois = 583,4 g", () => {
    const movements: FilamentMovementInput[] = [
      // Antes da pesagem: devem ser ignorados
      { type: "CONSUMPTION", grams: -2.7, occurredAt: at("2026-09-23T12:00:00-03:00") },
      { type: "CONSUMPTION", grams: -53.6, occurredAt: at("2026-09-23T12:00:00-03:00") },
      // Pesagem
      { type: "WEIGH_IN", grams: 712, occurredAt: at("2026-09-24T00:00:00-03:00") },
      // Depois da pesagem: devem ser descontados (total 128,6 g)
      { type: "CONSUMPTION", grams: -3.5, occurredAt: at("2026-09-24T12:00:00-03:00") },
      { type: "CONSUMPTION", grams: -3.5, occurredAt: at("2026-09-25T12:00:00-03:00") },
      { type: "CONSUMPTION", grams: -5.0, occurredAt: at("2026-09-27T12:00:00-03:00") },
      { type: "CONSUMPTION", grams: -81.5, occurredAt: at("2026-09-29T12:00:00-03:00") },
      { type: "CONSUMPTION", grams: -32.1, occurredAt: at("2026-10-07T12:00:00-03:00") },
      { type: "CONSUMPTION", grams: -2.1, occurredAt: at("2026-10-07T12:00:00-03:00") },
      { type: "CONSUMPTION", grams: -0.9, occurredAt: at("2026-10-07T12:00:00-03:00") },
    ];
    expect(filamentBalance(movements).toFixed(1)).toBe("583.4");
  });

  it("compra de rolo novo soma ao saldo", () => {
    const movements: FilamentMovementInput[] = [
      { type: "WEIGH_IN", grams: 100, occurredAt: at("2026-10-01T00:00:00-03:00") },
      { type: "PURCHASE", grams: 1000, occurredAt: at("2026-10-02T00:00:00-03:00") },
      { type: "CONSUMPTION", grams: -50, occurredAt: at("2026-10-03T00:00:00-03:00") },
    ];
    expect(filamentBalance(movements).toFixed(1)).toBe("1050.0");
  });

  it("sem pesagem, soma tudo desde o começo", () => {
    const movements: FilamentMovementInput[] = [
      { type: "PURCHASE", grams: 1000, occurredAt: at("2026-10-01T00:00:00-03:00") },
      { type: "CONSUMPTION", grams: -10, occurredAt: at("2026-10-02T00:00:00-03:00") },
    ];
    expect(filamentBalance(movements).toFixed(1)).toBe("990.0");
  });

  it("a ordem da lista não muda o resultado", () => {
    const movements: FilamentMovementInput[] = [
      { type: "CONSUMPTION", grams: -50, occurredAt: at("2026-10-03T00:00:00-03:00") },
      { type: "WEIGH_IN", grams: 100, occurredAt: at("2026-10-01T00:00:00-03:00") },
      { type: "PURCHASE", grams: 1000, occurredAt: at("2026-10-02T00:00:00-03:00") },
    ];
    expect(filamentBalance(movements).toFixed(1)).toBe("1050.0");
  });
});
