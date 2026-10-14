import { describe, expect, it } from "vitest";
import { saleTotals } from "./sale";

const chaveiro = { quantity: 10, unitPrice: 7, unitCost: 2.8, commissionRate: 0, fixedFee: 0 };
const direct = { taxRate: 0, cardFeeRate: 0, passFeeToCustomer: false };

describe("totais da venda", () => {
  it("10 chaveiros no Pix a R$ 7: lucro de R$ 42", () => {
    const sale = saleTotals({ ...direct, items: [chaveiro] });
    expect(sale.revenue.toFixed(2)).toBe("70.00");
    expect(sale.fees.toFixed(2)).toBe("0.00");
    expect(sale.cost.toFixed(2)).toBe("28.00");
    expect(sale.profit.toFixed(2)).toBe("42.00");
  });

  it("2 chaveiros na Shopee a R$ 13,75: taxas de R$ 13,50 e lucro de R$ 8,40", () => {
    const shopee = {
      quantity: 2,
      unitPrice: 13.75,
      unitCost: 2.8,
      commissionRate: 0.2,
      fixedFee: 4,
    };
    const sale = saleTotals({ ...direct, items: [shopee] });
    expect(sale.revenue.toFixed(2)).toBe("27.50");
    expect(sale.fees.toFixed(2)).toBe("13.50");
    expect(sale.profit.toFixed(2)).toBe("8.40");
  });

  it("crédito 1x sem repassar: a taxa de 3,15% sai do lucro", () => {
    const sale = saleTotals({ ...direct, cardFeeRate: 0.0315, items: [chaveiro] });
    expect(sale.amountCharged.toFixed(2)).toBe("70.00");
    expect(sale.fees.toFixed(2)).toBe("2.21");
    expect(sale.profit.toFixed(2)).toBe("39.80");
  });

  it("crédito 1x repassando: o cliente paga a taxa e o lucro volta a R$ 42", () => {
    const sale = saleTotals({
      ...direct,
      cardFeeRate: 0.0315,
      passFeeToCustomer: true,
      items: [chaveiro],
    });
    expect(sale.amountCharged.toFixed(2)).toBe("72.28");
    expect(sale.profit.toFixed(2)).toBe("42.00");
  });

  it("imposto incide sobre o faturamento", () => {
    const sale = saleTotals({ ...direct, taxRate: 0.06, items: [chaveiro] });
    expect(sale.fees.toFixed(2)).toBe("4.20");
    expect(sale.profit.toFixed(2)).toBe("37.80");
  });

  it("vários itens na mesma venda somam", () => {
    const portaChaves = {
      quantity: 1,
      unitPrice: 30,
      unitCost: 12,
      commissionRate: 0,
      fixedFee: 0,
    };
    const sale = saleTotals({ ...direct, items: [chaveiro, portaChaves] });
    expect(sale.revenue.toFixed(2)).toBe("100.00");
    expect(sale.profit.toFixed(2)).toBe("60.00");
  });

  it("recusa venda sem itens", () => {
    expect(() => saleTotals({ ...direct, items: [] })).toThrow();
  });
});
