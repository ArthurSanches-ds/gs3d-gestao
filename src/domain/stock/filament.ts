import Decimal from "decimal.js";

export type FilamentMovementInput = {
  type: "WEIGH_IN" | "PURCHASE" | "CONSUMPTION" | "ADJUSTMENT";
  grams: Decimal.Value;
  occurredAt: Date;
};

export function filamentBalance(movements: FilamentMovementInput[]) {
  // Copia e ordena por data, sem mexer na lista original
  const sorted = [...movements].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  let balance = new Decimal(0);

  for (const movement of sorted) {
    // Pesagem substitui o saldo; o resto soma (consumo já vem negativo)
    balance =
      movement.type === "WEIGH_IN" ? new Decimal(movement.grams) : balance.plus(movement.grams);
  }

  return balance;
}
