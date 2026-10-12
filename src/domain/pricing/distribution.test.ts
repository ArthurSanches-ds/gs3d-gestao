import { describe, expect, it } from "vitest";
import { distributeProfit } from "./distribution";

const buckets = [
  { key: "farmFund", rate: 0.3 },
  { key: "ads", rate: 0.15 },
  { key: "equipment", rate: 0.1 },
  { key: "reserve", rate: 0.05 },
  { key: "salary", rate: 0.4 },
];

const month = {
  revenue: 1000,
  fees: 50,
  costs: 400,
  laborCost: 200,
  wearCost: 20,
  fixedExpenses: 0,
  rentRate: 0.1,
  buckets,
  salaryGoal: 2000,
};

describe("distribuição do lucro do mês", () => {
  it("lucro = faturamento − taxas − custos − despesas fixas", () => {
    expect(distributeProfit(month).profit.toFixed(2)).toBe("550.00");
  });

  it("aluguel sai antes da distribuição: 10% de 550 = R$ 55", () => {
    const result = distributeProfit(month);
    expect(result.rent.toFixed(2)).toBe("55.00");
    expect(result.distributable.toFixed(2)).toBe("495.00");
  });

  it("salário = mão de obra + 40% da sobra = R$ 398", () => {
    expect(distributeProfit(month).salary.toFixed(2)).toBe("398.00");
  });

  it("fundo da impressora = desgaste + 30% da sobra = R$ 168,50", () => {
    expect(distributeProfit(month).farmFund.toFixed(2)).toBe("168.50");
  });

  it("falta R$ 1.602 para a meta de R$ 2.000", () => {
    expect(distributeProfit(month).remainingToGoal.toFixed(2)).toBe("1602.00");
  });

  it("lucro necessário para bater a meta = R$ 5.000", () => {
    expect(distributeProfit(month).profitNeededForGoal.toFixed(2)).toBe("5000.00");
  });

  it("mês no prejuízo: aluguel e distribuição zerados", () => {
    const result = distributeProfit({ ...month, revenue: 300 });
    expect(result.profit.toFixed(2)).toBe("-150.00");
    expect(result.rent.toFixed(2)).toBe("0.00");
    expect(result.distributable.toFixed(2)).toBe("0.00");
  });

  it("recusa porcentagens que não somam 100%", () => {
    const wrong = [{ key: "salary", rate: 0.5 }];
    expect(() => distributeProfit({ ...month, buckets: wrong })).toThrow();
  });
});
