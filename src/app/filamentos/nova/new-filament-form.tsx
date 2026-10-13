"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createFilament, type FilamentFormState } from "../actions";

type FieldConfig = {
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
  numeric?: boolean;
};

const FIELDS: FieldConfig[] = [
  { name: "color", label: "Cor", defaultValue: "", hint: "Ex.: Dourado silk" },
  { name: "brand", label: "Marca", defaultValue: "Onyon 3D" },
  { name: "material", label: "Material", defaultValue: "PLA" },
  { name: "rollPrice", label: "Preço do rolo (R$)", defaultValue: "90", numeric: true },
  {
    name: "rollNetGrams",
    label: "Peso líquido do rolo (g)",
    defaultValue: "1000",
    numeric: true,
    hint: "Só o filamento, sem o carretel.",
  },
  {
    name: "spoolTareGrams",
    label: "Peso do carretel vazio (g)",
    defaultValue: "200",
    numeric: true,
    hint: "Usado para descontar o carretel nas pesagens.",
  },
  {
    name: "initialRolls",
    label: "Rolos lacrados que você tem agora",
    defaultValue: "1",
    numeric: true,
    hint: "Vira o estoque inicial da cor. Use 0 se ainda não chegou.",
  },
];

const initialState: FilamentFormState = { status: "idle" };

export function NewFilamentForm() {
  const [state, formAction, pending] = useActionState(createFilament, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {FIELDS.map((field) => {
        const error = state.fieldErrors?.[field.name]?.[0];

        return (
          <Field key={field.name} data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              defaultValue={state.values?.[field.name] ?? field.defaultValue}
              inputMode={field.numeric ? "decimal" : undefined}
              aria-invalid={error ? true : undefined}
            />
            {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
            {error && <FieldError>{error}</FieldError>}
          </Field>
        );
      })}

      {state.status === "error" && state.message && (
        <p role="status" className="text-destructive text-sm">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar cor"}
        </Button>
        <Link href="/filamentos" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
