import Decimal from "decimal.js";

export type WeighInInput = {
  scaleGrams: Decimal.Value; // o que a balança marcou com o rolo aberto
  spoolTareGrams: Decimal.Value; // peso do carretel vazio
  closedRolls: number; // rolos lacrados que você ainda tem
  rollNetGrams: Decimal.Value; // peso líquido de um rolo fechado
};

export function weighInNetGrams(input: WeighInInput) {
  const scale = new Decimal(input.scaleGrams);
  const tare = new Decimal(input.spoolTareGrams);

  if (scale.lt(tare)) {
    throw new Error(
      `A balança marcou ${scale} g, menos que o carretel vazio (${tare} g). Confira o peso ou o carretel cadastrado.`,
    );
  }

  if (!Number.isInteger(input.closedRolls) || input.closedRolls < 0) {
    throw new Error("Rolos fechados precisa ser um número inteiro, zero ou mais.");
  }

  const openRoll = scale.minus(tare);
  const closedRolls = new Decimal(input.rollNetGrams).mul(input.closedRolls);

  return openRoll.plus(closedRolls);
}
