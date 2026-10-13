"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { registerProduction, type ProductionFormState } from "./actions";

export type RecipeItem = {
  filamentId: string;
  color: string;
  gramsPerPlate: number;
  balanceGrams: number;
};

type Props = {
  productId: string;
  piecesPerPlate: number;
  recipe: RecipeItem[];
};

const initialState: ProductionFormState = { status: "idle" };

export function ProductionForm({ productId, piecesPerPlate, recipe }: Props) {
  const [state, formAction, pending] = useActionState(registerProduction, initialState);
  const [plates, setPlates] = useState(state.values?.plates ?? "1");

  const platesNumber = Number.parseInt(plates, 10);
  const validPlates = Number.isInteger(platesNumber) && platesNumber > 0 ? platesNumber : 0;
  const expectedPieces = validPlates * piecesPerPlate;

  const error = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />

      <Field data-invalid={error("plates") ? true : undefined}>
        <FieldLabel htmlFor="plates">Quantas placas você imprimiu?</FieldLabel>
        <Input
          id="plates"
          name="plates"
          inputMode="numeric"
          value={plates}
          onChange={(event) => setPlates(event.target.value)}
          aria-invalid={error("plates") ? true : undefined}
        />
        <FieldDescription>
          Cada placa rende {piecesPerPlate} {piecesPerPlate === 1 ? "peça" : "peças"}.
        </FieldDescription>
        {error("plates") && <FieldError>{error("plates")}</FieldError>}
      </Field>

      <Field data-invalid={error("goodPieces") ? true : undefined}>
        <FieldLabel htmlFor="goodPieces">Peças boas</FieldLabel>
        <Input
          id="goodPieces"
          name="goodPieces"
          inputMode="numeric"
          placeholder={expectedPieces > 0 ? String(expectedPieces) : ""}
          defaultValue={state.values?.goodPieces ?? ""}
          aria-invalid={error("goodPieces") ? true : undefined}
        />
        <FieldDescription>
          Deixe vazio se todas saíram boas. Placa perdida inteira: digite 0.
        </FieldDescription>
        {error("goodPieces") && <FieldError>{error("goodPieces")}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="note">Observação (opcional)</FieldLabel>
        <Input id="note" name="note" defaultValue={state.values?.note ?? ""} />
      </Field>

      <div className="space-y-2 rounded-lg border p-4 text-sm">
        <p className="font-medium">Vai gastar</p>
        {recipe.map((item) => {
          const needed = item.gramsPerPlate * validPlates;
          const after = item.balanceGrams - needed;

          return (
            <div key={item.filamentId} className="flex justify-between gap-4">
              <span>{item.color}</span>
              <span
                className={`tabular-nums ${after < 0 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {formatNumber(needed, 1)} g · sobra {formatNumber(after, 1)} g
              </span>
            </div>
          );
        })}
        {recipe.some((item) => item.balanceGrams - item.gramsPerPlate * validPlates < 0) && (
          <p className="text-destructive">
            O sistema acha que não tem filamento suficiente. Se você tem, faça uma pesagem antes.
          </p>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p role="status" className="text-destructive text-sm">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || validPlates === 0}>
          {pending ? "Salvando..." : "Registrar produção"}
        </Button>
        <Link href="/produtos" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
