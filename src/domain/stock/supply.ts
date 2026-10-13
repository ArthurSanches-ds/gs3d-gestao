import Decimal from "decimal.js";

export type SupplyMovementInput = {
  quantity: Decimal.Value; // compra positiva, uso negativo, ajuste com sinal
};

export function supplyBalance(movements: SupplyMovementInput[]) {
  return movements.reduce((total, movement) => total.plus(movement.quantity), new Decimal(0));
}

// Quanto ajustar para o saldo do sistema bater com a contagem da gaveta
export function countAdjustment(currentBalance: Decimal.Value, counted: Decimal.Value) {
  const countedValue = new Decimal(counted);
  if (countedValue.lt(0)) {
    throw new Error("A contagem não pode ser negativa.");
  }
  return countedValue.minus(currentBalance);
}
