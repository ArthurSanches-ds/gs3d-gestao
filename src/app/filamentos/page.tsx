import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/format";
import { getFilamentsWithBalance } from "@/server/filaments";

export const dynamic = "force-dynamic";

export default async function FilamentosPage() {
  const filaments = await getFilamentsWithBalance();
  const lowCount = filaments.filter((f) => f.isLow).length;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Filamentos</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {lowCount === 0
          ? "Nenhuma cor abaixo do alerta."
          : `${lowCount} ${lowCount === 1 ? "cor acabando" : "cores acabando"}.`}
      </p>

      {filaments.length === 0 && (
        <p className="text-muted-foreground mt-6 text-sm">Nenhum filamento cadastrado.</p>
      )}

      <div className="mt-6 space-y-3">
        {filaments.map((filament) => {
          // Quanto do rolo ainda resta, de 0 a 100%
          const percent = Math.min(
            100,
            Math.max(0, (filament.balanceGrams / filament.rollNetGrams) * 100),
          );

          return (
            <Card key={filament.id}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{filament.color}</p>
                    <p className="text-muted-foreground text-xs">
                      {filament.brand} · {filament.material} · {formatMoney(filament.costPerGram)}/g
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-medium tabular-nums">
                      {formatNumber(filament.balanceGrams, 1)} g
                    </p>
                    {filament.isLow && <Badge variant="destructive">Acabando</Badge>}
                  </div>
                </div>

                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${filament.isLow ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/filamentos/${filament.id}/compra`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Comprei
                  </Link>
                  <Link
                    href={`/filamentos/${filament.id}/pesar`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Pesar
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
