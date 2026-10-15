import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { toggleFixedExpense } from "./actions";

export const dynamic = "force-dynamic";

export default async function DespesasPage() {
  const expenses = await prisma.fixedExpense.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  const monthlyTotal = expenses
    .filter((e) => e.active)
    .reduce((total, e) => total + Number(e.monthlyAmount.toString()), 0);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Despesas fixas</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatMoney(monthlyTotal)} por mês, descontados do lucro antes da distribuição.
          </p>
        </div>
        <Link href="/despesas/nova" className={buttonVariants()}>
          Nova despesa
        </Link>
      </div>

      {expenses.length === 0 && (
        <p className="text-muted-foreground mt-6 text-sm">
          Nenhuma despesa cadastrada. O aluguel fica nos Parâmetros, como porcentagem do lucro.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className={expense.active ? "" : "opacity-60"}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{expense.name}</p>
                <p className="text-muted-foreground text-sm tabular-nums">
                  {formatMoney(Number(expense.monthlyAmount.toString()))} por mês
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!expense.active && <Badge variant="secondary">Desativada</Badge>}
                <Link
                  href={`/despesas/${expense.id}/editar`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Editar
                </Link>
                <form action={toggleFixedExpense}>
                  <input type="hidden" name="expenseId" value={expense.id} />
                  <Button type="submit" variant="outline" size="sm">
                    {expense.active ? "Desativar" : "Reativar"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
