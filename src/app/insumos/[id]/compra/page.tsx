import { notFound } from "next/navigation";
import { SimpleForm } from "@/components/simple-form";
import { getSupplyWithBalance } from "@/server/supplies";
import { registerSupplyPurchase } from "../../actions";

export default async function CompraInsumoPage({ params }: PageProps<"/insumos/[id]/compra">) {
  const { id } = await params;
  const supply = await getSupplyWithBalance(id);
  if (!supply) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Comprei insumo</h1>
      <p className="text-muted-foreground mt-1 text-sm">{supply.name}</p>

      <div className="mt-6">
        <SimpleForm
          action={registerSupplyPurchase}
          hidden={{ supplyId: supply.id }}
          fields={[
            {
              name: "packs",
              label: "Quantos pacotes chegaram?",
              defaultValue: "1",
              numeric: true,
              hint: `Cada pacote soma ${supply.packQuantity} unidades.`,
            },
            { name: "note", label: "Observação (opcional)" },
          ]}
          submitLabel="Registrar compra"
          cancelHref="/insumos"
        />
      </div>
    </main>
  );
}
