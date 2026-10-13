"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readForm, readList } from "@/lib/form-data";
import { decimalField, integerField } from "@/lib/form-fields";

export type RecipeLine = { id: string; amount: string };

export type ProductFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  filamentLines?: RecipeLine[];
  supplyLines?: RecipeLine[];
};

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(80, "Máximo de 80 caracteres.")
    .transform(capitalize),
  piecesPerPlate: integerField({ min: 0, minExclusive: true }),
  plateHours: integerField({ min: 0 }),
  plateMinutes: integerField({ min: 0, max: 59 }),
  // Vazio = usa a mão de obra padrão dos Parâmetros
  laborMinutes: z
    .string()
    .trim()
    .transform((raw, ctx) => {
      if (raw === "") return null;
      const parsed = integerField({ min: 0 }).safeParse(raw);
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", message: parsed.error.issues[0].message });
        return z.NEVER;
      }
      return parsed.data;
    }),
});

const PRODUCT_FIELDS = Object.keys(productSchema.shape);

// Junta as listas paralelas (cor[0] + gramas[0], cor[1] + gramas[1]...) e ignora linhas vazias
function readLines(formData: FormData, idField: string, amountField: string): RecipeLine[] {
  const ids = readList(formData, idField);
  const amounts = readList(formData, amountField);
  return ids
    .map((id, index) => ({ id, amount: (amounts[index] ?? "").trim() }))
    .filter((line) => line.id !== "" || line.amount !== "");
}

// Valida cada linha da receita; devolve a primeira mensagem de erro encontrada
function validateLines(lines: RecipeLine[], what: string, minExclusive: boolean) {
  const amountField = decimalField({ min: 0, minExclusive });
  const parsed: { id: string; amount: string }[] = [];

  for (const [index, line] of lines.entries()) {
    const position = `Linha ${index + 1} de ${what}`;
    if (line.id === "") return { error: `${position}: escolha o item.` };

    const amount = amountField.safeParse(line.amount);
    if (!amount.success) return { error: `${position}: ${amount.error.issues[0].message}` };

    if (parsed.some((p) => p.id === line.id)) {
      return { error: `${position}: item repetido. Some as quantidades numa linha só.` };
    }
    parsed.push({ id: line.id, amount: amount.data });
  }

  return { lines: parsed };
}

export async function createProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = readForm(formData, PRODUCT_FIELDS);
  // Tempo vazio vale zero: uma placa de 45 min não precisa de "0" nas horas
  values.plateHours = values.plateHours.trim() || "0";
  values.plateMinutes = values.plateMinutes.trim() || "0";
  const isCustom = formData.get("isCustom") === "on";
  const filamentLines = readLines(formData, "filamentId", "gramsPerPlate");
  const supplyLines = readLines(formData, "supplyId", "quantityPerPiece");

  const fail = (state: Partial<ProductFormState>): ProductFormState => ({
    status: "error",
    message: "Confira os campos destacados.",
    values: { ...values, isCustom: isCustom ? "on" : "" },
    filamentLines,
    supplyLines,
    ...state,
  });

  const result = productSchema.safeParse(values);
  if (!result.success) return fail({ fieldErrors: z.flattenError(result.error).fieldErrors });

  const filaments = validateLines(filamentLines, "filamento", true);
  if (!filaments.lines) return fail({ fieldErrors: { filaments: [filaments.error] } });
  if (filaments.lines.length === 0) {
    return fail({ fieldErrors: { filaments: ["Informe pelo menos um filamento."] } });
  }

  const supplies = validateLines(supplyLines, "insumo", true);
  if (!supplies.lines) return fail({ fieldErrors: { supplies: [supplies.error] } });

  const { plateHours, plateMinutes, ...data } = result.data;
  const totalMinutes = plateHours * 60 + plateMinutes;
  if (totalMinutes === 0) {
    return fail({
      fieldErrors: { plateMinutes: ["O tempo da placa precisa ser maior que zero."] },
    });
  }

  const existing = await prisma.product.findFirst({
    where: { archived: false, name: { equals: data.name, mode: "insensitive" } },
  });
  if (existing) {
    return fail({ fieldErrors: { name: [`"${existing.name}" já está cadastrado.`] } });
  }

  await prisma.product.create({
    data: {
      ...data,
      plateMinutes: totalMinutes,
      isCustom,
      filaments: {
        create: filaments.lines.map((line) => ({
          filamentId: line.id,
          gramsPerPlate: line.amount,
        })),
      },
      supplies: {
        create: supplies.lines.map((line) => ({
          supplyId: line.id,
          quantityPerPiece: line.amount,
        })),
      },
    },
  });

  revalidatePath("/produtos");
  redirect("/produtos");
}
