import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Já está logado? Vai direto para o início
  if (await getSession()) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">GS3D Gestão</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">Entre para continuar.</p>
      <LoginForm />
    </main>
  );
}
