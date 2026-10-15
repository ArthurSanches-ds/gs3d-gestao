import { notFound } from "next/navigation";
import { SimpleForm } from "@/components/simple-form";
import { prisma } from "@/lib/db";
import { updateFixedExpense } from "../../actions";

export default async function EditarDespesaPage({ params }: PageProps<"/despesas/[id]/editar">) {
  const { id } = await params;
  const expense = await prisma.fixedExpense.findUnique({ where: { id } });
  if (!expense) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Editar despesa</h1>

      <div className="mt-6">
        <SimpleForm
          action={updateFixedExpense}
          hidden={{ expenseId: expense.id }}
          fields={[
            { name: "name", label: "Nome", defaultValue: expense.name },
            {
              name: "monthlyAmount",
              label: "Valor por mês (R$)",
              defaultValue: expense.monthlyAmount.toString().replace(".", ","),
              numeric: true,
            },
          ]}
          submitLabel="Salvar"
          cancelHref="/despesas"
        />
      </div>
    </main>
  );
}
