import { describe, expect, it } from "vitest";
import { buildQuote } from "./quote";

const direct = [{ minPrice: 0, maxPrice: null, commission: 0, fixedFee: 0 }];
const shopee = [{ minPrice: 0, maxPrice: null, commission: 0.2, fixedFee: 4 }];
const payments = [
  { name: "Pix", feeRate: 0, installments: 1 },
  { name: "Débito", feeRate: 0.0137, installments: 1 },
  { name: "Crédito 10x", feeRate: 0.1106, installments: 10 },
];

// Custo exato do chaveiro fazendinha tábuas, como o sistema calcula
const tabuasCost = "2.8350866666666666667";

describe("orçamento", () => {
  const quote = buildQuote({
    unitCost: tabuasCost,
    quantity: 80,
    margin: 1.5,
    discount: 0.1,
    tax: 0,
    tiers: direct,
    paymentMethods: payments,
  });

  it("80 chaveiros com 10% de desconto: R$ 6,38 cada, total de R$ 510,40", () => {
    expect(quote.unitPrice.toFixed(2)).toBe("6.38");
    expect(quote.total.toFixed(2)).toBe("510.40");
  });

  it("preço mínimo sem lucro: R$ 2,84", () => {
    expect(quote.minUnitPrice.toFixed(2)).toBe("2.84");
  });

  it("lucro do orçamento: R$ 283,59", () => {
    expect(quote.profit.toFixed(2)).toBe("283.59");
  });

  it("tabela para o cliente com a taxa repassada", () => {
    expect(
      quote.payments.map((p) => [p.name, p.total.toFixed(2), p.installmentValue.toFixed(2)]),
    ).toEqual([
      ["Pix", "510.40", "510.40"],
      ["Débito", "517.49", "517.49"],
      ["Crédito 10x", "573.87", "57.39"],
    ]);
  });

  it("Shopee: 5 chaveiros a R$ 13,75, mínimo de R$ 8,50 e lucro de R$ 21", () => {
    const shopeeQuote = buildQuote({
      unitCost: 2.8,
      quantity: 5,
      margin: 1.5,
      discount: 0,
      tax: 0,
      tiers: shopee,
      paymentMethods: [],
    });
    expect(shopeeQuote.unitPrice.toFixed(2)).toBe("13.75");
    expect(shopeeQuote.total.toFixed(2)).toBe("68.75");
    expect(shopeeQuote.minUnitPrice.toFixed(2)).toBe("8.50");
    expect(shopeeQuote.profit.toFixed(2)).toBe("21.00");
    expect(shopeeQuote.payments).toHaveLength(0);
  });

  it("recusa quantidade zero", () => {
    expect(() =>
      buildQuote({
        unitCost: 2.8,
        quantity: 0,
        margin: 1.5,
        discount: 0,
        tax: 0,
        tiers: direct,
        paymentMethods: [],
      }),
    ).toThrow();
  });
});
