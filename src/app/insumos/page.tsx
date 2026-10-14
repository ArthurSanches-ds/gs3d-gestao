import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/format";
import { getSuppliesWithBalance } from "@/server/supplies";

export const dynamic = "force-dynamic";

export default async function InsumosPage() {
  const supplies = await getSuppliesWithBalance();
  const outCount = supplies.filter((s) => s.isOut).length;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Insumos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {outCount === 0
              ? "Todos com estoque."
              : `${outCount} ${outCount === 1 ? "item sem estoque" : "itens sem estoque"}.`}
          </p>
        </div>
        <Link href="/insumos/novo" className={buttonVariants()}>
          Novo insumo
        </Link>
      </div>

      {supplies.length === 0 && (
        <p className="text-muted-foreground mt-6 text-sm">Nenhum insumo cadastrado.</p>
      )}

      <div className="mt-6 space-y-3">
        {supplies.map((supply) => (
          <Card key={supply.id}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{supply.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatMoney(supply.unitCost)} cada · pacote de {supply.packQuantity} por{" "}
                    {formatMoney(supply.packPrice)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="font-medium tabular-nums">{formatNumber(supply.balance)} un.</p>
                  {supply.isOut && <Badge variant="destructive">Sem estoque</Badge>}
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/insumos/${supply.id}/compra`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Comprei
                </Link>
                <Link
                  href={`/insumos/${supply.id}/contar`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Contar
                </Link>
                <Link
                  href={`/insumos/${supply.id}/editar`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Editar
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
