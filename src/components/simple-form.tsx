"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type FormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export type FormFieldConfig = {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  numeric?: boolean;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: FormFieldConfig[];
  hidden?: Record<string, string>;
  submitLabel: string;
  cancelHref: string;
};

const initialState: FormState = { status: "idle" };

export function SimpleForm({ action, fields, hidden = {}, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {fields.map((field) => {
        const error = state.fieldErrors?.[field.name]?.[0];

        return (
          <Field key={field.name} data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              defaultValue={state.values?.[field.name] ?? field.defaultValue ?? ""}
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
          {pending ? "Salvando..." : submitLabel}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
