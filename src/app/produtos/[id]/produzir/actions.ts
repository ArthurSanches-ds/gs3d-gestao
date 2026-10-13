"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readForm } from "@/lib/form-data";
import { integerField } from "@/lib/form-fields";
import { planProduction } from "@/domain/stock/production";

export type ProductionFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

const schema = z.object({
  productId: z.string().min(1),
  plates: integerField({ min: 1 }),
  // Vazio = todas as peças saíram boas
  goodPieces: z
    .string()
    .trim()
    .transform((raw, ctx) => {
      if (raw === "") return undefined;
      const parsed = integerField({ min: 0 }).safeParse(raw);
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", message: parsed.error.issues[0].message });
        return z.NEVER;
      }
      return parsed.data;
    }),
  note: z.string().trim().max(200, "Máximo de 200 caracteres."),
});

export async function registerProduction(
  _previousState: ProductionFormState,
  formData: FormData,
): Promise<ProductionFormState> {
  const values = readForm(formData, ["productId", "plates", "goodPieces", "note"]);

  const result = schema.safeParse(values);
  if (!result.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values,
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: result.data.productId },
    include: { filaments: true },
  });
  if (!product) return { status: "error", message: "Produto não encontrado.", values };

  let plan;
  try {
    plan = planProduction({
      piecesPerPlate: product.piecesPerPlate,
      filaments: product.filaments.map((f) => ({
        filamentId: f.filamentId,
        gramsPerPlate: f.gramsPerPlate.toString(),
      })),
      plates: result.data.plates,
      goodPieces: result.data.goodPieces,
    });
  } catch (error) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: { goodPieces: [error instanceof Error ? error.message : "Valor inválido."] },
      values,
    };
  }

  const note = result.data.note || null;

  // Produção, baixa de filamento e entrada no estoque gravadas juntas
  await prisma.productionRun.create({
    data: {
      productId: product.id,
      plates: result.data.plates,
      goodPieces: plan.goodPieces,
      note,
      filamentMovements: {
        create: plan.consumption.map((c) => ({
          filamentId: c.filamentId,
          type: "CONSUMPTION",
          grams: c.grams.negated().toString(),
          note: `Produção: ${product.name}`,
        })),
      },
      productMovements:
        plan.goodPieces > 0
          ? {
              create: {
                productId: product.id,
                type: "PRODUCTION",
                quantity: plan.goodPieces,
                note,
              },
            }
          : undefined,
    },
  });

  revalidatePath("/produtos");
  revalidatePath("/filamentos");
  redirect("/produtos");
}
