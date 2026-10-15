import { prisma } from "@/lib/db";
import { LooseBatchForm } from "./loose-batch-form";

export const dynamic = "force-dynamic";

export default async function ConsumoAvulsoPage() {
  const filaments = await prisma.filament.findMany({
    where: { active: true },
    orderBy: { color: "asc" },
  });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Consumo avulso</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Testes, peças para você ou placas que falharam. Gasta filamento, mas não entra no estoque de
        produtos.
      </p>

      <div className="mt-6">
        <LooseBatchForm
          today={today}
          filamentOptions={filaments.map((f) => ({
            id: f.id,
            label: `${f.color} · ${f.brand} ${f.material}`,
          }))}
        />
      </div>
    </main>
  );
}
