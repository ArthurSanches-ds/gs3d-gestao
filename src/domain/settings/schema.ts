import Decimal from "decimal.js";
import { z } from "zod";
import { parseBrazilianNumber } from "@/lib/parse-number";

type Rules = {
  min?: number;
  minExclusive?: boolean; // true = precisa ser MAIOR que o mínimo (não pode ser igual)
  max?: number;
  maxExclusive?: boolean; // true = precisa ser MENOR que o máximo (não pode ser igual)
};

// Campo de número no padrão brasileiro, com limites opcionais
function decimalField(rules: Rules = {}) {
  return z.string().transform((raw, ctx) => {
    const parsed = parseBrazilianNumber(raw);
    if (parsed === null) {
      ctx.addIssue({ code: "custom", message: "Digite um número válido." });
      return z.NEVER;
    }

    const value = new Decimal(parsed);

    if (rules.min !== undefined) {
      const tooLow = rules.minExclusive ? value.lte(rules.min) : value.lt(rules.min);
      if (tooLow) {
        ctx.addIssue({
          code: "custom",
          message: rules.minExclusive
            ? `Precisa ser maior que ${rules.min}.`
            : `Não pode ser menor que ${rules.min}.`,
        });
        return z.NEVER;
      }
    }

    if (rules.max !== undefined) {
      const tooHigh = rules.maxExclusive ? value.gte(rules.max) : value.gt(rules.max);
      if (tooHigh) {
        ctx.addIssue({
          code: "custom",
          message: rules.maxExclusive
            ? `Precisa ser menor que ${rules.max}.`
            : `Não pode passar de ${rules.max}.`,
        });
        return z.NEVER;
      }
    }

    return parsed;
  });
}

// Número inteiro (horas, minutos, gramas)
function integerField(rules: Rules = {}) {
  return decimalField(rules).transform((value, ctx) => {
    if (!new Decimal(value).isInteger()) {
      ctx.addIssue({ code: "custom", message: "Use um número inteiro." });
      return z.NEVER;
    }
    return Number(value);
  });
}

// Porcentagem: você digita 10, o banco guarda 0.1
function percentField(rules: Rules = {}) {
  return decimalField(rules).transform((value) => new Decimal(value).div(100).toString());
}

export const settingsFormSchema = z.object({
  printerPrice: decimalField({ min: 0, minExclusive: true }),
  printerLifetimeHours: integerField({ min: 0, minExclusive: true }),
  powerKw: decimalField({ min: 0 }),
  energyTariff: decimalField({ min: 0 }),
  laborHourlyRate: decimalField({ min: 0 }),
  defaultLaborMinutes: integerField({ min: 0 }),
  failureReserve: percentField({ min: 0, max: 100 }),
  margin: percentField({ min: 0 }),
  tax: percentField({ min: 0, max: 100, maxExclusive: true }),
  rentRate: percentField({ min: 0, max: 100, maxExclusive: true }),
  lowFilamentGrams: integerField({ min: 0 }),
  salaryGoal: decimalField({ min: 0 }),
});

export type SettingsFormData = z.output<typeof settingsFormSchema>;
