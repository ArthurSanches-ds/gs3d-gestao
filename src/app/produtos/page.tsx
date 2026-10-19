import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/db";
import { getProductsWithCost } from "@/server/products";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const [products, archived] = await Promise.all([
    getProductsWithCost(),
    prisma.product.findMany({
      where: { archived: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Custo por peça e preço sugerido em cada canal, calculados com os Parâmetros atuais.
          </p>
        </div>
        <Link href="/produtos/novo" className={buttonVariants()}>
          Novo produto
        </Link>
      </div>

      {products.length === 0 && (
        <p className="text-muted-foreground mt-6 text-sm">Nenhum produto cadastrado.</p>
      )}

      <div className="mt-6 space-y-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {product.piecesPerPlate} por placa · {formatNumber(product.minutesPerPiece)} min
                    e {formatNumber(product.gramsPerPiece, 1)} g por peça
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm tabular-nums">{product.stock} em estoque</p>
                  {product.isCustom && <Badge variant="secondary">Personalizado</Badge>}
                </div>
              </div>

              <details className="rounded-lg border p-3 text-sm">
                <summary className="cursor-pointer font-medium">
                  Custo por peça: {formatMoney(product.cost.total)}
                </summary>
                <dl className="text-muted-foreground mt-3 space-y-1">
                  <CostLine label="Filamento" value={product.cost.filament} />
                  <CostLine label="Energia" value={product.cost.energy} />
                  <CostLine label="Desgaste da impressora" value={product.cost.wear} />
                  <CostLine
                    label="Impressão com reserva de falhas"
                    value={product.cost.print}
                    strong
                  />
                  <CostLine
                    label={`Mão de obra (${product.laborMinutes} min${product.usesDefaultLabor ? ", padrão" : ""})`}
                    value={product.cost.labor}
                  />
                  <CostLine label="Insumos" value={product.cost.supplies} />
                </dl>
              </details>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {product.prices.map((item) => (
                  <div key={item.channelId} className="bg-muted rounded-lg p-2">
                    <p className="text-muted-foreground text-xs">{item.channel}</p>
                    <p className="font-medium tabular-nums">
                      {item.price === null ? "—" : formatMoney(item.price)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/produtos/${product.id}/produzir`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  + Produzir
                </Link>
                <Link
                  href={`/produtos/${product.id}/editar`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Editar
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {archived.length > 0 && (
        <section className="mt-10 border-t pt-6">
          <h2 className="font-medium">Arquivados</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Para trazer de volta, abra e desmarque &quot;Arquivar&quot;.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {archived.map((product) => (
              <li key={product.id}>
                <Link href={`/produtos/${product.id}/editar`} className="underline">
                  {product.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function CostLine({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-foreground font-medium" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatMoney(value)}</dd>
    </div>
  );
}
