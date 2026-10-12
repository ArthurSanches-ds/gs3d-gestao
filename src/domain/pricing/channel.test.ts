import { describe, expect, it } from "vitest";
import { suggestedPrice, suggestedPriceWithTiers } from "./channel";

const base = { cost: 2.8, margin: 1.5, discount: 0, tax: 0 };

describe("preço sugerido por canal", () => {
  it("venda direta: 2,80 × 2,5 = R$ 7,00", () => {
    const price = suggestedPrice({ ...base, commission: 0, fixedFee: 0 });
    expect(price.toFixed(2)).toBe("7.00");
  });

  it("venda direta com 10% de desconto = R$ 6,30", () => {
    const price = suggestedPrice({ ...base, discount: 0.1, commission: 0, fixedFee: 0 });
    expect(price.toFixed(2)).toBe("6.30");
  });

  it("Shopee: 20% + R$ 4 = R$ 13,75", () => {
    const price = suggestedPrice({ ...base, commission: 0.2, fixedFee: 4 });
    expect(price.toFixed(2)).toBe("13.75");
  });

  it("Mercado Livre: 12% + R$ 6,50 = R$ 15,34", () => {
    const price = suggestedPrice({ ...base, commission: 0.12, fixedFee: 6.5 });
    expect(price.toFixed(2)).toBe("15.34");
  });

  it("TikTok Shop: 16% + R$ 4 = R$ 13,10", () => {
    const price = suggestedPrice({ ...base, commission: 0.16, fixedFee: 4 });
    expect(price.toFixed(2)).toBe("13.10");
  });

  it("recusa comissão + imposto de 100% ou mais", () => {
    expect(() => suggestedPrice({ ...base, commission: 0.8, tax: 0.2, fixedFee: 0 })).toThrow();
  });
});

describe("preço com faixas (exemplo: Mercado Livre)", () => {
  const mercadoLivre = [
    { minPrice: 0, maxPrice: 79, commission: 0.12, fixedFee: 6.5 },
    { minPrice: 79, maxPrice: null, commission: 0.12, fixedFee: 0 },
  ];

  it("chaveiro cai na faixa 1: R$ 15,34", () => {
    const result = suggestedPriceWithTiers({ ...base, tiers: mercadoLivre });
    expect(result.price.toFixed(2)).toBe("15.34");
  });

  it("peça de R$ 100 limpo cai na faixa 2: R$ 113,64", () => {
    const result = suggestedPriceWithTiers({ ...base, cost: 40, tiers: mercadoLivre });
    expect(result.price.toFixed(2)).toBe("113.64");
  });

  it("peça entre as faixas vai para o piso da faixa 2: R$ 79,00", () => {
    const result = suggestedPriceWithTiers({ ...base, cost: 26, tiers: mercadoLivre });
    expect(result.price.toFixed(2)).toBe("79.00");
  });
});