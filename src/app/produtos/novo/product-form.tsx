"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createProduct, type ProductFormState } from "../actions";

export type Option = { id: string; label: string };

type Line = { key: number; id: string; amount: string };

type Props = {
  filamentOptions: Option[];
  supplyOptions: Option[];
};

const initialState: ProductFormState = { status: "idle" };

const selectClass =
  "h-9 w-full min-w-0 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

let nextKey = 1;
const emptyLine = (): Line => ({ key: nextKey++, id: "", amount: "" });

export function ProductForm({ filamentOptions, supplyOptions }: Props) {
  const [state, formAction, pending] = useActionState(createProduct, initialState);
  const [filaments, setFilaments] = useState<Line[]>(() => [emptyLine()]);
  const [supplies, setSupplies] = useState<Line[]>([]);

  const values = state.values ?? {};
  const error = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4">
        <TextField
          name="name"
          label="Nome do produto"
          error={error("name")}
          defaultValue={values.name}
        />

        <TextField
          name="piecesPerPlate"
          label="Peças por placa"
          numeric
          error={error("piecesPerPlate")}
          defaultValue={values.piecesPerPlate}
        />

        <Field data-invalid={error("plateHours") || error("plateMinutes") ? true : undefined}>
          <FieldLabel>Tempo da placa inteira</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              name="plateHours"
              inputMode="numeric"
              placeholder="0"
              defaultValue={values.plateHours ?? ""}
              aria-label="Horas"
              className="w-20"
            />
            <span className="text-muted-foreground text-sm">h</span>
            <Input
              name="plateMinutes"
              inputMode="numeric"
              placeholder="0"
              defaultValue={values.plateMinutes ?? ""}
              aria-label="Minutos"
              className="w-20"
            />
            <span className="text-muted-foreground text-sm">min</span>
          </div>
          <FieldDescription>Copie do Bambu Studio. Ex.: 1h53m → 1 h e 53 min.</FieldDescription>
          {(error("plateHours") || error("plateMinutes")) && (
            <FieldError>{error("plateHours") ?? error("plateMinutes")}</FieldError>
          )}
        </Field>

        <TextField
          name="laborMinutes"
          label="Mão de obra por peça (min)"
          numeric
          hint="Deixe vazio para usar o padrão dos Parâmetros."
          error={error("laborMinutes")}
          defaultValue={values.laborMinutes}
        />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isCustom" defaultChecked={values.isCustom === "on"} />
          Produto personalizado (encomenda de um cliente)
        </label>
      </section>

      <RecipeSection
        title="Filamentos da placa inteira"
        hint="Gramas de cada cor no total da placa, como o Bambu Studio mostra."
        idName="filamentId"
        amountName="gramsPerPlate"
        amountLabel="g"
        options={filamentOptions}
        lines={filaments}
        setLines={setFilaments}
        addLabel="+ Adicionar cor"
        error={error("filaments")}
      />

      <RecipeSection
        title="Insumos por peça"
        hint="Opcional. Ex.: 1 argola por chaveiro."
        idName="supplyId"
        amountName="quantityPerPiece"
        amountLabel="un."
        options={supplyOptions}
        lines={supplies}
        setLines={setSupplies}
        addLabel="+ Adicionar insumo"
        error={error("supplies")}
      />

      {state.status === "error" && state.message && (
        <p role="status" className="text-destructive text-sm">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar produto"}
        </Button>
        <Link href="/produtos" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function TextField(props: {
  name: string;
  label: string;
  numeric?: boolean;
  hint?: string;
  error?: string;
  defaultValue?: string;
}) {
  return (
    <Field data-invalid={props.error ? true : undefined}>
      <FieldLabel htmlFor={props.name}>{props.label}</FieldLabel>
      <Input
        id={props.name}
        name={props.name}
        inputMode={props.numeric ? "decimal" : undefined}
        defaultValue={props.defaultValue ?? ""}
        aria-invalid={props.error ? true : undefined}
      />
      {props.hint && <FieldDescription>{props.hint}</FieldDescription>}
      {props.error && <FieldError>{props.error}</FieldError>}
    </Field>
  );
}

function RecipeSection(props: {
  title: string;
  hint: string;
  idName: string;
  amountName: string;
  amountLabel: string;
  options: Option[];
  lines: Line[];
  setLines: (update: (lines: Line[]) => Line[]) => void;
  addLabel: string;
  error?: string;
}) {
  const update = (key: number, change: Partial<Line>) =>
    props.setLines((lines) =>
      lines.map((line) => (line.key === key ? { ...line, ...change } : line)),
    );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-medium">{props.title}</h2>
        <p className="text-muted-foreground text-sm">{props.hint}</p>
      </div>

      {props.lines.map((line) => (
        <div key={line.key} className="flex items-center gap-2">
          <select
            name={props.idName}
            value={line.id}
            onChange={(event) => update(line.key, { id: event.target.value })}
            className={selectClass}
            aria-label="Item"
          >
            <option value="">Escolha...</option>
            {props.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <Input
            name={props.amountName}
            value={line.amount}
            onChange={(event) => update(line.key, { amount: event.target.value })}
            inputMode="decimal"
            className="w-24"
            aria-label="Quantidade"
          />
          <span className="text-muted-foreground w-8 text-sm">{props.amountLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => props.setLines((lines) => lines.filter((l) => l.key !== line.key))}
            aria-label="Remover linha"
          >
            ✕
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => props.setLines((lines) => [...lines, emptyLine()])}
      >
        {props.addLabel}
      </Button>

      {props.error && <p className="text-destructive text-sm">{props.error}</p>}
    </section>
  );
}
