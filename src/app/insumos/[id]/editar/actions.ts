"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/simple-form";
import { prisma } from "@/lib/db";
import { readForm } from "@/lib/form-data";
import { decimalField, integerField } from "@/lib/form-fields";

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);

const schema = z.object({
  supplyId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(60, "Máximo de 60 caracteres.")
    .transform(capitalize),
  packPrice: decimalField({ min: 0, minExclusive: true }),
  packQuantity: integerField({ min: 0, minExclusive: true }),
});

const FIELDS = Object.keys(schema.shape);

export async function updateSupply(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = readForm(formData, FIELDS);
  const result = schema.safeParse(values);
  if (!result.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values,
    };
  }

  const { supplyId, ...data } = result.data;

  const duplicate = await prisma.supply.findFirst({
    where: { id: { not: supplyId }, name: { equals: data.name, mode: "insensitive" } },
  });
  if (duplicate) {
    return { status: "error", message: `"${duplicate.name}" já existe.`, values };
  }

  await prisma.supply.update({ where: { id: supplyId }, data });

  // O custo dos produtos que usam esse insumo muda junto
  revalidatePath("/insumos");
  revalidatePath("/produtos");
  redirect("/insumos");
}
