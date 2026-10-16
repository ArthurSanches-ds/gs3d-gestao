import { Box } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Já está logado? Vai direto para o início
  if (await getSession()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 py-2">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-primary flex items-center gap-2">
              <Box className="size-8" aria-hidden />
              <span className="text-3xl font-bold tracking-tight">GS3D</span>
            </div>
            <p className="text-muted-foreground text-sm">Gestão · entre para continuar</p>
          </div>

          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
