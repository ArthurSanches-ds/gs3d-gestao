"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";

export type FilamentFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

// ---------- Compra de rolos ----------

const purchaseSchema = z.object({
  filamentId: z.string().min(1),
  rolls: z.coerce.number().int("Use um número inteiro.").min(1, "Informe pelo menos 1 rolo."),
  note: z.string().trim().max(200, "Máximo de 200 caracteres."),
});

export async function registerPurchase(
  _previousState: FilamentFormState,
  formData: FormData,
): Promise<FilamentFormState> {
  const values = {
    filamentId: String(formData.get("filamentId") ?? ""),
    rolls: String(formData.get("rolls") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

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
