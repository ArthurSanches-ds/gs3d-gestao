"use server";

import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readList } from "@/lib/form-data";
import { decimalField } from "@/lib/form-fields";

export type LooseBatchState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

const headerSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Descreva o que foi impresso.")
    .max(80, "Máximo de 80 caracteres."),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
});

export async function registerLooseBatch(
  _previousState: LooseBatchState,
  formData: FormData,
): Promise<LooseBatchState> {
  const values = {
    description: String(formData.get("description") ?? ""),
    occurredAt: String(formData.get("occurredAt") ?? ""),
  };
  const fail = (fieldErrors: Record<string, string[] | undefined>): LooseBatchState => ({
    status: "error",
    message: "Confira os campos destacados.",
    fieldErrors,
    values,
  });

  const header = headerSchema.safeParse(values);
  if (!header.success) return fail(z.flattenError(header.error).fieldErrors);

  const ids = readList(formData, "filamentId");
  const amounts = readList(formData, "gramsPerPlate");
  const gramsField = decimalField({ min: 0, minExclusive: true });
  const lines: { filamentId: string; grams: string }[] = [];

  for (const [index, filamentId] of ids.entries()) {
    const raw = (amounts[index] ?? "").trim();
    if (filamentId === "" && raw === "") continue; // linha vazia: ignora

    const position = `Linha ${index + 1}`;
    if (filamentId === "") return fail({ filaments: [`${position}: escolha a cor.`] });
    const grams = gramsField.safeParse(raw);
    if (!grams.success)
      return fail({ filaments: [`${position}: ${grams.error.issues[0].message}`] });
    if (lines.some((l) => l.filamentId === filamentId)) {
      return fail({ filaments: [`${position}: cor repetida. Some as gramas numa linha só.`] });
    }
    lines.push({ filamentId, grams: grams.data });
  }
  if (lines.length === 0) return fail({ filaments: ["Informe pelo menos uma cor."] });

  const occurredAt = new Date(`${header.data.occurredAt}T12:00:00-03:00`);

  // Lote sem produto: gasta filamento, não entra nada no estoque
  await prisma.productionRun.create({
    data: {
      description: header.data.description,
      plates: 1,
      goodPieces: 0,
      occurredAt,
      filamentMovements: {
        create: lines.map((line) => ({
          filamentId: line.filamentId,
          type: "CONSUMPTION",
          grams: new Decimal(line.grams).negated().toString(),
          occurredAt,
          note: `Avulso: ${header.data.description}`,
        })),
      },
    },
  });

  revalidatePath("/filamentos");
  revalidatePath("/");
  redirect("/filamentos");
}
