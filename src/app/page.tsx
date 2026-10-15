import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatMoney, formatNumber } from "@/lib/format";
import { getFilamentsWithBalance } from "@/server/filaments";
import { getMonthSummary } from "@/server/month";
import { getSuppliesWithBalance } from "@/server/supplies";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [month, filaments, supplies, suppliesInUse] = await Promise.all([
    getMonthSummary(),
    getFilamentsWithBalance(),
    getSuppliesWithBalance(),
    // Insumos que aparecem na receita de algum produto ativo
    prisma.productSupply.findMany({
      where: { product: { archived: false } },
      select: { supplyId: true },
      distinct: ["supplyId"],
    }),
  ]);

  const lowFilaments = filaments.filter((f) => f.isLow);
  // Só alerta insumo que algum produto usa: os outros não fazem falta hoje
  const usedSupplyIds = new Set(suppliesInUse.map((s) => s.supplyId));
  const outSupplies = supplies.filter((s) => s.isOut && usedSupplyIds.has(s.id));
  const goalPercent =
    month.salaryGoal > 0 ? Math.min(100, (month.salary / month.salaryGoal) * 100) : 0;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Resumo de {month.label}</h1>
          <p className="text-muted-foreground text-sm">
            {month.salesCount} {month.salesCount === 1 ? "venda" : "vendas"} no mês
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/orcamento" className={buttonVariants({ variant: "outline" })}>
            Orçamento
          </Link>
          <Link href="/vendas/nova" className={buttonVariants()}>
            Nova venda
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Faturamento" value={formatMoney(month.revenue)} />
        <Stat label="Lucro" value={formatMoney(month.profit)} negative={month.profit < 0} />
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-medium">Seu salário</p>
            <p className="text-xl font-bold tabular-nums">{formatMoney(month.salary)}</p>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full" style={{ width: `${goalPercent}%` }} />
          </div>
          <p className="text-muted-foreground text-sm">
            {month.remainingToGoal > 0
              ? `Faltam ${formatMoney(month.remainingToGoal)} para a meta de ${formatMoney(month.salaryGoal)}.`
              : `Meta de ${formatMoney(month.salaryGoal)} batida!`}
            {month.remainingToGoal > 0 && month.profitNeededForGoal !== null && (
              <> O mês precisa de {formatMoney(month.profitNeededForGoal)} de lucro.</>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 text-sm">
          <p className="mb-1 font-medium">Para onde vai o dinheiro</p>
          <Line label="Faturamento" value={month.revenue} />
          <Line label="Taxas (canais, maquininha e imposto)" value={-month.fees} />
          <Line label="Custo das peças vendidas" value={-month.costs} />
          {month.fixedExpenses > 0 && <Line label="Despesas fixas" value={-month.fixedExpenses} />}
          <Line label="Lucro" value={month.profit} strong />

          <div className="my-2 border-t" />

          <Line label="Aluguel (casa)" value={month.rent} />
          <Line
            label={`Seu salário (inclui ${formatMoney(month.laborCost)} de mão de obra)`}
            value={month.salary}
          />
          <Line
            label={`Fundo da próxima impressora (inclui ${formatMoney(month.wearCost)} de desgaste)`}
            value={month.farmFund}
          />
          {month.otherBuckets.map((bucket) => (
            <Line key={bucket.name} label={bucket.name} value={bucket.amount} />
          ))}
        </CardContent>
      </Card>

      {(lowFilaments.length > 0 || outSupplies.length > 0) && (
        <Card>
          <CardContent className="space-y-2 text-sm">
            <p className="text-destructive font-medium">Comprar logo</p>
            {lowFilaments.map((f) => (
              <Link
                key={f.id}
                href="/filamentos"
                className="flex justify-between gap-4 hover:underline"
              >
                <span>Filamento {f.color}</span>
                <span className="tabular-nums">{formatNumber(f.balanceGrams, 1)} g</span>
              </Link>
            ))}
            {outSupplies.map((s) => (
              <Link
                key={s.id}
                href="/insumos"
                className="flex justify-between gap-4 hover:underline"
              >
                <span>{s.name}</span>
                <span>sem estoque</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function Stat({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className={`text-xl font-bold tabular-nums ${negative ? "text-destructive" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-4 ${strong ? "font-medium" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{formatMoney(value)}</span>
    </div>
  );
}
