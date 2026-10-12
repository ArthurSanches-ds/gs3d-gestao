import Decimal from "decimal.js";

export type PriceInput = {
  cost: Decimal.Value;
  margin: Decimal.Value;
  discount: Decimal.Value;
  commission: Decimal.Value;
  fixedFee: Decimal.Value;
  tax: Decimal.Value;
};

export function suggestedPrice(input: PriceInput) {
  const one = new Decimal(1);

  // Parte do preço que fica com você depois da comissão e do imposto
  const keptShare = one.minus(input.commission).minus(input.tax);
  if (keptShare.lte(0)) {
    throw new Error("Comissão + imposto precisam somar menos de 100%.");
  }

  const priceBeforeFees = new Decimal(input.cost)
    .mul(one.plus(input.margin))
    .mul(one.minus(input.discount));

  return priceBeforeFees.plus(input.fixedFee).div(keptShare);
}