import Decimal from "decimal.js";

export type CardPaymentInput = {
  amount: Decimal.Value;
  feeRate: Decimal.Value;
  installments: number;
  passFeeToCustomer: boolean;
};

export function cardPayment(input: CardPaymentInput) {
  const amount = new Decimal(input.amount);
  const feeRate = new Decimal(input.feeRate);

  if (feeRate.gte(1)) {
    throw new Error("A taxa da maquininha precisa ser menor que 100%.");
  }
  if (!Number.isInteger(input.installments) || input.installments < 1) {
    throw new Error("O número de parcelas precisa ser um inteiro maior que zero.");
  }

  // Repassando: cobra a mais para que, depois da taxa, sobre o valor cheio
  const total = input.passFeeToCustomer ? amount.div(new Decimal(1).minus(feeRate)) : amount;

  const fee = total.mul(feeRate);
  const netReceived = total.minus(fee);
  const installmentValue = total.div(input.installments);

  return { total, fee, netReceived, installmentValue };
}