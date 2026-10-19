"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { decimalField, integerField } from "@/lib/form-fields";
import { weighInNetGrams } from "@/domain/stock/weigh-in";
import { parseBrazilianNumber } from "@/lib/parse-number";

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
  direct: z.string(),
  note: z.string().trim().max(200, "Máximo de 200 caracteres."),
});

export async function registerWeighIn(
  _previousState: FilamentFormState,
  formData: FormData,
): Promise<FilamentFormState> {
  const values = readForm(formData, ["filamentId", "scaleGrams", "closedRolls", "direct", "note"]);

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
      // "Já sei quanto tem": o número digitado já é o filamento, sem carretel
      spoolTareGrams: result.data.direct === "on" ? 0 : filament.spoolTareGrams.toString(),
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

// ---------- Nova cor ----------

// "dourado silk" → "Dourado silk"
const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);

const text = (label: string, max: number) =>
  z.string().trim().min(1, `Informe ${label}.`).max(max, `Máximo de ${max} caracteres.`);

const newFilamentSchema = z.object({
  color: text("a cor", 40).transform(capitalize),
  brand: text("a marca", 40),
  material: text("o material", 20).transform((value) => value.toUpperCase()),
  rollPrice: decimalField({ min: 0, minExclusive: true }),
  rollNetGrams: integerField({ min: 0, minExclusive: true }),
  spoolTareGrams: decimalField({ min: 0 }),
  initialRolls: integerField({ min: 0 }),
  openRollScaleGrams: z.string().trim(),
});

const NEW_FILAMENT_FIELDS = Object.keys(newFilamentSchema.shape);

export async function createFilament(
  _previousState: FilamentFormState,
  formData: FormData,
): Promise<FilamentFormState> {
  const values = readForm(formData, NEW_FILAMENT_FIELDS);

  const result = newFilamentSchema.safeParse(values);
  if (!result.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values,
    };
  }

  const { initialRolls, openRollScaleGrams, ...data } = result.data;

  // Estoque inicial: rolos lacrados + o que sobra no rolo aberto (sem o carretel)
  const openScale = openRollScaleGrams === "" ? "0" : parseBrazilianNumber(openRollScaleGrams);
  if (openScale === null) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: { openRollScaleGrams: ["Digite só o número, ex.: 660."] },
      values,
    };
  }
  let initialGrams;
  try {
    initialGrams =
      Number(openScale) > 0
        ? weighInNetGrams({
            scaleGrams: openScale,
            spoolTareGrams: data.spoolTareGrams,
            closedRolls: initialRolls,
            rollNetGrams: data.rollNetGrams,
          })
        : initialRolls * data.rollNetGrams;
  } catch (error) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: {
        openRollScaleGrams: [error instanceof Error ? error.message : "Peso inválido."],
      },
      values,
    };
  }

  // Ignora maiúsculas/minúsculas: "preto" e "Preto" são a mesma cor
  const existing = await prisma.filament.findFirst({
    where: {
      color: { equals: data.color, mode: "insensitive" },
      brand: { equals: data.brand, mode: "insensitive" },
      material: { equals: data.material, mode: "insensitive" },
    },
  });
  // Cor removida antes: traz de volta com os dados novos e o estoque informado
  if (existing && !existing.active) {
    await prisma.filament.update({
      where: { id: existing.id },
      data: {
        ...data,
        active: true,
        movements: {
          create: {
            type: "WEIGH_IN",
            grams: initialGrams.toString(),
            note: "Reativado no cadastro",
          },
        },
      },
    });
    revalidatePath("/filamentos");
    redirect("/filamentos");
  }

  if (existing) {
    return {
      status: "error",
      message: `${existing.color} ${existing.brand} ${existing.material} já está cadastrado. Use "Comprei" na lista.`,
      values,
    };
  }

  // Cria a cor já com o estoque inicial: rolos lacrados × peso de cada rolo
  await prisma.filament.create({
    data: {
      ...data,
      movements: {
        create: {
          type: "WEIGH_IN",
          grams: initialGrams.toString(),
          note: "Estoque inicial no cadastro",
        },
      },
    },
  });

  revalidatePath("/filamentos");
  redirect("/filamentos");
}
