"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { decimalField, integerField } from "@/lib/form-fields";
import { countAdjustment } from "@/domain/stock/supply";
import { getSupplyWithBalance } from "@/server/supplies";

export type SupplyFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

function readForm(formData: FormData, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

function invalid(error: z.ZodError, values: Record<string, string>): SupplyFormState {
  return {
    status: "error",
    message: "Confira os campos destacados.",
    fieldErrors: z.flattenError(error).fieldErrors,
    values,
  };
}

const note = z.string().trim().max(200, "Máximo de 200 caracteres.");

function done(): never {
  revalidatePath("/insumos");
  redirect("/insumos");
}

// ---------- Compra de pacotes ----------

const purchaseSchema = z.object({
  supplyId: z.string().min(1),
  packs: integerField({ min: 1 }),
  note,
});

export async function registerSupplyPurchase(
  _previousState: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const values = readForm(formData, ["supplyId", "packs", "note"]);
  const result = purchaseSchema.safeParse(values);
  if (!result.success) return invalid(result.error, values);

  const supply = await prisma.supply.findUnique({ where: { id: result.data.supplyId } });
  if (!supply) return { status: "error", message: "Insumo não encontrado.", values };

  await prisma.supplyMovement.create({
    data: {
      supplyId: supply.id,
      type: "PURCHASE",
      quantity: result.data.packs * supply.packQuantity,
      note: result.data.note || null,
    },
  });

  done();
}

// ---------- Contagem ----------

const countSchema = z.object({
  supplyId: z.string().min(1),
  counted: decimalField({ min: 0 }),
  note,
});

export async function registerSupplyCount(
  _previousState: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const values = readForm(formData, ["supplyId", "counted", "note"]);
  const result = countSchema.safeParse(values);
  if (!result.success) return invalid(result.error, values);

  const supply = await getSupplyWithBalance(result.data.supplyId);
  if (!supply) return { status: "error", message: "Insumo não encontrado.", values };

  const adjustment = countAdjustment(supply.balance, result.data.counted);

  // Contagem igual ao sistema: nada a corrigir
  if (!adjustment.isZero()) {
    await prisma.supplyMovement.create({
      data: {
        supplyId: supply.id,
        type: "ADJUSTMENT",
        quantity: adjustment.toString(),
        note: result.data.note || `Contagem: ${result.data.counted}`,
      },
    });
  }

  done();
}

// ---------- Novo insumo ----------

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);

const newSupplySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(60, "Máximo de 60 caracteres.")
    .transform(capitalize),
  packPrice: decimalField({ min: 0, minExclusive: true }),
  packQuantity: integerField({ min: 0, minExclusive: true }),
  initialQuantity: decimalField({ min: 0 }),
});

const NEW_SUPPLY_FIELDS = Object.keys(newSupplySchema.shape);

export async function createSupply(
  _previousState: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const values = readForm(formData, NEW_SUPPLY_FIELDS);
  const result = newSupplySchema.safeParse(values);
  if (!result.success) return invalid(result.error, values);

  const { initialQuantity, ...data } = result.data;

  const existing = await prisma.supply.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" } },
  });
  if (existing) {
    return {
      status: "error",
      message: `"${existing.name}" já está cadastrado. Use "Comprei" ou "Contar" na lista.`,
      values,
    };
  }

  const hasInitialStock = initialQuantity !== "0" && Number(initialQuantity) > 0;

  await prisma.supply.create({
    data: {
      ...data,
      movements: hasInitialStock
        ? {
            create: {
              type: "ADJUSTMENT",
              quantity: initialQuantity,
              note: "Estoque inicial no cadastro",
            },
          }
        : undefined,
    },
  });

  done();
}
