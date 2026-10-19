import { notFound } from "next/navigation";
import { SimpleForm } from "@/components/simple-form";
import { formatNumber } from "@/lib/format";
import { getSupplyWithBalance } from "@/server/supplies";
import { registerSupplyCount } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ContarInsumoPage({ params }: PageProps<"/insumos/[id]/contar">) {
  const { id } = await params;
  const supply = await getSupplyWithBalance(id);
  if (!supply) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Ajustar estoque</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {supply.name} · o sistema acha que tem {formatNumber(supply.balance)}
      </p>

      <div className="mt-6">
        <SimpleForm
          action={registerSupplyCount}
          hidden={{ supplyId: supply.id }}
          fields={[
            {
              name: "counted",
              label: "Quantos você contou?",
              numeric: true,
              hint: "O sistema ajusta a diferença e guarda no histórico.",
            },
            { name: "note", label: "Observação (opcional)", hint: "Ex.: 3 usadas em teste" },
          ]}
          submitLabel="Registrar contagem"
          cancelHref="/insumos"
        />
      </div>
    </main>
  );
}
