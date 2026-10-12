import { describe, expect, it } from "vitest";
import { cardPayment } from "./payment";

const amount = 544.64;

describe("pagamento na maquininha", () => {
  it("Pix 0%: cliente paga R$ 544,64", () => {
    const result = cardPayment({ amount, feeRate: 0, installments: 1, passFeeToCustomer: true });
    expect(result.total.toFixed(2)).toBe("544.64");
  });

  it("débito repassado 1,37%: cliente paga R$ 552,21", () => {
    const result = cardPayment({ amount, feeRate: 0.0137, installments: 1, passFeeToCustomer: true });
    expect(result.total.toFixed(2)).toBe("552.21");
    expect(result.netReceived.toFixed(2)).toBe("544.64");
  });

  it("crédito 10x repassado 11,06%: R$ 612,37 em 10x de R$ 61,24", () => {
    const result = cardPayment({ amount, feeRate: 0.1106, installments: 10, passFeeToCustomer: true });
    expect(result.total.toFixed(2)).toBe("612.37");
    expect(result.installmentValue.toFixed(2)).toBe("61.24");
  });

  it("crédito 1x sem repassar 3,15%: você recebe R$ 527,48", () => {
    const result = cardPayment({ amount, feeRate: 0.0315, installments: 1, passFeeToCustomer: false });
    expect(result.total.toFixed(2)).toBe("544.64");
    expect(result.fee.toFixed(2)).toBe("17.16");
    expect(result.netReceived.toFixed(2)).toBe("527.48");
  });

  it("recusa taxa de 100% ou mais", () => {
    expect(() =>
      cardPayment({ amount, feeRate: 1, installments: 1, passFeeToCustomer: true }),
    ).toThrow();
  });

  it("recusa zero parcelas", () => {
    expect(() =>
      cardPayment({ amount, feeRate: 0, installments: 0, passFeeToCustomer: true }),
    ).toThrow();
  });
});