import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateProduct } from "../../actions";
import { ProductForm } from "../../novo/product-form";

export const dynamic = "force-dynamic";

const toInput = (value: { toString(): string }) => value.toString().replace(".", ",");

export default async function EditarProdutoPage({ params }: PageProps<"/produtos/[id]/editar">) {
  const { id } = await params;

  const [product, filaments, supplies] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { filaments: true, supplies: true } }),
    prisma.filament.findMany({ where: { active: true }, orderBy: { color: "asc" } }),
    prisma.supply.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Editar produto</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Mudanças valem para orçamentos e vendas daqui pra frente. Vendas já registradas não mudam.
      </p>

      <div className="mt-6">
        <ProductForm
          action={updateProduct}
          submitLabel="Salvar"
          productId={product.id}
          initialValues={{
            name: product.name,
            piecesPerPlate: String(product.piecesPerPlate),
            // 113 min → 1 h e 53 min
            plateHours: String(Math.floor(product.plateMinutes / 60)),
            plateMinutes: String(product.plateMinutes % 60),
            laborMinutes: product.laborMinutes === null ? "" : String(product.laborMinutes),
            isCustom: product.isCustom ? "on" : "",
            archived: product.archived ? "on" : "",
          }}
          initialFilaments={product.filaments.map((f) => ({
            id: f.filamentId,
            amount: toInput(f.gramsPerPlate),
          }))}
          initialSupplies={product.supplies.map((s) => ({
            id: s.supplyId,
            amount: toInput(s.quantityPerPiece),
          }))}
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
