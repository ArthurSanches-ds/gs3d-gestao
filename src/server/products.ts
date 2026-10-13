import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { suggestedPriceWithTiers } from "@/domain/pricing/channel";
import { energyCostPerHour, wearCostPerHour } from "@/domain/pricing/machine";
import { pieceCost } from "@/domain/pricing/piece";

const productInclude = {
  filaments: { include: { filament: true } },
  supplies: { include: { supply: true } },
  movements: true,
} satisfies Prisma.ProductInclude;

type ProductFull = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

// Tudo que o cálculo precisa além do produto: parâmetros e canais
async function getPricingContext() {
  const [settings, channels] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.salesChannel.findMany({
      where: { active: true },
      include: { tiers: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!settings) {
    throw new Error("Parâmetros não cadastrados. Rode npm run db:seed.");
  }

  return { settings, channels };
}

type PricingContext = Awaited<ReturnType<typeof getPricingContext>>;

const str = (value: { toString(): string }) => value.toString();

function toProductView(product: ProductFull, { settings, channels }: PricingContext) {
  const laborMinutes = product.laborMinutes ?? settings.defaultLaborMinutes;

  const cost = pieceCost({
    filaments: product.filaments.map((pf) => ({
      gramsPerPlate: str(pf.gramsPerPlate),
      costPerGram: new Decimal(str(pf.filament.rollPrice)).div(pf.filament.rollNetGrams),
    })),
    piecesPerPlate: product.piecesPerPlate,
    plateMinutes: product.plateMinutes,
    energyCostPerHour: energyCostPerHour(str(settings.powerKw), str(settings.energyTariff)),
    wearCostPerHour: wearCostPerHour(str(settings.printerPrice), settings.printerLifetimeHours),
    laborMinutes,
    laborHourlyRate: str(settings.laborHourlyRate),
    supplies: product.supplies.map((ps) => ({
      unitCost: new Decimal(str(ps.supply.packPrice)).div(ps.supply.packQuantity),
      quantityPerPiece: str(ps.quantityPerPiece),
    })),
    failureReserve: str(settings.failureReserve),
  });

  const prices = channels.map((channel) => {
    try {
      const { price } = suggestedPriceWithTiers({
        cost: cost.total,
        margin: str(settings.margin),
        discount: 0,
        tax: str(settings.tax),
        tiers: channel.tiers.map((tier) => ({
          minPrice: str(tier.minPrice),
          maxPrice: tier.maxPrice ? str(tier.maxPrice) : null,
          commission: str(tier.commission),
          fixedFee: str(tier.fixedFee),
        })),
      });
      return { channelId: channel.id, channel: channel.name, price: price.toNumber() };
    } catch {
      // Canal sem faixa que sirva: mostra "—" em vez de quebrar a tela
      return { channelId: channel.id, channel: channel.name, price: null };
    }
  });

  const totalGrams = product.filaments.reduce(
    (total, pf) => total.plus(str(pf.gramsPerPlate)),
    new Decimal(0),
  );

  return {
    id: product.id,
    name: product.name,
    isCustom: product.isCustom,
    piecesPerPlate: product.piecesPerPlate,
    plateMinutes: product.plateMinutes,
    laborMinutes,
    usesDefaultLabor: product.laborMinutes === null,
    stock: product.movements.reduce((total, m) => total + m.quantity, 0),
    // Números comuns só para exibir; as contas foram feitas em Decimal acima
    gramsPerPiece: totalGrams.div(product.piecesPerPlate).toNumber(),
    minutesPerPiece: product.plateMinutes / product.piecesPerPlate,
    cost: {
      filament: cost.filament.toNumber(),
      energy: cost.energy.toNumber(),
      wear: cost.wear.toNumber(),
      print: cost.print.toNumber(),
      labor: cost.labor.toNumber(),
      supplies: cost.supplies.toNumber(),
      total: cost.total.toNumber(),
    },
    prices,
  };
}

export async function getProductsWithCost() {
  const [context, products] = await Promise.all([
    getPricingContext(),
    prisma.product.findMany({
      where: { archived: false },
      include: productInclude,
      orderBy: { name: "asc" },
    }),
  ]);
  return products.map((product) => toProductView(product, context));
}

export async function getProductWithCost(id: string) {
  const [context, product] = await Promise.all([
    getPricingContext(),
    prisma.product.findUnique({ where: { id }, include: productInclude }),
  ]);
  return product ? toProductView(product, context) : null;
}

export type ProductView = ReturnType<typeof toProductView>;
