type NumericValue = number | { toString(): string };

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatMoney(value: NumericValue) {
  return moneyFormatter.format(Number(value.toString()));
}

export function formatPercent(value: NumericValue, fractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value.toString()));
}

export function formatNumber(value: NumericValue, fractionDigits = 0) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value.toString()));
}
