"use client";

import Decimal from "decimal.js";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saleTotals } from "@/domain/pricing/sale";
import { formatMoney } from "@/lib/format";
import { parseBrazilianNumber } from "@/lib/parse-number";
import { registerSale, type SaleFormState } from "../actions";

export type ChannelOption = {
  id: string;
  name: string;
  isDirect: boolean;
  tiers: { minPrice: number; maxPrice: number | null; commission: number; fixedFee: number }[];
};
export type PaymentOption = { id: string; name: string; feeRate: number; installments: number };
export type ProductOption = {
  id: string;
  name: string;
  stock: number;
  unitCost: number;
  prices: Record<string, number | null>; // preço sugerido por canal
};

type Line = { key: number; productId: string; quantity: string; unitPrice: string };

type Props = {
  channels: ChannelOption[];
  paymentMethods: PaymentOption[];
  products: ProductOption[];
  today: string;
};

const initialState: SaleFormState = { status: "idle" };

const selectClass =
  "h-9 w-full min-w-0 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

let nextKey = 1;
const emptyLine = (): Line => ({ key: nextKey++, productId: "", quantity: "1", unitPrice: "" });

// "7,00" → 7; vazio ou inválido → null
const toNumber = (value: string) => {
  const parsed = parseBrazilianNumber(value);
  return parsed === null ? null : Number(parsed);
};
const toInput = (value: number | null) =>
  value === null ? "" : value.toFixed(2).replace(".", ",");

