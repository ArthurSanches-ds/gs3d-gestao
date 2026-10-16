"use client";

import { Box } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/orcamento", label: "Orçamento" },
  { href: "/vendas", label: "Vendas" },
  { href: "/produtos", label: "Produtos" },
  { href: "/filamentos", label: "Filamentos" },
  { href: "/insumos", label: "Insumos" },
  { href: "/despesas", label: "Despesas" },
  { href: "/parametros", label: "Parâmetros" },
];

export function MainNav({ userName }: { userName: string | null }) {
  const pathname = usePathname();

  // Na tela de login não tem menu
  if (pathname === "/login" || !userName) return null;

  // "/produtos/abc/editar" também conta como estar em "Produtos"
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-2">
        {/* Só os links deslizam; o nome e o Sair ficam sempre visíveis */}
        <nav className="flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-1 overflow-x-auto">
          <Link href="/" className="text-primary mr-2 flex shrink-0 items-center gap-1.5 font-bold">
            <Box className="size-5" aria-hidden />
            GS3D
          </Link>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive(link.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="flex shrink-0 items-center gap-2 border-l pl-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">{userName}</span>
          <button type="submit" className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
