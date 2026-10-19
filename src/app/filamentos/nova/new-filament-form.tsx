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
    label: "Filamento em um rolo novo (g)",
    defaultValue: "1000",
    numeric: true,
    hint: "O que vem escrito na embalagem, normalmente 1000 g. Não é o peso na balança: é com ele que o sistema calcula o preço por grama.",
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
    hint: "Rolos fechados, ainda no lacre. Use 0 se não tiver.",
  },
  {
    name: "openRollScaleGrams",
    label: "Rolo aberto na balança (g), opcional",
    defaultValue: "",
    numeric: true,
    hint: "Pese o rolo que já está em uso, com carretel. O sistema desconta o carretel vazio. Deixe vazio se não tiver rolo aberto.",
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
