import { NextResponse, type NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";

// Únicas páginas que não exigem login
const PUBLIC_PATHS = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  // Confere a assinatura do cookie, não só se ele existe
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

// Roda em tudo, menos nos arquivos internos do Next (incluindo a conexão que
// recarrega a página enquanto você programa) e nos arquivos com extensão (.ico, .svg...)
export const config = {
  matcher: ["/((?!_next/|__nextjs|.*\\..*).*)"],
};
