import Decimal from "decimal.js";

export type ProfitBucket = {
  key: string;
  rate: Decimal.Value;
};

export type MonthInput = {
  revenue: Decimal.Value;
  fees: Decimal.Value;
  costs: Decimal.Value;
  laborCost: Decimal.Value;
  wearCost: Decimal.Value;
  fixedExpenses: Decimal.Value;
  rentRate: Decimal.Value;
  buckets: ProfitBucket[];
  salaryGoal: Decimal.Value;
};

export function distributeProfit(input: MonthInput) {
  const totalRate = input.buckets.reduce(
    (total, bucket) => total.plus(bucket.rate),
    new Decimal(0),
  );
  if (!totalRate.eq(1)) {
    throw new Error(
      `Os destinos do lucro precisam somar 100% (hoje somam ${totalRate.mul(100).toFixed(1)}%).`,
    );
  }

  const rentRate = new Decimal(input.rentRate);
  if (rentRate.lt(0) || rentRate.gte(1)) {
    throw new Error("O aluguel precisa ficar entre 0% e 100% do lucro.");
  }

  const profit = new Decimal(input.revenue)
    .minus(input.fees)
    .minus(input.costs)
    .minus(input.fixedExpenses);

  // Mês no prejuízo não paga aluguel nem distribui nada
  const positiveProfit = Decimal.max(profit, 0);
  const rent = positiveProfit.mul(rentRate);
  const distributable = positiveProfit.minus(rent);

  const amounts: Record<string, Decimal> = {};
  for (const bucket of input.buckets) {
    amounts[bucket.key] = distributable.mul(bucket.rate);
  }

  // Mão de obra vai para o salário; desgaste vai para o fundo da impressora
  const salary = new Decimal(input.laborCost).plus(amounts.salary ?? 0);
  const farmFund = new Decimal(input.wearCost).plus(amounts.farmFund ?? 0);

  const goal = new Decimal(input.salaryGoal);
  const remainingToGoal = Decimal.max(goal.minus(salary), 0);

  const salaryRate = new Decimal(input.buckets.find((b) => b.key === "salary")?.rate ?? 0);
  const neededFromBucket = Decimal.max(goal.minus(input.laborCost), 0);
  const profitNeededForGoal = salaryRate.isZero()
    ? null
    : neededFromBucket.div(new Decimal(1).minus(rentRate)).div(salaryRate);

  return {
    profit,
    rent,
    distributable,
    amounts,
    salary,
    farmFund,
    remainingToGoal,
    profitNeededForGoal,
  };
}
