import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saleTotals } from "@/domain/pricing/sale";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const str = (value: { toString(): string }) => value.toString();

export default async function VendasPage() {
  // Início do mês atual no horário de Brasília
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })
    .format(new Date())
    .split("-");
  const monthStart = new Date(`${year}-${month}-01T00:00:00-03:00`);

  const sales = await prisma.sale.findMany({
    where: { occurredAt: { gte: monthStart } },
    include: { channel: true, paymentMethod: true, items: { include: { product: true } } },
    orderBy: { occurredAt: "desc" },
  });

  // Recalcula cada venda com a fotografia guardada nela, não com os parâmetros de hoje
  const rows = sales.map((sale) => ({
    sale,
    totals: saleTotals({
      items: sale.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: str(item.unitPrice),
        unitCost: str(item.unitCost),
        commissionRate: str(item.commissionRate),
        fixedFee: str(item.fixedFee),
      })),
      taxRate: str(sale.taxRate),
      cardFeeRate: str(sale.cardFeeRate),
      passFeeToCustomer: sale.passFeeToCustomer,
    }),
  }));

  const revenue = rows.reduce((total, row) => total + row.totals.revenue.toNumber(), 0);
  const profit = rows.reduce((total, row) => total + row.totals.profit.toNumber(), 0);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendas do mês</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length} {rows.length === 1 ? "venda" : "vendas"} · faturamento{" "}
            {formatMoney(revenue)} · lucro {formatMoney(profit)}
          </p>
        </div>
        <Link href="/vendas/nova" className={buttonVariants()}>
          Nova venda
        </Link>
      </div>

      {rows.length === 0 && (
        <p className="text-muted-foreground mt-6 text-sm">Nenhuma venda neste mês ainda.</p>
      )}

      <div className="mt-6 space-y-3">
        {rows.map(({ sale, totals }) => (
          <Card key={sale.id}>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {sale.occurredAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}{" "}
                    · {sale.channel.name}
                    {sale.paymentMethod ? ` · ${sale.paymentMethod.name}` : ""}
                  </p>
                  {sale.customerName && (
                    <p className="text-muted-foreground">{sale.customerName}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums">
                    {formatMoney(totals.revenue.toNumber())}
                  </p>
                  <p className="text-muted-foreground tabular-nums">
                    lucro {formatMoney(totals.profit.toNumber())}
                  </p>
                </div>
              </div>
              <ul className="text-muted-foreground">
                {sale.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.product.name} a{" "}
                    {formatMoney(Number(str(item.unitPrice)))}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
