import Decimal from "decimal.js";

export type PriceInput = {
  cost: Decimal.Value;
  margin: Decimal.Value;
  discount: Decimal.Value;
  commission: Decimal.Value;
  fixedFee: Decimal.Value;
  tax: Decimal.Value;
};

export type FeeTier = {
  minPrice: Decimal.Value;
  maxPrice: Decimal.Value | null;
  commission: Decimal.Value;
  fixedFee: Decimal.Value;
};

export type TieredPriceInput = Omit<PriceInput, "commission" | "fixedFee"> & {
  tiers: FeeTier[];
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

export function suggestedPriceWithTiers(input: TieredPriceInput) {
  const { tiers, ...rest } = input;
  let best: { price: Decimal; tier: FeeTier } | null = null;

  for (const tier of tiers) {
    const computed = suggestedPrice({ ...rest, commission: tier.commission, fixedFee: tier.fixedFee });

    // Se o preço não chega ao piso da faixa, sobe até o piso
    const price = Decimal.max(computed, tier.minPrice);

    const fitsTier = tier.maxPrice === null || price.lt(tier.maxPrice);
    if (fitsTier && (best === null || price.lt(best.price))) {
      best = { price, tier };
    }
  }

  if (best === null) {
    throw new Error("Nenhuma faixa de taxa serve para esse preço. Confira as faixas do canal.");
  }

  return best;
}