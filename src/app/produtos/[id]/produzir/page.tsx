import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getFilamentsWithBalance } from "@/server/filaments";
import { ProductionForm } from "./production-form";

export const dynamic = "force-dynamic";

export default async function ProduzirPage({ params }: PageProps<"/produtos/[id]/produzir">) {
  const { id } = await params;

  const [product, filaments] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { filaments: { include: { filament: true } } },
    }),
    getFilamentsWithBalance(),
  ]);
  if (!product) notFound();

  // Saldo atual de cada cor, para a prévia
  const balanceById = new Map(filaments.map((f) => [f.id, f.balanceGrams]));

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Produzir</h1>
      <p className="text-muted-foreground mt-1 text-sm">{product.name}</p>

      <div className="mt-6">
        <ProductionForm
          productId={product.id}
          piecesPerPlate={product.piecesPerPlate}
          recipe={product.filaments.map((pf) => ({
            filamentId: pf.filamentId,
            color: pf.filament.color,
            gramsPerPlate: Number(pf.gramsPerPlate.toString()),
            balanceGrams: balanceById.get(pf.filamentId) ?? 0,
          }))}
        />
      </div>
    </main>
  );
}
