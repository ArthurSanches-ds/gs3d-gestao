import "dotenv/config";
import { prisma } from "../src/lib/db";

const BRAND = "Onyon 3D";
const IMPORT_NOTE = "Importado da planilha GS3D_gestao";

// ---------- Parâmetros ----------

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

// ---------- Dados da planilha ----------

// Apaga o que foi importado antes, para o script poder rodar de novo sem duplicar
async function cleanPreviousImport() {
  await prisma.filamentMovement.deleteMany({ where: { note: IMPORT_NOTE } });
  await prisma.productionRun.deleteMany({ where: { note: IMPORT_NOTE } });
}

async function seedFilaments() {
  // Peso líquido na pesagem de 24/09/2026 (balança − 200 g de carretel)
  const weighIns = [
    { color: "Branco", netGrams: 882 },
    { color: "Preto", netGrams: 712 },
    { color: "Marrom claro", netGrams: 942 },
    { color: "Laranja", netGrams: 808 },
    { color: "Vermelho", netGrams: 853 },
    { color: "Amarelo", netGrams: 937 },
    { color: "Azul claro", netGrams: 949 },
    { color: "Verde", netGrams: 933 },
  ];
  const weighDate = new Date("2026-09-24T00:00:00-03:00");

  const ids: Record<string, string> = {};

  for (const { color, netGrams } of weighIns) {
    const filament = await prisma.filament.upsert({
      where: { color_brand_material: { color, brand: BRAND, material: "PLA" } },
      update: {},
      create: { color, brand: BRAND, material: "PLA", rollPrice: 90, rollNetGrams: 1000 },
    });

    await prisma.filamentMovement.create({
      data: {
        filamentId: filament.id,
        type: "WEIGH_IN",
        grams: netGrams,
        occurredAt: weighDate,
        note: IMPORT_NOTE,
      },
    });

    ids[color] = filament.id;
  }

  return ids;
}

async function seedSupplies() {
  const supplies = [
    { name: "Argola de chaveiro", packPrice: 23.65, packQuantity: 100 },
    { name: "Envelope de segurança", packPrice: 25, packQuantity: 50 },
    { name: "Caixa de papelão pequena", packPrice: 40, packQuantity: 25 },
    { name: "Saquinho transparente", packPrice: 10, packQuantity: 100 },
    { name: "Tag / cartão de agradecimento", packPrice: 20, packQuantity: 100 },
    { name: "Adesivo com logo", packPrice: 60, packQuantity: 500 },
    { name: "Parafuso 4mm + bucha 6", packPrice: 12, packQuantity: 20 },
    { name: "Switch de teclado", packPrice: 28.9, packQuantity: 10 },
  ];

  const ids: Record<string, string> = {};

  for (const supply of supplies) {
    const saved = await prisma.supply.upsert({
      where: { name: supply.name },
      update: supply,
      create: supply,
    });
    ids[supply.name] = saved.id;
  }

  return ids;
}

async function seedProducts(
  filamentIds: Record<string, string>,
  supplyIds: Record<string, string>,
) {
  const products = [
    {
      name: "Chaveiro fazendinha recortada",
      piecesPerPlate: 5,
      plateMinutes: 113,
      filaments: [
        { color: "Branco", gramsPerPlate: 22.9 },
        { color: "Preto", gramsPerPlate: 1.6 },
        { color: "Marrom claro", gramsPerPlate: 8.7 },
      ],
      supplies: [{ name: "Argola de chaveiro", quantityPerPiece: 1 }],
    },
    {
      name: "Chaveiro fazendinha tábuas",
      piecesPerPlate: 5,
      plateMinutes: 117,
      filaments: [
        { color: "Branco", gramsPerPlate: 24.4 },
        { color: "Preto", gramsPerPlate: 1.6 },
        { color: "Marrom claro", gramsPerPlate: 8.5 },
      ],
      supplies: [{ name: "Argola de chaveiro", quantityPerPiece: 1 }],
    },
  ];

  for (const product of products) {
    const recipe = {
      filaments: {
        create: product.filaments.map((f) => ({
          filamentId: filamentIds[f.color],
          gramsPerPlate: f.gramsPerPlate,
        })),
      },
      supplies: {
        create: product.supplies.map((s) => ({
          supplyId: supplyIds[s.name],
          quantityPerPiece: s.quantityPerPiece,
        })),
      },
    };

    const existing = await prisma.product.findFirst({ where: { name: product.name } });

    if (existing) {
      // Refaz a ficha técnica do zero
      await prisma.productFilament.deleteMany({ where: { productId: existing.id } });
      await prisma.productSupply.deleteMany({ where: { productId: existing.id } });
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          piecesPerPlate: product.piecesPerPlate,
          plateMinutes: product.plateMinutes,
          ...recipe,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: product.name,
          piecesPerPlate: product.piecesPerPlate,
          plateMinutes: product.plateMinutes,
          isCustom: true,
          ...recipe,
        },
      });
    }
  }
}

