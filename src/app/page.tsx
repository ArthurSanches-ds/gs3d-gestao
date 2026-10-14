import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const SECTIONS = [
  { href: "/vendas", title: "Vendas", description: "Registrar vendas e ver o lucro do mês" },
  {
    href: "/produtos",
    title: "Produtos",
    description: "Custo por peça, preço por canal e produção",
  },
  { href: "/filamentos", title: "Filamentos", description: "Saldo por cor, compras e pesagens" },
  { href: "/insumos", title: "Insumos", description: "Argolas, embalagens e outros itens" },
  {
    href: "/parametros",
    title: "Parâmetros",
    description: "Custos, margem, taxas e meta de salário",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">GS3D Gestão</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:bg-muted h-full transition-colors">
              <CardContent>
                <p className="font-medium">{section.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
