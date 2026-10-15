"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { emptyLine, RecipeSection, type Line, type Option } from "../../produtos/novo/product-form";
import { registerLooseBatch, type LooseBatchState } from "./actions";

const initialState: LooseBatchState = { status: "idle" };

export function LooseBatchForm({
  filamentOptions,
  today,
}: {
  filamentOptions: Option[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(registerLooseBatch, initialState);
  const [lines, setLines] = useState<Line[]>(() => [emptyLine()]);

  const values = state.values ?? {};
  const error = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4">
        <Field data-invalid={error("description") ? true : undefined}>
          <FieldLabel htmlFor="description">O que foi impresso?</FieldLabel>
          <Input
            id="description"
            name="description"
            placeholder="Ex.: teste de suporte, placa que falhou"
            defaultValue={values.description ?? ""}
            aria-invalid={error("description") ? true : undefined}
          />
          {error("description") && <FieldError>{error("description")}</FieldError>}
        </Field>

        <Field data-invalid={error("occurredAt") ? true : undefined}>
          <FieldLabel htmlFor="occurredAt">Data</FieldLabel>
          <Input
            id="occurredAt"
            name="occurredAt"
            type="date"
            defaultValue={values.occurredAt ?? today}
          />
          {error("occurredAt") && <FieldError>{error("occurredAt")}</FieldError>}
        </Field>
      </section>

      <RecipeSection
        title="Filamento gasto"
        hint="Gramas de cada cor, como o Bambu Studio mostra."
        idName="filamentId"
        amountName="gramsPerPlate"
        amountLabel="g"
        options={filamentOptions}
        lines={lines}
        setLines={setLines}
        addLabel="+ Adicionar cor"
        error={error("filaments")}
      />

      {state.status === "error" && state.message && (
        <p role="status" className="text-destructive text-sm">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar consumo"}
        </Button>
        <Link href="/filamentos" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
