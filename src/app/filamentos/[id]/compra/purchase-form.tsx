"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerPurchase, type FilamentFormState } from "../../actions";

const initialState: FilamentFormState = { status: "idle" };

type Props = {
  filamentId: string;
  rollNetGrams: number;
};

export function PurchaseForm({ filamentId, rollNetGrams }: Props) {
  const [state, formAction, pending] = useActionState(registerPurchase, initialState);
  const rollsError = state.fieldErrors?.rolls?.[0];
  const noteError = state.fieldErrors?.note?.[0];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="filamentId" value={filamentId} />

      <Field data-invalid={rollsError ? true : undefined}>
        <FieldLabel htmlFor="rolls">Quantos rolos chegaram?</FieldLabel>
        <Input
          id="rolls"
          name="rolls"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          defaultValue={state.values?.rolls ?? "1"}
          aria-invalid={rollsError ? true : undefined}
        />
        <FieldDescription>Cada rolo soma {rollNetGrams} g ao estoque.</FieldDescription>
        {rollsError && <FieldError>{rollsError}</FieldError>}
      </Field>

      <Field data-invalid={noteError ? true : undefined}>
        <FieldLabel htmlFor="note">Observação (opcional)</FieldLabel>
        <Input
          id="note"
          name="note"
          placeholder="Ex.: comprado na Shopee"
          defaultValue={state.values?.note ?? ""}
          aria-invalid={noteError ? true : undefined}
        />
        {noteError && <FieldError>{noteError}</FieldError>}
      </Field>

      {state.status === "error" && state.message && (
        <p role="status" className="text-destructive text-sm">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar compra"}
        </Button>
        <Link href="/filamentos" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