async function seedConsumptionHistory(filamentIds: Record<string, string>) {
  // [data, descrição, [cor, gramas][]] — aba Consumo da planilha
  const lots: [string, string, [string, number][]][] = [
    [
      "2026-09-23",
      "PIKACHU",
      [
        ["Vermelho", 4.6],
        ["Amarelo", 24.2],
        ["Preto", 2.7],
      ],
    ],
    [
      "2026-09-23",
      "banguela",
      [
        ["Verde", 5.2],
        ["Preto", 53.6],
      ],
    ],
    [
      "2026-09-24",
      "charmander x8",
      [
        ["Branco", 36.6],
        ["Vermelho", 13.4],
        ["Laranja", 77.1],
        ["Preto", 3.5],
      ],
    ],
    [
      "2026-09-25",
      "squarto",
      [
        ["Branco", 48.8],
        ["Preto", 3.5],
        ["Azul claro", 101.9],
        ["Marrom claro", 36.7],
      ],
    ],
    ["2026-09-27", "suporte", [["Verde", 2.1]]],
    ["2026-09-27", "suporte", [["Amarelo", 2.1]]],
    ["2026-09-27", "porta chave", [["Marrom claro", 86.4]]],
    [
      "2026-09-27",
      "decoração cachorro",
      [
        ["Branco", 22.2],
        ["Preto", 5.0],
      ],
    ],
    ["2026-09-28", "porta chave ripado", [["Marrom claro", 81.5]]],
    ["2026-09-29", "porta chave ripado", [["Preto", 81.5]]],
    ["2026-10-07", "porta sílica", [["Preto", 32.1]]],
    [
      "2026-10-07",
      "chaveiros fazendinha",
      [
        ["Branco", 54.9],
        ["Preto", 2.1],
        ["Marrom claro", 10.6],
      ],
    ],
    [
      "2026-10-07",
      "chaveiros fazendinha",
      [
        ["Branco", 22.4],
        ["Preto", 0.9],
        ["Marrom claro", 4.3],
      ],
    ],
  ];

  for (const [date, description, lines] of lots) {
    // Meio-dia: garante que o consumo do dia 24 venha depois da pesagem do dia 24
    const occurredAt = new Date(`${date}T12:00:00-03:00`);

    await prisma.productionRun.create({
      data: {
        description,
        plates: 1,
        goodPieces: 0,
        occurredAt,
        note: IMPORT_NOTE,
        filamentMovements: {
          create: lines.map(([color, grams]) => ({
            filamentId: filamentIds[color],
            type: "CONSUMPTION",
            grams: -grams,
            occurredAt,
            note: IMPORT_NOTE,
          })),
        },
      },
    });
  }
}

async function main() {
  await seedSettings();
  await seedChannels();
  await seedPaymentMethods();
  await seedProfitBuckets();
  console.log("Parâmetros importados.");

  await cleanPreviousImport();
  const filamentIds = await seedFilaments();
  const supplyIds = await seedSupplies();
  await seedProducts(filamentIds, supplyIds);
  await seedConsumptionHistory(filamentIds);
  console.log("Filamentos, insumos, produtos e consumo importados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
