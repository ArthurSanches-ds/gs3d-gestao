import "dotenv/config";
import { prisma } from "../src/lib/db";
import { filamentBalance } from "../src/domain/stock/filament";

// Coluna "Restante (g)" da aba Estoque da planilha
const expected: Record<string, string> = {
  Branco: "697.1",
  Preto: "583.4",
  "Marrom claro": "722.5",
  Laranja: "730.9",
  Vermelho: "839.6",
  Amarelo: "934.9",
  "Azul claro": "847.1",
  Verde: "930.9",
};

async function main() {
  const filaments = await prisma.filament.findMany({
    include: { movements: true },
    orderBy: { color: "asc" },
  });

  let allMatch = true;

  for (const filament of filaments) {
    const balance = filamentBalance(
      filament.movements.map((m) => ({
        type: m.type,
        grams: m.grams.toString(),
        occurredAt: m.occurredAt,
      })),
    ).toFixed(1);

    const matches = balance === expected[filament.color];
    if (!matches) allMatch = false;

    console.log(
      `${matches ? "OK  " : "ERRO"} ${filament.color.padEnd(14)} sistema: ${balance} g | planilha: ${expected[filament.color]} g`,
    );
  }

  console.log(
    allMatch ? "\nTodos os saldos batem com a planilha." : "\nHá diferenças. Confira acima.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