export function SaleForm({ channels, paymentMethods, products, today }: Props) {
  const [state, formAction, pending] = useActionState(registerSale, initialState);
  const values = state.values ?? {};

  const [channelId, setChannelId] = useState(
    values.channelId ?? channels.find((c) => c.isDirect)?.id ?? "",
  );
  const [paymentMethodId, setPaymentMethodId] = useState(
    values.paymentMethodId ?? paymentMethods[0]?.id ?? "",
  );
  const [passFee, setPassFee] = useState(values.passFeeToCustomer === "on");
  const [lines, setLines] = useState<Line[]>(() => [emptyLine()]);

  const channel = channels.find((c) => c.id === channelId);
  const payment = channel?.isDirect
    ? paymentMethods.find((p) => p.id === paymentMethodId)
    : undefined;
  const error = (name: string) => state.fieldErrors?.[name]?.[0];

  const suggested = (productId: string, forChannel = channelId) =>
    products.find((p) => p.id === productId)?.prices[forChannel] ?? null;

  const updateLine = (key: number, change: Partial<Line>) =>
    setLines((all) => all.map((line) => (line.key === key ? { ...line, ...change } : line)));

  // Trocar de canal troca os preços para os sugeridos do novo canal
  const changeChannel = (id: string) => {
    setChannelId(id);
    setLines((all) =>
      all.map((line) => ({ ...line, unitPrice: toInput(suggested(line.productId, id)) })),
    );
  };

  const preview = (() => {
    if (!channel) return null;
    const items = [];
    for (const line of lines) {
      const product = products.find((p) => p.id === line.productId);
      const quantity = toNumber(line.quantity);
      const price = toNumber(line.unitPrice);
      if (!product || !quantity || price === null) continue;
      const tier = channel.tiers.find(
        (t) => price >= t.minPrice && (t.maxPrice === null || price < t.maxPrice),
      );
      if (!tier) return null;
      items.push({
        quantity,
        unitPrice: price,
        unitCost: product.unitCost,
        commissionRate: tier.commission,
        fixedFee: tier.fixedFee,
      });
    }
    if (items.length === 0) return null;
    const totals = saleTotals({
      items,
      taxRate: 0,
      cardFeeRate: payment?.feeRate ?? 0,
      passFeeToCustomer: Boolean(channel.isDirect && passFee),
    });
    const installments = payment?.installments ?? 1;
    return { ...totals, installment: totals.amountCharged.div(installments), installments };
  })();

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4">
        <Field data-invalid={error("channelId") ? true : undefined}>
          <FieldLabel htmlFor="channelId">Canal</FieldLabel>
          <select
            id="channelId"
            name="channelId"
            value={channelId}
            onChange={(event) => changeChannel(event.target.value)}
            className={selectClass}
          >
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {error("channelId") && <FieldError>{error("channelId")}</FieldError>}
        </Field>

        {channel?.isDirect && (
          <>
            <Field data-invalid={error("paymentMethodId") ? true : undefined}>
              <FieldLabel htmlFor="paymentMethodId">Forma de pagamento</FieldLabel>
              <select
                id="paymentMethodId"
                name="paymentMethodId"
                value={paymentMethodId}
                onChange={(event) => setPaymentMethodId(event.target.value)}
                className={selectClass}
              >
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({(p.feeRate * 100).toFixed(2).replace(".", ",")}%)
                  </option>
                ))}
              </select>
              {error("paymentMethodId") && <FieldError>{error("paymentMethodId")}</FieldError>}
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="passFeeToCustomer"
                checked={passFee}
                onChange={(event) => setPassFee(event.target.checked)}
              />
              Repassar a taxa da maquininha para o cliente
            </label>
          </>
        )}
        {!channel?.isDirect && <input type="hidden" name="paymentMethodId" value="" />}

        <div className="grid grid-cols-2 gap-3">
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
          <Field>
            <FieldLabel htmlFor="customerName">Cliente (opcional)</FieldLabel>
            <Input id="customerName" name="customerName" defaultValue={values.customerName ?? ""} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Itens</h2>
        {lines.map((line) => {
          const product = products.find((p) => p.id === line.productId);
          return (
            <div key={line.key} className="space-y-1">
              <div className="flex items-center gap-2">
                <select
                  name="productId"
                  value={line.productId}
                  onChange={(event) =>
                    updateLine(line.key, {
                      productId: event.target.value,
                      unitPrice: toInput(suggested(event.target.value)),
                    })
                  }
                  className={selectClass}
                  aria-label="Produto"
                >
                  <option value="">Escolha...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} em estoque)
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLines((all) => all.filter((l) => l.key !== line.key))}
                  aria-label="Remover item"
                >
                  ✕
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Input
                  name="quantity"
                  value={line.quantity}
                  onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                  inputMode="numeric"
                  className="w-20"
                  aria-label="Quantidade"
                />
                <span className="text-muted-foreground">un. ×</span>
                <Input
                  name="unitPrice"
                  value={line.unitPrice}
                  onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                  inputMode="decimal"
                  className="w-28"
                  aria-label="Preço por peça"
                />
                <span className="text-muted-foreground">
                  {product && suggested(product.id) !== null
                    ? `sugerido ${formatMoney(suggested(product.id) ?? 0)}`
                    : ""}
                </span>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLines((all) => [...all, emptyLine()])}
        >
          + Adicionar produto
        </Button>
        {error("items") && <p className="text-destructive text-sm">{error("items")}</p>}
      </section>

      {preview && (
        <section className="space-y-1 rounded-lg border p-4 text-sm">
          <Row label="Total dos itens" value={preview.itemsTotal} />
          {preview.channelFees.gt(0) && (
            <Row label="Taxas do canal" value={preview.channelFees.negated()} />
          )}
          {preview.cardFee.gt(0) && (
            <Row label="Taxa da maquininha" value={preview.cardFee.negated()} />
          )}
          <Row label="Custo das peças" value={preview.cost.negated()} />
          <Row label="Lucro estimado" value={preview.profit} strong />
          <div className="mt-2 border-t pt-2">
            <Row label="Cobrar do cliente" value={preview.amountCharged} strong />
            {preview.installments > 1 && (
              <p className="text-muted-foreground text-right">
                {preview.installments}x de {formatMoney(preview.installment.toNumber())}
              </p>
            )}
          </div>
        </section>
      )}

      <Field>
        <FieldLabel htmlFor="notes">Observação (opcional)</FieldLabel>
        <Input id="notes" name="notes" defaultValue={values.notes ?? ""} />
      </Field>

      {state.status === "error" && state.message && (
        <p role="status" className="text-destructive text-sm">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar venda"}
        </Button>
        <Link href="/vendas" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function Row({ label, value, strong }: { label: string; value: Decimal; strong?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-4 ${strong ? "font-medium" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{formatMoney(value.toNumber())}</span>
    </div>
  );
}
