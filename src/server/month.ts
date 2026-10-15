import Decimal from "decimal.js";
import { distributeProfit } from "@/domain/pricing/distribution";
import { saleTotals } from "@/domain/pricing/sale";
import { prisma } from "@/lib/db";

const str = (value: { toString(): string }) => value.toString();

// Primeiro dia do mês atual e do próximo, no horário de Brasília
function currentMonthRange() {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })
    .format(new Date())
    .split("-")
    .map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    start: new Date(`${year}-${pad(month)}-01T00:00:00-03:00`),
    end: new Date(`${nextYear}-${pad(nextMonth)}-01T00:00:00-03:00`),
    label: new Date(year, month - 1, 15).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }),
  };
}

export async function getMonthSummary() {
  const range = currentMonthRange();

  const [settings, buckets, expenses, sales] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.profitBucket.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.fixedExpense.findMany({ where: { active: true } }),
    prisma.sale.findMany({
      where: { occurredAt: { gte: range.start, lt: range.end } },
      include: { items: true },
    }),
  ]);
  if (!settings) throw new Error("Parâmetros não cadastrados.");

  let revenue = new Decimal(0);
  let fees = new Decimal(0);
  let costs = new Decimal(0);
  let laborCost = new Decimal(0);
  let wearCost = new Decimal(0);

  for (const sale of sales) {
    // Cada venda com a fotografia dela, não com os parâmetros de hoje
    const totals = saleTotals({
      items: sale.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: str(item.unitPrice),
        unitCost: str(item.unitCost),
        commissionRate: str(item.commissionRate),
        fixedFee: str(item.fixedFee),
      })),
      taxRate: str(sale.taxRate),
      cardFeeRate: str(sale.cardFeeRate),
      passFeeToCustomer: sale.passFeeToCustomer,
    });
    revenue = revenue.plus(totals.revenue);
    fees = fees.plus(totals.fees);
    costs = costs.plus(totals.cost);

    for (const item of sale.items) {
      laborCost = laborCost.plus(new Decimal(str(item.unitLaborCost)).mul(item.quantity));
      wearCost = wearCost.plus(new Decimal(str(item.unitWearCost)).mul(item.quantity));
    }
  }

  const fixedExpenses = expenses.reduce(
    (total, e) => total.plus(str(e.monthlyAmount)),
    new Decimal(0),
  );

  const distribution = distributeProfit({
    revenue,
    fees,
    costs,
    laborCost,
    wearCost,
    fixedExpenses,
    rentRate: str(settings.rentRate),
    buckets: buckets.map((b) => ({ key: b.key, rate: str(b.rate) })),
    salaryGoal: str(settings.salaryGoal),
  });

  // Números comuns só para exibir na tela
  const n = (value: Decimal) => value.toNumber();

  return {
    label: range.label,
    salesCount: sales.length,
    revenue: n(revenue),
    fees: n(fees),
    costs: n(costs),
    fixedExpenses: n(fixedExpenses),
    profit: n(distribution.profit),
    rent: n(distribution.rent),
    salary: n(distribution.salary),
    laborCost: n(laborCost),
    farmFund: n(distribution.farmFund),
    wearCost: n(wearCost),
    salaryGoal: Number(str(settings.salaryGoal)),
    remainingToGoal: n(distribution.remainingToGoal),
    profitNeededForGoal: distribution.profitNeededForGoal
      ? n(distribution.profitNeededForGoal)
      : null,
    // Os outros destinos (tráfego, equipamentos, reserva), com nome e valor
    otherBuckets: buckets
      .filter((b) => b.key !== "salary" && b.key !== "farmFund")
      .map((b) => ({ name: b.name, amount: n(distribution.amounts[b.key] ?? new Decimal(0)) })),
  };
}

export type MonthSummary = Awaited<ReturnType<typeof getMonthSummary>>;
