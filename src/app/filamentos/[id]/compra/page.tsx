import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PurchaseForm } from "./purchase-form";

export default async function CompraPage({ params }: PageProps<"/filamentos/[id]/compra">) {
  const { id } = await params;

  const filament = await prisma.filament.findUnique({ where: { id } });
  if (!filament) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Comprei filamento</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {filament.color} · {filament.brand} · {filament.material}
      </p>

      <div className="mt-6">
        <PurchaseForm filamentId={filament.id} rollNetGrams={filament.rollNetGrams} />
      </div>
    </main>
  );
}
