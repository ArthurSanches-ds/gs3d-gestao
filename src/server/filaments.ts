import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { filamentBalance } from "@/domain/stock/filament";

type FilamentWithMovements = Prisma.FilamentGetPayload<{ include: { movements: true } }>;

async function getLowThreshold() {
  const settings = await prisma.settings.findUnique({
    where: { id: 1 },
    select: { lowFilamentGrams: true },
  });
  return settings?.lowFilamentGrams ?? 150;
}

// Transforma o registro do banco no formato que as telas usam
function toFilamentWithBalance(filament: FilamentWithMovements, lowThreshold: number) {
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
    spoolTareGrams: Number(filament.spoolTareGrams.toString()),
    balanceGrams: balance.toNumber(),
    costPerGram: new Decimal(filament.rollPrice.toString()).div(filament.rollNetGrams).toNumber(),
    isLow: balance.lt(lowThreshold),
  };
}

export async function getFilamentsWithBalance() {
  // Busca as duas coisas ao mesmo tempo, em vez de uma depois da outra
  const [lowThreshold, filaments] = await Promise.all([
    getLowThreshold(),
    prisma.filament.findMany({
      where: { active: true },
      include: { movements: true },
      orderBy: { color: "asc" },
    }),
  ]);

  return filaments.map((filament) => toFilamentWithBalance(filament, lowThreshold));
}

export async function getFilamentWithBalance(id: string) {
  const [lowThreshold, filament] = await Promise.all([
    getLowThreshold(),
    prisma.filament.findUnique({ where: { id }, include: { movements: true } }),
  ]);

  return filament ? toFilamentWithBalance(filament, lowThreshold) : null;
}

export type FilamentWithBalance = NonNullable<Awaited<ReturnType<typeof getFilamentWithBalance>>>;
