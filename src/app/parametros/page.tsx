import { prisma } from "@/lib/db";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

// Sempre busca os dados na hora: parâmetro mudou, a tela mostra o novo
export const dynamic = "force-dynamic";

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

  const groups = [
    {
      title: "Impressora e energia",
      items: [
        ["Preço da impressora + AMS", formatMoney(settings.printerPrice)],
        ["Vida útil", `${formatNumber(settings.printerLifetimeHours)} h`],
        ["Consumo médio", `${formatNumber(settings.powerKw, 3)} kW`],
        ["Tarifa de energia", `${formatMoney(settings.energyTariff)}/kWh`],
      ],
    },
    {
      title: "Mão de obra",
      items: [
        ["Valor da sua hora", formatMoney(settings.laborHourlyRate)],
        ["Mão de obra padrão por peça", `${settings.defaultLaborMinutes} min`],
      ],
    },
    {
      title: "Preço",
      items: [
        ["Reserva para falhas", formatPercent(settings.failureReserve, 1)],
        ["Margem sobre o custo", formatPercent(settings.margin, 0)],
        ["Imposto", formatPercent(settings.tax, 1)],
      ],
    },
    {
      title: "Lucro",
      items: [
        ["Aluguel (sobre o lucro)", formatPercent(settings.rentRate, 1)],
        ["Meta de salário", formatMoney(settings.salaryGoal)],
      ],
    },
    {
      title: "Estoque",
      items: [["Alerta de filamento abaixo de", `${settings.lowFilamentGrams} g`]],
    },
  ];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Parâmetros</h1>

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <section key={group.title} className="rounded-lg border p-4">
            <h2 className="mb-3 font-semibold">{group.title}</h2>
            <dl className="space-y-2">
              {group.items.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </main>
  );
}
