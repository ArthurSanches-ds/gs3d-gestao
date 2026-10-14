"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/simple-form";
import { prisma } from "@/lib/db";
import { readForm } from "@/lib/form-data";
import { decimalField, integerField } from "@/lib/form-fields";

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);

const text = (label: string, max: number) =>
  z.string().trim().min(1, `Informe ${label}.`).max(max, `Máximo de ${max} caracteres.`);

const schema = z.object({
  filamentId: z.string().min(1),
  color: text("a cor", 40).transform(capitalize),
  brand: text("a marca", 40),
  material: text("o material", 20).transform((value) => value.toUpperCase()),
  rollPrice: decimalField({ min: 0, minExclusive: true }),
  rollNetGrams: integerField({ min: 0, minExclusive: true }),
  spoolTareGrams: decimalField({ min: 0 }),
});

const FIELDS = Object.keys(schema.shape);

export async function updateFilament(
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

  const { filamentId, ...data } = result.data;

  // Outra cor com o mesmo nome, marca e material? (ignora a própria)
  const duplicate = await prisma.filament.findFirst({
    where: {
      id: { not: filamentId },
      color: { equals: data.color, mode: "insensitive" },
      brand: { equals: data.brand, mode: "insensitive" },
      material: { equals: data.material, mode: "insensitive" },
    },
  });
  if (duplicate) {
    return {
      status: "error",
      message: `${duplicate.color} ${duplicate.brand} ${duplicate.material} já existe.`,
      values,
    };
  }

  await prisma.filament.update({ where: { id: filamentId }, data });

  // O custo de todos os produtos que usam essa cor muda junto
  revalidatePath("/filamentos");
  revalidatePath("/produtos");
  redirect("/filamentos");
}
