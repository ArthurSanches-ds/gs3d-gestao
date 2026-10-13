import { prisma } from "@/lib/db";
import { ProductForm } from "./product-form";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const [filaments, supplies] = await Promise.all([
    prisma.filament.findMany({ where: { active: true }, orderBy: { color: "asc" } }),
    prisma.supply.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Novo produto</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Use os números do fatiamento da placa inteira.
      </p>

      <div className="mt-6">
        <ProductForm
          filamentOptions={filaments.map((f) => ({
            id: f.id,
            label: `${f.color} · ${f.brand} ${f.material}`,
          }))}
          supplyOptions={supplies.map((s) => ({ id: s.id, label: s.name }))}
        />
      </div>
    </main>
  );
}
