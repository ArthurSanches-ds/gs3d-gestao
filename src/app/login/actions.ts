"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string; email?: string };

// Mesma mensagem para e-mail inexistente e senha errada:
// assim ninguém descobre quais e-mails têm conta no sistema
const INVALID = "E-mail ou senha incorretos.";

export async function login(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Informe e-mail e senha.", email };

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk = user ? await compare(password, user.passwordHash) : false;
  if (!user || !passwordOk) return { error: INVALID, email };

  await createSession({ userId: user.id, name: user.name });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
