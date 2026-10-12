import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { filamentBalance } from "@/domain/stock/filament";

export async function getFilamentsWithBalance() {
  // Busca as duas coisas ao mesmo tempo, em vez de uma depois da outra
  const [settings, filaments] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 }, select: { lowFilamentGrams: true } }),
    prisma.filament.findMany({
      where: { active: true },
      include: { movements: true },
      orderBy: { color: "asc" },
    }),
  ]);

  const lowThreshold = settings?.lowFilamentGrams ?? 150;

  return filaments.map((filament) => {
    const balance = filamentBalance(
      filament.movements.map((m) => ({
        type: m.type,
        grams: m.grams.toString(),
        occurredAt: m.occurredAt,
      })),
    );

    return {
      id: filament.id,
      color: filament.color,
      brand: filament.brand,
      material: filament.material,
      rollNetGrams: filament.rollNetGrams,
      // Números comuns só para exibir na tela; nenhuma conta é feita com eles
      balanceGrams: balance.toNumber(),
      costPerGram: new Decimal(filament.rollPrice.toString()).div(filament.rollNetGrams).toNumber(),
      isLow: balance.lt(lowThreshold),
    };
  });
}

export type FilamentWithBalance = Awaited<ReturnType<typeof getFilamentsWithBalance>>[number];
