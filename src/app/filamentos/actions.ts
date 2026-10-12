"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { decimalField, integerField } from "@/lib/form-fields";
import { weighInNetGrams } from "@/domain/stock/weigh-in";

export type FilamentFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

function readForm(formData: FormData, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

// ---------- Compra de rolos ----------

const purchaseSchema = z.object({
  filamentId: z.string().min(1),
  rolls: integerField({ min: 1 }),
  note: z.string().trim().max(200, "Máximo de 200 caracteres."),
});

export async function registerPurchase(
  _previousState: FilamentFormState,
  formData: FormData,
): Promise<FilamentFormState> {
  const values = readForm(formData, ["filamentId", "rolls", "note"]);

  const result = purchaseSchema.safeParse(values);
  if (!result.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values,
    };
  }

  const filament = await prisma.filament.findUnique({
    where: { id: result.data.filamentId },
  });
  if (!filament) {
    return { status: "error", message: "Filamento não encontrado.", values };
  }

  await prisma.filamentMovement.create({
    data: {
      filamentId: filament.id,
      type: "PURCHASE",
      grams: result.data.rolls * filament.rollNetGrams,
      note: result.data.note || null,
    },
  });

  revalidatePath("/filamentos");
  redirect("/filamentos");
}

// ---------- Pesagem ----------

const weighInSchema = z.object({
  filamentId: z.string().min(1),
  scaleGrams: decimalField({ min: 0 }),
  closedRolls: integerField({ min: 0 }),
  note: z.string().trim().max(200, "Máximo de 200 caracteres."),
});

export async function registerWeighIn(
  _previousState: FilamentFormState,
  formData: FormData,
): Promise<FilamentFormState> {
  const values = readForm(formData, ["filamentId", "scaleGrams", "closedRolls", "note"]);

  const result = weighInSchema.safeParse(values);
  if (!result.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values,
    };
  }

  const filament = await prisma.filament.findUnique({
    where: { id: result.data.filamentId },
  });
  if (!filament) {
    return { status: "error", message: "Filamento não encontrado.", values };
  }

  let netGrams;
  try {
    netGrams = weighInNetGrams({
      scaleGrams: result.data.scaleGrams,
      spoolTareGrams: filament.spoolTareGrams.toString(),
      closedRolls: result.data.closedRolls,
      rollNetGrams: filament.rollNetGrams,
    });
  } catch (error) {
    // A regra recusou (balança mais leve que o carretel): mostra no campo do peso
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: { scaleGrams: [error instanceof Error ? error.message : "Peso inválido."] },
      values,
    };
  }

  await prisma.filamentMovement.create({
    data: {
      filamentId: filament.id,
      type: "WEIGH_IN",
      grams: netGrams.toString(),
      note: result.data.note || null,
    },
  });

  revalidatePath("/filamentos");
  redirect("/filamentos");
}
