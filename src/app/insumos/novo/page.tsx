import { SimpleForm } from "@/components/simple-form";
import { createSupply } from "../actions";

export default function NovoInsumoPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Novo insumo</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Argola, saquinho, caixa, ímã, parafuso...
      </p>

      <div className="mt-6">
        <SimpleForm
          action={createSupply}
          fields={[
            { name: "name", label: "Nome", hint: "Ex.: Ímã de neodímio 6 mm" },
            { name: "packPrice", label: "Valor pago no pacote (R$)", numeric: true },
            { name: "packQuantity", label: "Unidades no pacote", numeric: true },
            {
              name: "initialQuantity",
              label: "Quantos você tem agora",
              defaultValue: "0",
              numeric: true,
            },
          ]}
          submitLabel="Cadastrar insumo"
          cancelHref="/insumos"
        />
      </div>
    </main>
  );
}
