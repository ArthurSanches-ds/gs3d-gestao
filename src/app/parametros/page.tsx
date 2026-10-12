import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { SettingsForm } from "./settings-form";

// Sempre busca os dados na hora: parâmetro mudou, a tela mostra o novo
export const dynamic = "force-dynamic";

type NumericValue = { toString(): string };

// Valor do banco → como aparece no campo ("2500.5" → "2500,5")
function toInput(value: NumericValue) {
  return value.toString().replace(".", ",");
}

// Porcentagem do banco → como aparece no campo (0.1 → "10")
function toPercentInput(value: NumericValue) {
  return toInput(new Decimal(value.toString()).mul(100).toString());
}

export default async function ParametrosPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  if (!settings) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p>
          Nenhum parâmetro cadastrado. Rode <code>npm run db:seed</code>.
        </p>
      </main>
    );
  }

  const initialValues = {
    printerPrice: toInput(settings.printerPrice),
    printerLifetimeHours: String(settings.printerLifetimeHours),
    powerKw: toInput(settings.powerKw),
    energyTariff: toInput(settings.energyTariff),
    laborHourlyRate: toInput(settings.laborHourlyRate),
    defaultLaborMinutes: String(settings.defaultLaborMinutes),
    failureReserve: toPercentInput(settings.failureReserve),
    margin: toPercentInput(settings.margin),
    tax: toPercentInput(settings.tax),
    rentRate: toPercentInput(settings.rentRate),
    lowFilamentGrams: String(settings.lowFilamentGrams),
    salaryGoal: toInput(settings.salaryGoal),
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Parâmetros</h1>
      <SettingsForm initialValues={initialValues} />
    </main>
  );
}
