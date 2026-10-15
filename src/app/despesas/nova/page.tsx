import { SimpleForm } from "@/components/simple-form";
import { createFixedExpense } from "../actions";

export default function NovaDespesaPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Nova despesa fixa</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Gastos do negócio que não dependem de quantas peças você vende.
      </p>

      <div className="mt-6">
        <SimpleForm
          action={createFixedExpense}
          fields={[
            { name: "name", label: "Nome", hint: "Ex.: Internet, DAS do MEI, assinatura" },
            { name: "monthlyAmount", label: "Valor por mês (R$)", numeric: true },
          ]}
          submitLabel="Cadastrar despesa"
          cancelHref="/despesas"
        />
      </div>
    </main>
  );
}
