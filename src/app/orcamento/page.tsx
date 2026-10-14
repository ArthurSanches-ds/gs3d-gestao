import { prisma } from "@/lib/db";
import { getProductsWithCost } from "@/server/products";
import { QuoteCalculator } from "./quote-calculator";

export const dynamic = "force-dynamic";

const num = (value: { toString(): string }) => Number(value.toString());

export default async function OrcamentoPage() {
  const [settings, channels, paymentMethods, products] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.salesChannel.findMany({
      where: { active: true },
      include: { tiers: true },
      orderBy: { name: "asc" },
    }),
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    getProductsWithCost(),
  ]);
  if (!settings) throw new Error("Parâmetros não cadastrados.");

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
    .sort((a, b) => Number(b.isDirect) - Number(a.isDirect));

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Orçamento</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Calcula o preço na hora. Nada é gravado até você registrar a venda.
      </p>

      <div className="mt-6">
        <QuoteCalculator
          margin={num(settings.margin)}
          tax={num(settings.tax)}
          channels={channelOptions}
          paymentMethods={paymentMethods.map((p) => ({
            name: p.name,
            feeRate: num(p.feeRate),
            installments: p.installments,
          }))}
          products={products.map((p) => ({ id: p.id, name: p.name, unitCost: p.cost.total }))}
        />
      </div>
    </main>
  );
}
