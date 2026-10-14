import { notFound } from "next/navigation";
import { SimpleForm } from "@/components/simple-form";
import { prisma } from "@/lib/db";
import { updateSupply } from "./actions";

export default async function EditarInsumoPage({ params }: PageProps<"/insumos/[id]/editar">) {
  const { id } = await params;
  const supply = await prisma.supply.findUnique({ where: { id } });
  if (!supply) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Editar insumo</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Mudar o preço altera o custo dos produtos daqui pra frente. Vendas já registradas não mudam.
      </p>

      <div className="mt-6">
        <SimpleForm
          action={updateSupply}
          hidden={{ supplyId: supply.id }}
          fields={[
            { name: "name", label: "Nome", defaultValue: supply.name },
            {
              name: "packPrice",
              label: "Valor pago no pacote (R$)",
              defaultValue: supply.packPrice.toString().replace(".", ","),
              numeric: true,
            },
            {
              name: "packQuantity",
              label: "Unidades no pacote",
              defaultValue: String(supply.packQuantity),
              numeric: true,
            },
          ]}
          submitLabel="Salvar"
          cancelHref="/insumos"
        />
      </div>
    </main>
  );
}
