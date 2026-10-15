"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function MainNav() {
  const pathname = usePathname();

  // "/produtos/abc/editar" também conta como estar em "Produtos"
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <nav className="mx-auto flex max-w-4xl [scrollbar-width:none] items-center gap-1 overflow-x-auto px-4 py-2">
        <span className="mr-2 shrink-0 font-bold">GS3D</span>
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
    </header>
  );
}
