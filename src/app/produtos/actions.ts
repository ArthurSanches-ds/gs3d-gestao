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
function validateLines(lines: RecipeLine[], what: string) {
  const amountField = decimalField({ min: 0, minExclusive: true });
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

// Validação comum ao cadastro e à edição
async function parseProductForm(formData: FormData, productId: string | null) {
  const values = readForm(formData, PRODUCT_FIELDS);
  // Tempo vazio vale zero: uma placa de 45 min não precisa de "0" nas horas
  values.plateHours = values.plateHours.trim() || "0";
  values.plateMinutes = values.plateMinutes.trim() || "0";
  const isCustom = formData.get("isCustom") === "on";
  const archived = formData.get("archived") === "on";
  const filamentLines = readLines(formData, "filamentId", "gramsPerPlate");
  const supplyLines = readLines(formData, "supplyId", "quantityPerPiece");

  const fail = (fieldErrors: Record<string, string[] | undefined>) => ({
    error: {
      status: "error" as const,
      message: "Confira os campos destacados.",
      fieldErrors,
      values: { ...values, isCustom: isCustom ? "on" : "", archived: archived ? "on" : "" },
      filamentLines,
      supplyLines,
    },
  });

  const result = productSchema.safeParse(values);
  if (!result.success) return fail(z.flattenError(result.error).fieldErrors);

  const filaments = validateLines(filamentLines, "filamento");
  if (!filaments.lines) return fail({ filaments: [filaments.error] });
  if (filaments.lines.length === 0)
    return fail({ filaments: ["Informe pelo menos um filamento."] });

  const supplies = validateLines(supplyLines, "insumo");
  if (!supplies.lines) return fail({ supplies: [supplies.error] });

  const { plateHours, plateMinutes, ...data } = result.data;
  const totalMinutes = plateHours * 60 + plateMinutes;
  if (totalMinutes === 0)
    return fail({ plateMinutes: ["O tempo da placa precisa ser maior que zero."] });

  // Outro produto ativo com o mesmo nome? (na edição, ignora o próprio)
  const existing = await prisma.product.findFirst({
    where: {
      archived: false,
      name: { equals: data.name, mode: "insensitive" },
      ...(productId ? { id: { not: productId } } : {}),
    },
  });
  if (existing) return fail({ name: [`"${existing.name}" já está cadastrado.`] });

  return {
    data: { ...data, plateMinutes: totalMinutes, isCustom, archived },
    filaments: filaments.lines.map((line) => ({ filamentId: line.id, gramsPerPlate: line.amount })),
    supplies: supplies.lines.map((line) => ({ supplyId: line.id, quantityPerPiece: line.amount })),
  };
}

export async function createProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = await parseProductForm(formData, null);
  if ("error" in parsed) return parsed.error;

  await prisma.product.create({
    data: {
      ...parsed.data,
      filaments: { create: parsed.filaments },
      supplies: { create: parsed.supplies },
    },
  });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function updateProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const productId = String(formData.get("productId") ?? "");
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { status: "error", message: "Produto não encontrado." };

  const parsed = await parseProductForm(formData, productId);
  if ("error" in parsed) return parsed.error;

  // Troca a receita inteira: apaga as linhas antigas e grava as novas, tudo junto
  await prisma.$transaction([
    prisma.productFilament.deleteMany({ where: { productId } }),
    prisma.productSupply.deleteMany({ where: { productId } }),
    prisma.product.update({
      where: { id: productId },
      data: {
        ...parsed.data,
        filaments: { create: parsed.filaments },
        supplies: { create: parsed.supplies },
      },
    }),
  ]);

  revalidatePath("/produtos");
  revalidatePath("/orcamento");
  redirect("/produtos");
}
