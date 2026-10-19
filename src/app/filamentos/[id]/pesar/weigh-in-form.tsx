"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { weighInNetGrams } from "@/domain/stock/weigh-in";
import { formatNumber } from "@/lib/format";
import { parseBrazilianNumber } from "@/lib/parse-number";
import { registerWeighIn, type FilamentFormState } from "../../actions";

const initialState: FilamentFormState = { status: "idle" };

type Props = {
  filamentId: string;
  spoolTareGrams: number;
  rollNetGrams: number;
  currentBalanceGrams: number;
};

// Calcula o saldo enquanto você digita; devolve null se ainda não dá para calcular
function previewBalance(scale: string, closed: string, tare: number, rollNet: number) {
  const scaleValue = parseBrazilianNumber(scale);
  const closedValue = parseBrazilianNumber(closed);
  if (scaleValue === null || closedValue === null) return null;

  try {
    return weighInNetGrams({
      scaleGrams: scaleValue,
      spoolTareGrams: tare,
      closedRolls: Number(closedValue),
      rollNetGrams: rollNet,
    }).toNumber();
  } catch {
    return null;
  }
}

export function WeighInForm({
  filamentId,
  spoolTareGrams,
  rollNetGrams,
  currentBalanceGrams,
}: Props) {
  const [state, formAction, pending] = useActionState(registerWeighIn, initialState);
  const [scale, setScale] = useState("");
  const [closedRolls, setClosedRolls] = useState("0");
  const [direct, setDirect] = useState(false);

  const tare = direct ? 0 : spoolTareGrams;
  const preview = previewBalance(scale, closedRolls, tare, rollNetGrams);
  const scaleError = state.fieldErrors?.scaleGrams?.[0];
  const closedError = state.fieldErrors?.closedRolls?.[0];
  const noteError = state.fieldErrors?.note?.[0];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="filamentId" value={filamentId} />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="direct"
          checked={direct}
          onChange={(event) => setDirect(event.target.checked)}
          className="accent-primary size-4"
        />
        Já sei quanto tem, não vou pesar
      </label>

      <Field data-invalid={scaleError ? true : undefined}>
        <FieldLabel htmlFor="scaleGrams">
          {direct ? "Filamento no rolo aberto (g)" : "Peso do rolo aberto na balança (g)"}
        </FieldLabel>
        <Input
          id="scaleGrams"
          name="scaleGrams"
          inputMode="decimal"
          placeholder={direct ? "Ex.: 500" : "Ex.: 1082"}
          value={scale}
          onChange={(event) => setScale(event.target.value)}
          aria-invalid={scaleError ? true : undefined}
        />
        <FieldDescription>
          {direct
            ? "Só o filamento, sem o carretel. Use 0 se o rolo aberto acabou."
            : `Pese com o carretel. O sistema desconta ${formatNumber(spoolTareGrams)} g do carretel vazio.`}
        </FieldDescription>
        {scaleError && <FieldError>{scaleError}</FieldError>}
      </Field>

      <Field data-invalid={closedError ? true : undefined}>
        <FieldLabel htmlFor="closedRolls">Rolos fechados dessa cor</FieldLabel>
        <Input
          id="closedRolls"
          name="closedRolls"
          inputMode="numeric"
          value={closedRolls}
          onChange={(event) => setClosedRolls(event.target.value)}
          aria-invalid={closedError ? true : undefined}
        />
        <FieldDescription>Cada rolo lacrado conta {formatNumber(rollNetGrams)} g.</FieldDescription>
        {closedError && <FieldError>{closedError}</FieldError>}
      </Field>

      <Field data-invalid={noteError ? true : undefined}>
        <FieldLabel htmlFor="note">Observação (opcional)</FieldLabel>
        <Input
          id="note"
          name="note"
          defaultValue={state.values?.note ?? ""}
          aria-invalid={noteError ? true : undefined}
        />
        {noteError && <FieldError>{noteError}</FieldError>}
      </Field>

      <div className="rounded-lg border p-4 text-sm">
        <p className="text-muted-foreground">
          Saldo atual:{" "}
          <span className="tabular-nums">{formatNumber(currentBalanceGrams, 1)} g</span>
        </p>
        <p className="mt-1 font-medium">
          Depois da pesagem:{" "}
          <span className="tabular-nums">
            {preview === null ? "—" : `${formatNumber(preview, 1)} g`}
          </span>
        </p>
      </div>

      {state.status === "error" && state.message && (
        <p role="status" className="text-destructive text-sm">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar pesagem"}
        </Button>
        <Link href="/filamentos" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
