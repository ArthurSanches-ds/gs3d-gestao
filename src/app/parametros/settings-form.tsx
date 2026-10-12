"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateSettings, type SettingsFormState } from "./actions";

type FieldConfig = {
  name: string;
  label: string;
  suffix?: string;
  hint?: string;
};

const GROUPS: { title: string; fields: FieldConfig[] }[] = [
  {
    title: "Impressora e energia",
    fields: [
      { name: "printerPrice", label: "Preço da impressora + AMS", suffix: "R$" },
      { name: "printerLifetimeHours", label: "Vida útil", suffix: "horas" },
      { name: "powerKw", label: "Consumo médio", suffix: "kW" },
      { name: "energyTariff", label: "Tarifa de energia", suffix: "R$/kWh" },
    ],
  },
  {
    title: "Mão de obra",
    fields: [
      { name: "laborHourlyRate", label: "Valor da sua hora", suffix: "R$" },
      { name: "defaultLaborMinutes", label: "Mão de obra padrão por peça", suffix: "min" },
    ],
  },
  {
    title: "Preço",
    fields: [
      {
        name: "failureReserve",
        label: "Reserva para falhas",
        suffix: "%",
        hint: "Incide só sobre a impressão: filamento, energia e desgaste.",
      },
      { name: "margin", label: "Margem sobre o custo", suffix: "%" },
      { name: "tax", label: "Imposto sobre a venda", suffix: "%" },
    ],
  },
  {
    title: "Lucro",
    fields: [
      {
        name: "rentRate",
        label: "Aluguel",
        suffix: "% do lucro",
        hint: "Sai do lucro antes da distribuição.",
      },
      { name: "salaryGoal", label: "Meta de salário", suffix: "R$/mês" },
    ],
  },
  {
    title: "Estoque",
    fields: [{ name: "lowFilamentGrams", label: "Alerta de filamento abaixo de", suffix: "g" }],
  },
];

const initialState: SettingsFormState = { status: "idle" };

export function SettingsForm({ initialValues }: { initialValues: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);

  // Se deu erro, mostra o que foi digitado; senão, os valores do banco
  const values = state.values ?? initialValues;

  return (
    <form action={formAction} className="space-y-6">
      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.fields.map((field) => {
              const error = state.fieldErrors?.[field.name]?.[0];

              return (
                <Field key={field.name} data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor={field.name}>
                    {field.label}
                    {field.suffix && (
                      <span className="text-muted-foreground font-normal"> ({field.suffix})</span>
                    )}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    defaultValue={values[field.name]}
                    inputMode="decimal"
                    aria-invalid={error ? true : undefined}
                  />
                  {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
                  {error && <FieldError>{error}</FieldError>}
                </Field>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar parâmetros"}
        </Button>
        {state.message && (
          <p
            role="status"
            className={
              state.status === "error"
                ? "text-destructive text-sm"
                : "text-muted-foreground text-sm"
            }
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
