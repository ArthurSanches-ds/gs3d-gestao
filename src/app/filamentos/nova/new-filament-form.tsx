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
  section?: string; // título que aparece antes do campo
};

const FIELDS: FieldConfig[] = [
  { name: "color", label: "Cor", defaultValue: "", hint: "Ex.: Dourado silk" },
  { name: "brand", label: "Marca", defaultValue: "Onyon 3D" },
  { name: "material", label: "Material", defaultValue: "PLA" },
  {
    section: "Preço",
    name: "rollPrice",
    label: "Quanto você paga num rolo novo (R$)",
    defaultValue: "90",
    numeric: true,
  },
  {
    name: "rollNetGrams",
    label: "Quantos gramas vêm num rolo novo (g)",
    defaultValue: "1000",
    numeric: true,
    hint: "O que diz a embalagem, normalmente 1000. Serve só para calcular o preço por grama. Não é o seu estoque.",
  },
  {
    section: "Estoque agora",
    name: "openRollScaleGrams",
    label: "Peso do rolo aberto na balança (g)",
    defaultValue: "",
    numeric: true,
    hint: "Pese com o carretel. Deixe vazio se não tiver rolo aberto.",
  },
  {
    name: "spoolTareGrams",
    label: "Peso do carretel vazio (g)",
    defaultValue: "200",
    numeric: true,
    hint: "O sistema tira esse peso do que a balança marcou.",
  },
  {
    name: "initialRolls",
    label: "Rolos ainda lacrados (além do aberto)",
    defaultValue: "0",
    numeric: true,
    hint: "Cada rolo lacrado conta como um rolo novo cheio.",
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
          <div key={field.name} className="space-y-4">
            {field.section && <h2 className="border-t pt-4 font-medium">{field.section}</h2>}
            <Field data-invalid={error ? true : undefined}>
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
          </div>
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
