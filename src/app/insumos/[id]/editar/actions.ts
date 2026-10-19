"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { RemoveState } from "@/components/remove-button";
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

// Nunca usado (sem receita e sem venda): apaga de vez.
// Com histórico: só some das listas, para o custo das vendas antigas continuar batendo.
export async function removeSupply(
  _previousState: RemoveState,
  formData: FormData,
): Promise<RemoveState> {
  const id = String(formData.get("id") ?? "");
  const supply = await prisma.supply.findUnique({
    where: { id },
    include: {
      products: { include: { product: { select: { name: true, archived: true } } } },
      _count: { select: { movements: { where: { type: "USE" } } } },
    },
  });
  if (!supply) return { message: "Insumo não encontrado." };

  const usedBy = supply.products.filter((p) => !p.product.archived).map((p) => p.product.name);
  if (usedBy.length > 0) {
    return {
      message: `Esse insumo está na receita de: ${usedBy.join(", ")}. Tire ele desses produtos (ou arquive-os) antes de remover.`,
    };
  }

  const neverUsed = supply.products.length === 0 && supply._count.movements === 0;
  if (neverUsed) {
    await prisma.$transaction([
      prisma.supplyMovement.deleteMany({ where: { supplyId: id } }),
      prisma.supply.delete({ where: { id } }),
    ]);
  } else {
    await prisma.supply.update({ where: { id }, data: { active: false } });
  }

  revalidatePath("/insumos");
  revalidatePath("/produtos");
  revalidatePath("/");
  redirect("/insumos");
}
