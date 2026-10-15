"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/simple-form";
import { prisma } from "@/lib/db";
import { readForm } from "@/lib/form-data";
import { decimalField } from "@/lib/form-fields";

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(60, "Máximo de 60 caracteres.")
    .transform(capitalize),
  monthlyAmount: decimalField({ min: 0, minExclusive: true }),
});

const FIELDS = Object.keys(schema.shape);

function invalid(error: z.ZodError, values: Record<string, string>): FormState {
  return {
    status: "error",
    message: "Confira os campos destacados.",
    fieldErrors: z.flattenError(error).fieldErrors,
    values,
  };
}

function done(): never {
  revalidatePath("/despesas");
  redirect("/despesas");
}

export async function createFixedExpense(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = readForm(formData, FIELDS);
  const result = schema.safeParse(values);
  if (!result.success) return invalid(result.error, values);

  await prisma.fixedExpense.create({ data: result.data });
  done();
}

export async function updateFixedExpense(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = readForm(formData, FIELDS);
  const result = schema.safeParse(values);
  if (!result.success) return invalid(result.error, values);

  const id = String(formData.get("expenseId") ?? "");

  await prisma.fixedExpense.update({ where: { id }, data: result.data });
  done();
}

// Desativa ou reativa: a despesa para de contar no mês, mas não some do histórico
export async function toggleFixedExpense(formData: FormData) {
  const id = String(formData.get("expenseId") ?? "");
  const expense = await prisma.fixedExpense.findUnique({ where: { id } });
  if (!expense) return;

  await prisma.fixedExpense.update({ where: { id }, data: { active: !expense.active } });
  revalidatePath("/despesas");
}
