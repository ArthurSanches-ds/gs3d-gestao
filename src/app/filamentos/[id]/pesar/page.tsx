import { notFound } from "next/navigation";
import { getFilamentWithBalance } from "@/server/filaments";
import { WeighInForm } from "./weigh-in-form";

export const dynamic = "force-dynamic";

export default async function PesarPage({ params }: PageProps<"/filamentos/[id]/pesar">) {
  const { id } = await params;

  const filament = await getFilamentWithBalance(id);
  if (!filament) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Ajustar estoque</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {filament.color} · {filament.brand} · {filament.material}
      </p>

      <div className="mt-6">
        <WeighInForm
          filamentId={filament.id}
          spoolTareGrams={filament.spoolTareGrams}
          rollNetGrams={filament.rollNetGrams}
          currentBalanceGrams={filament.balanceGrams}
        />
      </div>
    </main>
  );
}
