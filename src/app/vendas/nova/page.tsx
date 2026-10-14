import { prisma } from "@/lib/db";
import { getProductsWithCost } from "@/server/products";
import { SaleForm } from "./sale-form";

export const dynamic = "force-dynamic";

const num = (value: { toString(): string }) => Number(value.toString());

export default async function NovaVendaPage() {
  const [channels, paymentMethods, products] = await Promise.all([
    prisma.salesChannel.findMany({
      where: { active: true },
      include: { tiers: true },
      orderBy: { name: "asc" },
    }),
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    getProductsWithCost(),
  ]);

  const channelOptions = channels
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      isDirect: channel.tiers.every((t) => num(t.commission) === 0 && num(t.fixedFee) === 0),
      tiers: channel.tiers.map((t) => ({
        minPrice: num(t.minPrice),
        maxPrice: t.maxPrice === null ? null : num(t.maxPrice),
        commission: num(t.commission),
        fixedFee: num(t.fixedFee),
      })),
    }))
    // Venda direta primeiro: é a mais comum
    .sort((a, b) => Number(b.isDirect) - Number(a.isDirect));

  // Data de hoje no horário de Brasília, no formato do campo de data (AAAA-MM-DD)
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Nova venda</h1>

      <div className="mt-6">
        <SaleForm
          today={today}
          channels={channelOptions}
          paymentMethods={paymentMethods.map((p) => ({
            id: p.id,
            name: p.name,
            feeRate: num(p.feeRate),
            installments: p.installments,
          }))}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            unitCost: p.cost.total,
            prices: Object.fromEntries(p.prices.map((price) => [price.channelId, price.price])),
          }))}
        />
      </div>
    </main>
  );
}
