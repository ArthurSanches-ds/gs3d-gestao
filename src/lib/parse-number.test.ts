import { describe, expect, it } from "vitest";
import { parseBrazilianNumber } from "./parse-number";

describe("leitura de número digitado no padrão brasileiro", () => {
  it.each([
    ["2500", "2500"],
    ["2.500,00", "2500.00"],
    ["2500,5", "2500.5"],
    ["0,080", "0.080"],
    ["R$ 20,00", "20.00"],
    ["10%", "10"],
    ["  150  ", "150"],
    ["1.000", "1000"],
    ["0.08", "0.08"],
  ])('"%s" vira %s', (input, expected) => {
    expect(parseBrazilianNumber(input)).toBe(expected);
  });

  it.each([[""], ["   "], ["abc"], ["1,2,3"], ["R$"]])('"%s" é inválido', (input) => {
    expect(parseBrazilianNumber(input)).toBeNull();
  });
});
