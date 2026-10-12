import "dotenv/config";
import { prisma } from "../src/lib/db";

async function seedSettings() {
  const values = {
    printerPrice: 2500,
    printerLifetimeHours: 5000,
    powerKw: 0.08,
    energyTariff: 1,
    laborHourlyRate: 20,
    defaultLaborMinutes: 5,
    failureReserve: 0.1,
    margin: 1.5,
    tax: 0,
    rentRate: 0.1,
    lowFilamentGrams: 150,
    salaryGoal: 2000,
  };

  await prisma.settings.upsert({
    where: { id: 1 },
    update: values,
    create: { id: 1, ...values },
  });
}

async function seedChannels() {
  const channels = [
    {
      name: "Venda direta",
      tiers: [{ minPrice: 0, maxPrice: null, commission: 0, fixedFee: 0 }],
    },
    {
      name: "Mercado Livre",
      tiers: [
        { minPrice: 0, maxPrice: 79, commission: 0.12, fixedFee: 6.5 },
        { minPrice: 79, maxPrice: null, commission: 0.12, fixedFee: 0 }, // CONFERIR: frete grátis obrigatório
      ],
    },
    {
      name: "Shopee",
      tiers: [{ minPrice: 0, maxPrice: null, commission: 0.2, fixedFee: 4 }], // CONFERIR: faixa acima de R$ 79,99
    },
    {
      name: "TikTok Shop",
      tiers: [
        { minPrice: 0, maxPrice: 50, commission: 0.16, fixedFee: 4 },
        { minPrice: 50, maxPrice: null, commission: 0.06, fixedFee: 6 }, // CONFERIR: frete grátis acima de R$ 50
      ],
    },
  ];

  for (const { name, tiers } of channels) {
    const channel = await prisma.salesChannel.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    // Substitui as faixas antigas pelas da lista
    await prisma.channelFeeTier.deleteMany({ where: { channelId: channel.id } });
    await prisma.channelFeeTier.createMany({
      data: tiers.map((tier) => ({ ...tier, channelId: channel.id })),
    });
  }
}

async function seedPaymentMethods() {
  const methods = [
    { name: "Pix", feeRate: 0, installments: 1 },
    { name: "Dinheiro", feeRate: 0, installments: 1 },
    { name: "Débito", feeRate: 0.0137, installments: 1 },
    { name: "Crédito 1x", feeRate: 0.0315, installments: 1 },
    { name: "Crédito 2x", feeRate: 0.0539, installments: 2 },
    { name: "Crédito 3x", feeRate: 0.0612, installments: 3 },
    { name: "Crédito 4x", feeRate: 0.0685, installments: 4 },
    { name: "Crédito 5x", feeRate: 0.0757, installments: 5 },
    { name: "Crédito 6x", feeRate: 0.0828, installments: 6 },
    { name: "Crédito 7x", feeRate: 0.0899, installments: 7 },
    { name: "Crédito 8x", feeRate: 0.0969, installments: 8 },
    { name: "Crédito 9x", feeRate: 0.1038, installments: 9 },
    { name: "Crédito 10x", feeRate: 0.1106, installments: 10 },
  ];

  for (const [index, method] of methods.entries()) {
    const data = { ...method, sortOrder: index };
    await prisma.paymentMethod.upsert({
      where: { name: method.name },
      update: data,
      create: data,
    });
  }
}

async function seedProfitBuckets() {
  const buckets = [
    { key: "farmFund", name: "Fundo próxima impressora", rate: 0.3 },
    { key: "ads", name: "Tráfego pago", rate: 0.15 },
    { key: "equipment", name: "Equipamentos", rate: 0.1 },
    { key: "reserve", name: "Reserva de emergência", rate: 0.05 },
    { key: "salary", name: "Seu salário (pró-labore)", rate: 0.4 },
  ];

  for (const [index, bucket] of buckets.entries()) {
    const data = { ...bucket, sortOrder: index };
    await prisma.profitBucket.upsert({
      where: { key: bucket.key },
      update: data,
      create: data,
    });
  }
}

async function main() {
  await seedSettings();
  await seedChannels();
  await seedPaymentMethods();
  await seedProfitBuckets();
  console.log("Parâmetros importados com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });