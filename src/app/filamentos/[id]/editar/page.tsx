import { notFound } from "next/navigation";
import { RemoveButton } from "@/components/remove-button";
import { SimpleForm } from "@/components/simple-form";
import { prisma } from "@/lib/db";
import { removeFilament, updateFilament } from "./actions";

const toInput = (value: { toString(): string }) => value.toString().replace(".", ",");

export default async function EditarFilamentoPage({
  params,
}: PageProps<"/filamentos/[id]/editar">) {
  const { id } = await params;
  const filament = await prisma.filament.findUnique({ where: { id } });
  if (!filament) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Editar filamento</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Mudar o preço altera o custo dos produtos daqui pra frente. Vendas já registradas não mudam.
      </p>

      <div className="mt-6">
        <SimpleForm
          action={updateFilament}
          hidden={{ filamentId: filament.id }}
          fields={[
            { name: "color", label: "Cor", defaultValue: filament.color },
            { name: "brand", label: "Marca", defaultValue: filament.brand },
            { name: "material", label: "Material", defaultValue: filament.material },
            {
              name: "rollPrice",
              label: "Preço do rolo (R$)",
              defaultValue: toInput(filament.rollPrice),
              numeric: true,
            },
            {
              name: "rollNetGrams",
              label: "Filamento em um rolo novo (g)",
              defaultValue: String(filament.rollNetGrams),
              numeric: true,
              hint: "O que vem na embalagem, normalmente 1000 g. Não é o peso na balança.",
            },
            {
              name: "spoolTareGrams",
              label: "Peso do carretel vazio (g)",
              defaultValue: toInput(filament.spoolTareGrams),
              numeric: true,
              hint: "Quando pesar um carretel vazio de verdade, atualize aqui.",
            },
          ]}
          submitLabel="Salvar"
          cancelHref="/filamentos"
        />
      </div>

      <section className="mt-10 space-y-2 border-t pt-6">
        <h2 className="font-medium">Remover filamento</h2>
        <p className="text-muted-foreground text-sm">
          Se a cor nunca foi usada, ela é apagada. Se já entrou em alguma produção, só some das
          listas e o histórico das vendas continua certo. Cadastrar a mesma cor de novo traz ela de
          volta.
        </p>
        <RemoveButton
          action={removeFilament}
          id={filament.id}
          label="Remover"
          confirmText={`Remover ${filament.color} ${filament.brand}?`}
        />
      </section>
    </main>
  );
}
