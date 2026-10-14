"use server";

import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readForm, readList } from "@/lib/form-data";
import { decimalField, integerField } from "@/lib/form-fields";
import { saleTotals } from "@/domain/pricing/sale";
import { getProductWithCost } from "@/server/products";

export type SaleLine = { productId: string; quantity: string; unitPrice: string };

export type SaleFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

const headerSchema = z.object({
  channelId: z.string().min(1, "Escolha o canal."),
  paymentMethodId: z.string(),
  customerName: z.string().trim().max(80, "Máximo de 80 caracteres."),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  notes: z.string().trim().max(200, "Máximo de 200 caracteres."),
});

const HEADER_FIELDS = Object.keys(headerSchema.shape);

type Tier = {
  minPrice: { toString(): string };
  maxPrice: { toString(): string } | null;
  commission: { toString(): string };
  fixedFee: { toString(): string };
};

// Um item já validado, com a fotografia de custo e taxas, antes de ir para o banco
type SaleItemDraft = {
  productId: string;
  quantity: number;
  unitPrice: string;
  unitCost: string;
  unitLaborCost: string;
  unitWearCost: string;
  commissionRate: string;
  fixedFee: string;
  supplies: { supplyId: string; quantityPerPiece: { toString(): string } }[];
};

// Faixa de taxa em que o preço cobrado cai
function tierForPrice(tiers: Tier[], price: Decimal) {
  return tiers.find(
    (tier) =>
      price.gte(tier.minPrice.toString()) &&
      (tier.maxPrice === null || price.lt(tier.maxPrice.toString())),
  );
}

export async function registerSale(
  _previousState: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  const values = readForm(formData, HEADER_FIELDS);
  const passFeeToCustomer = formData.get("passFeeToCustomer") === "on";

  const productIds = readList(formData, "productId");
  const quantities = readList(formData, "quantity");
  const unitPrices = readList(formData, "unitPrice");
  const lines: SaleLine[] = productIds
    .map((productId, i) => ({
      productId,
      quantity: (quantities[i] ?? "").trim(),
      unitPrice: (unitPrices[i] ?? "").trim(),
    }))
    .filter((line) => line.productId !== "" || line.quantity !== "" || line.unitPrice !== "");

  const fail = (fieldErrors: Record<string, string[]>): SaleFormState => ({
    status: "error",
    message: "Confira os campos destacados.",
    fieldErrors,
    values: { ...values, passFeeToCustomer: passFeeToCustomer ? "on" : "" },
  });

  const header = headerSchema.safeParse(values);
  if (!header.success)
    return fail(z.flattenError(header.error).fieldErrors as Record<string, string[]>);

  if (lines.length === 0) return fail({ items: ["Adicione pelo menos um produto."] });

  const [settings, channel] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.salesChannel.findUnique({
      where: { id: header.data.channelId },
      include: { tiers: true },
    }),
  ]);
  if (!settings || !channel) return fail({ channelId: ["Canal não encontrado."] });

  // Venda direta: canal sem comissão e sem taxa fixa. Só nela a maquininha vale
  const isDirect = channel.tiers.every(
    (tier) =>
      new Decimal(tier.commission.toString()).isZero() &&
      new Decimal(tier.fixedFee.toString()).isZero(),
  );
  const paymentMethod =
    isDirect && header.data.paymentMethodId
      ? await prisma.paymentMethod.findUnique({ where: { id: header.data.paymentMethodId } })
      : null;
  if (isDirect && !paymentMethod)
    return fail({ paymentMethodId: ["Escolha a forma de pagamento."] });

  const quantityField = integerField({ min: 0, minExclusive: true });
  const priceField = decimalField({ min: 0 });
  const items: SaleItemDraft[] = [];

  for (const [index, line] of lines.entries()) {
    const position = `Item ${index + 1}`;
    if (line.productId === "") return fail({ items: [`${position}: escolha o produto.`] });
    if (items.some((item) => item.productId === line.productId)) {
      return fail({ items: [`${position}: produto repetido. Some as quantidades numa linha só.`] });
    }

    const quantity = quantityField.safeParse(line.quantity);
    if (!quantity.success)
      return fail({ items: [`${position}: ${quantity.error.issues[0].message}`] });
    const unitPrice = priceField.safeParse(line.unitPrice);
    if (!unitPrice.success)
      return fail({ items: [`${position}: ${unitPrice.error.issues[0].message}`] });

    const [view, product] = await Promise.all([
      getProductWithCost(line.productId),
      prisma.product.findUnique({ where: { id: line.productId }, include: { supplies: true } }),
    ]);
    if (!view || !product) return fail({ items: [`${position}: produto não encontrado.`] });

    if (view.stock < quantity.data) {
      return fail({
        items: [
          `${position}: ${view.name} tem ${view.stock} em estoque. Registre a produção antes.`,
        ],
      });
    }

    const tier = tierForPrice(channel.tiers, new Decimal(unitPrice.data));
    if (!tier)
      return fail({
        items: [`${position}: nenhuma faixa de taxa do canal serve para esse preço.`],
      });

    items.push({
      productId: product.id,
      quantity: quantity.data,
      unitPrice: unitPrice.data,
      // Fotografia do custo e das taxas de hoje
      unitCost: String(view.cost.total),
      unitLaborCost: String(view.cost.labor),
      unitWearCost: String(view.cost.wear),
      commissionRate: tier.commission.toString(),
      fixedFee: tier.fixedFee.toString(),
      supplies: product.supplies,
    });
  }

  const cardFeeRate = paymentMethod ? paymentMethod.feeRate.toString() : "0";
  const totals = saleTotals({
    items,
    taxRate: settings.tax.toString(),
    cardFeeRate,
    passFeeToCustomer: isDirect && passFeeToCustomer,
  });

  // Meio-dia de Brasília: a venda cai no dia escolhido, sem risco de virar o dia por fuso
  const occurredAt = new Date(`${header.data.occurredAt}T12:00:00-03:00`);

  // Venda, itens, saída do estoque e baixa de insumos gravados juntos
  await prisma.sale.create({
    data: {
      occurredAt,
      customerName: header.data.customerName || null,
      channelId: channel.id,
      paymentMethodId: paymentMethod?.id ?? null,
      passFeeToCustomer: isDirect && passFeeToCustomer,
      taxRate: settings.tax.toString(),
      cardFeeRate,
      cardFee: totals.cardFee.toDecimalPlaces(2).toString(),
      amountCharged: totals.amountCharged.toDecimalPlaces(2).toString(),
      notes: header.data.notes || null,
      items: {
        create: items.map(({ supplies, ...item }) => ({
          ...item,
          productMovements: {
            create: {
              productId: item.productId,
              type: "SALE",
              quantity: -item.quantity,
              occurredAt,
            },
          },
          supplyMovements: {
            create: supplies.map((supply) => ({
              supplyId: supply.supplyId,
              type: "USE",
              quantity: new Decimal(supply.quantityPerPiece.toString())
                .mul(item.quantity)
                .negated()
                .toString(),
              occurredAt,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/vendas");
  revalidatePath("/produtos");
  revalidatePath("/insumos");
  redirect("/vendas");
}
