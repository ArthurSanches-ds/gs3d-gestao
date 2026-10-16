"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { buildQuote } from "@/domain/pricing/quote";
import { formatMoney } from "@/lib/format";
import { parseBrazilianNumber } from "@/lib/parse-number";
import { createQuotePdf, quoteFileName } from "./quote-pdf";

type Tier = { minPrice: number; maxPrice: number | null; commission: number; fixedFee: number };

export type QuoteChannel = { id: string; name: string; isDirect: boolean; tiers: Tier[] };
export type QuoteProduct = { id: string; name: string; unitCost: number };
export type QuotePayment = { name: string; feeRate: number; installments: number };

type Props = {
  products: QuoteProduct[];
  channels: QuoteChannel[];
  paymentMethods: QuotePayment[];
  margin: number;
  tax: number;
};

const selectClass =
  "h-9 w-full min-w-0 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const money = (value: { toNumber(): number }) => formatMoney(value.toNumber());

export function QuoteCalculator({ products, channels, paymentMethods, margin, tax }: Props) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [discount, setDiscount] = useState("0");
  const [customer, setCustomer] = useState("");
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const product = products.find((p) => p.id === productId);
  const channel = channels.find((c) => c.id === channelId);

  const quantityNumber = Number.parseInt(quantity, 10);
  const discountValue = parseBrazilianNumber(discount);

  let quote: ReturnType<typeof buildQuote> | null = null;
  let error = "";
  if (!product || !channel) {
    error = "Escolha o produto e o canal.";
  } else if (!Number.isInteger(quantityNumber) || quantityNumber < 1) {
    error = "Informe uma quantidade inteira maior que zero.";
  } else if (discountValue === null || Number(discountValue) < 0 || Number(discountValue) >= 100) {
    error = "O desconto precisa ficar entre 0 e 99%.";
  } else {
    try {
      quote = buildQuote({
        unitCost: product.unitCost,
        quantity: quantityNumber,
        margin,
        discount: Number(discountValue) / 100,
        tax,
        tiers: channel.tiers,
        paymentMethods: channel.isDirect ? paymentMethods : [],
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "Não foi possível calcular.";
    }
  }

  // Texto pronto para colar no WhatsApp
  const message =
    quote && product
      ? [
          `*Orçamento GS3D Studio*${customer ? ` para ${customer}` : ""}`,
          "",
          `${quantityNumber}× ${product.name}: ${money(quote.unitPrice)} cada`,
          `*Total: ${money(quote.total)}*`,
          ...(quote.payments.length > 0
            ? [
                "",
                "Formas de pagamento:",
                ...quote.payments.map((p) =>
                  p.installments > 1
                    ? `${p.name}: ${p.installments}x de ${money(p.installmentValue)} (total ${money(p.total)})`
                    : `${p.name}: ${money(p.total)}`,
                ),
              ]
            : []),
        ].join("\n")
      : "";

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // No celular abre o compartilhar (escolhe o WhatsApp); no PC baixa o arquivo
  const generatePdf = async () => {
    if (!quote || !product) return;
    setPdfBusy(true);
    setPdfError("");
    try {
      const doc = await createQuotePdf({
        customer: customer.trim(),
        productName: product.name,
        quantity: quantityNumber,
        unitPrice: quote.unitPrice.toNumber(),
        total: quote.total.toNumber(),
        payments: quote.payments.map((p) => ({
          name: p.name,
          installments: p.installments,
          installmentValue: p.installmentValue.toNumber(),
          total: p.total.toNumber(),
        })),
      });
      const fileName = quoteFileName(customer.trim());
      const file = new File([doc.output("blob")], fileName, { type: "application/pdf" });
      const isPhone = window.matchMedia("(pointer: coarse)").matches;
      if (isPhone && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Orçamento GS3D Studio" });
      } else {
        doc.save(fileName);
      }
    } catch (e) {
      // Fechar a janela de compartilhar sem escolher nada não é erro
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setPdfError("Não foi possível gerar o PDF.");
      }
    } finally {
      setPdfBusy(false);
    }
  };

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum produto cadastrado.{" "}
        <Link href="/produtos/novo" className="underline">
          Cadastre um produto
        </Link>{" "}
        primeiro.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <Field>
          <FieldLabel htmlFor="product">Produto</FieldLabel>
          <select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={selectClass}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <FieldDescription>
            Encomenda nova?{" "}
            <Link href="/produtos/novo" className="underline">
              Cadastre o produto personalizado
            </Link>{" "}
            primeiro.
          </FieldDescription>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="quantity">Quantidade</FieldLabel>
            <Input
              id="quantity"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="discount">Desconto (%)</FieldLabel>
            <Input
              id="discount"
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="channel">Canal</FieldLabel>
          <select
            id="channel"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className={selectClass}
          >
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="customer">Cliente (opcional)</FieldLabel>
          <Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </Field>
      </section>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {quote && (
        <>
          <section className="space-y-1 rounded-lg border p-4 text-sm">
            <Row label="Preço por peça" value={money(quote.unitPrice)} />
            <Row label="Total do pedido" value={money(quote.total)} strong />
            <Row label="Lucro estimado" value={money(quote.profit)} />
            <p className="text-muted-foreground pt-2 text-xs">
              Preço mínimo por peça (sem lucro, só cobre custo e taxas): {money(quote.minUnitPrice)}
              . Abaixo disso você paga para trabalhar.
            </p>
          </section>

          {quote.payments.length > 0 && (
            <section className="space-y-1 rounded-lg border p-4 text-sm">
              <p className="mb-2 font-medium">Para o cliente (taxa da maquininha repassada)</p>
              {quote.payments.map((p) => (
                <Row
                  key={p.name}
                  label={p.name}
                  value={
                    p.installments > 1
                      ? `${p.installments}x de ${money(p.installmentValue)} · ${money(p.total)}`
                      : money(p.total)
                  }
                />
              ))}
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={copy}>
              {copied ? "Copiado!" : "Copiar para o WhatsApp"}
            </Button>
            <Button type="button" variant="outline" onClick={generatePdf} disabled={pdfBusy}>
              {pdfBusy ? "Gerando..." : "Gerar PDF"}
            </Button>
            {product && (
              <Link
                href={`/produtos/${product.id}/produzir`}
                className={buttonVariants({ variant: "outline" })}
              >
                Cliente fechou: produzir
              </Link>
            )}
          </div>
          {pdfError && <p className="text-destructive text-sm">{pdfError}</p>}
        </>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-4 ${strong ? "font-medium" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
