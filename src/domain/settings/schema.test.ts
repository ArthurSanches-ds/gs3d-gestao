import { describe, expect, it } from "vitest";
import { z } from "zod";
import { settingsFormSchema } from "./schema";

// Exatamente como você digitaria no formulário
const valid = {
  printerPrice: "2.500,00",
  printerLifetimeHours: "5000",
  powerKw: "0,080",
  energyTariff: "1,00",
  laborHourlyRate: "20",
  defaultLaborMinutes: "5",
  failureReserve: "10",
  margin: "150",
  tax: "0",
  rentRate: "10",
  lowFilamentGrams: "150",
  salaryGoal: "2.000",
};

function fieldErrors(input: Record<string, string>): Record<string, string[] | undefined> {
  const result = settingsFormSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("validação dos parâmetros", () => {
  it("aceita os valores da planilha e converte para o formato do banco", () => {
    const result = settingsFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.printerPrice).toBe("2500.00");
    expect(result.data.powerKw).toBe("0.080");
    expect(result.data.printerLifetimeHours).toBe(5000);
    expect(result.data.margin).toBe("1.5"); // 150% → 1,5
    expect(result.data.failureReserve).toBe("0.1"); // 10% → 0,1
  });

  it("recusa texto onde deveria ter número", () => {
    expect(fieldErrors({ ...valid, printerPrice: "abc" }).printerPrice).toBeDefined();
  });

  it("recusa vida útil zero", () => {
    expect(fieldErrors({ ...valid, printerLifetimeHours: "0" }).printerLifetimeHours).toBeDefined();
  });

  it("recusa minutos quebrados", () => {
    expect(fieldErrors({ ...valid, defaultLaborMinutes: "5,5" }).defaultLaborMinutes).toBeDefined();
  });

  it("recusa aluguel de 100% ou mais", () => {
    expect(fieldErrors({ ...valid, rentRate: "100" }).rentRate).toBeDefined();
  });

  it("recusa reserva de falhas acima de 100%", () => {
    expect(fieldErrors({ ...valid, failureReserve: "150" }).failureReserve).toBeDefined();
  });
});
