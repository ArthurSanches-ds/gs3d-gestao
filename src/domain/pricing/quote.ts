import Decimal from "decimal.js";
import { suggestedPriceWithTiers, type FeeTier } from "./channel";
import { cardPayment } from "./payment";

export type QuotePaymentMethod = { name: string; feeRate: Decimal.Value; installments: number };

export type QuoteInput = {
  unitCost: Decimal.Value;
  quantity: number;
  margin: Decimal.Value;
  discount: Decimal.Value;
  tax: Decimal.Value;
  tiers: FeeTier[];
  paymentMethods: QuotePaymentMethod[]; // vazio para marketplace
};

export function buildQuote(input: QuoteInput) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("A quantidade precisa ser um número inteiro maior que zero.");
  }

  const base = { cost: input.unitCost, tax: input.tax, tiers: input.tiers };

  // Preço que o cliente vê: arredondado para centavos antes de multiplicar
  const suggested = suggestedPriceWithTiers({
    ...base,
    margin: input.margin,
    discount: input.discount,
  });
  const unitPrice = suggested.price.toDecimalPlaces(2);
  const total = unitPrice.mul(input.quantity);

  // Preço mínimo: só cobre custo e taxas, sem lucro (arredondado para cima)
  const minimum = suggestedPriceWithTiers({ ...base, margin: 0, discount: 0 });
  const minUnitPrice = minimum.price.toDecimalPlaces(2, Decimal.ROUND_UP);

  // Lucro com o preço arredondado e a faixa em que ele realmente cai
  const tier = suggested.tier;
  const fees = total
    .mul(tier.commission)
    .plus(new Decimal(tier.fixedFee).mul(input.quantity))
    .plus(total.mul(input.tax));
  const cost = new Decimal(input.unitCost).mul(input.quantity);
  const profit = total.minus(fees).minus(cost);

  // Tabela para o cliente: cada forma de pagamento com a taxa repassada
  const payments = input.paymentMethods.map((method) => {
    const payment = cardPayment({
      amount: total,
      feeRate: method.feeRate,
      installments: method.installments,
      passFeeToCustomer: true,
    });
    return {
      name: method.name,
      installments: method.installments,
      total: payment.total.toDecimalPlaces(2),
      installmentValue: payment.installmentValue.toDecimalPlaces(2),
    };
  });

  return { unitPrice, total, minUnitPrice, profit, payments };
}
