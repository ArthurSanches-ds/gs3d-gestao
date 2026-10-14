import Decimal from "decimal.js";
import { cardPayment } from "./payment";

export type SaleItemInput = {
  quantity: number;
  unitPrice: Decimal.Value; // preço cobrado por peça
  unitCost: Decimal.Value; // custo por peça na fotografia
  commissionRate: Decimal.Value; // comissão do canal (0,2 = 20%)
  fixedFee: Decimal.Value; // taxa fixa do canal por peça
};

export type SaleInput = {
  items: SaleItemInput[];
  taxRate: Decimal.Value;
  cardFeeRate: Decimal.Value; // 0 para Pix, dinheiro e marketplaces
  passFeeToCustomer: boolean;
};

export function saleTotals(input: SaleInput) {
  if (input.items.length === 0) {
    throw new Error("A venda precisa de pelo menos um item.");
  }

  let itemsTotal = new Decimal(0);
  let channelFees = new Decimal(0);
  let cost = new Decimal(0);

  for (const item of input.items) {
    const lineTotal = new Decimal(item.unitPrice).mul(item.quantity);
    itemsTotal = itemsTotal.plus(lineTotal);
    channelFees = channelFees
      .plus(lineTotal.mul(item.commissionRate))
      .plus(new Decimal(item.fixedFee).mul(item.quantity));
    cost = cost.plus(new Decimal(item.unitCost).mul(item.quantity));
  }

  // Mesma regra da tela de orçamento: repassando, o cliente paga a taxa da maquininha
  const card = cardPayment({
    amount: itemsTotal,
    feeRate: input.cardFeeRate,
    installments: 1,
    passFeeToCustomer: input.passFeeToCustomer,
  });

  const revenue = card.total;
  const tax = revenue.mul(input.taxRate);
  const fees = channelFees.plus(card.fee).plus(tax);
  const profit = revenue.minus(fees).minus(cost);

  return {
    itemsTotal,
    amountCharged: card.total,
    revenue,
    channelFees,
    cardFee: card.fee,
    tax,
    fees,
    cost,
    profit,
  };
}
