import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { supplyBalance } from "@/domain/stock/supply";

type SupplyWithMovements = Prisma.SupplyGetPayload<{ include: { movements: true } }>;

// Transforma o registro do banco no formato que as telas usam
function toSupplyWithBalance(supply: SupplyWithMovements) {
  const balance = supplyBalance(supply.movements.map((m) => ({ quantity: m.quantity.toString() })));

  return {
    id: supply.id,
    name: supply.name,
    packQuantity: supply.packQuantity,
    // Números comuns só para exibir na tela; nenhuma conta é feita com eles
    packPrice: Number(supply.packPrice.toString()),
    unitCost: new Decimal(supply.packPrice.toString()).div(supply.packQuantity).toNumber(),
    balance: balance.toNumber(),
    isOut: balance.lte(0),
  };
}

export async function getSuppliesWithBalance() {
  const supplies = await prisma.supply.findMany({
    where: { active: true },
    include: { movements: true },
    orderBy: { name: "asc" },
  });
  return supplies.map(toSupplyWithBalance);
}

export async function getSupplyWithBalance(id: string) {
  const supply = await prisma.supply.findUnique({ where: { id }, include: { movements: true } });
  return supply ? toSupplyWithBalance(supply) : null;
}

export type SupplyWithBalance = NonNullable<Awaited<ReturnType<typeof getSupplyWithBalance>>>;
