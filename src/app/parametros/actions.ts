"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { settingsFormSchema } from "@/domain/settings/schema";

export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

const FIELDS = Object.keys(settingsFormSchema.shape);

export async function updateSettings(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  // Pega o que foi digitado em cada campo, como texto
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  );

  const result = settingsFormSchema.safeParse(values);

  if (!result.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values, // devolve o que foi digitado para o formulário não apagar
    };
  }

  await prisma.settings.update({
    where: { id: 1 },
    data: result.data,
  });

  revalidatePath("/parametros");
  return { status: "success", message: "Parâmetros salvos." };
}
