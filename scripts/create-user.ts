import "dotenv/config";
import { hash } from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { prisma } from "../src/lib/db";

// Cria um usuário, ou troca a senha de quem já existe (pelo e-mail)
async function main() {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });

  const name = (await terminal.question("Nome: ")).trim();
  const email = (await terminal.question("E-mail: ")).trim().toLowerCase();
  const password = await terminal.question("Senha (mínimo 8 caracteres): ");
  terminal.close();

  if (!name || !email.includes("@")) throw new Error("Nome ou e-mail inválido.");
  if (password.length < 8) throw new Error("A senha precisa de pelo menos 8 caracteres.");

  // 12 rodadas: lento o bastante para atrapalhar quem tentar adivinhar senhas
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { name, email, passwordHash },
  });

  console.log(`\nUsuário "${user.name}" (${user.email}) pronto.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
