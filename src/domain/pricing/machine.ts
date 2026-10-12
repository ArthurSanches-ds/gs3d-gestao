import Decimal from "decimal.js";

export function wearCostPerHour(printerPrice: Decimal.Value, lifetimeHours: Decimal.Value) {
  if (new Decimal(lifetimeHours).lte(0)) {
    throw new Error("A vida útil precisa ser maior que zero.");
  }
  return new Decimal(printerPrice).div(lifetimeHours);
}
export function energyCostPerHour(consumptionKw: Decimal.Value, tariffPerKwh: Decimal.Value) {
  return new Decimal(consumptionKw).mul(tariffPerKwh);
}
