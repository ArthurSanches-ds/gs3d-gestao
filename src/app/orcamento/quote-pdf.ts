import { formatMoney } from "@/lib/format";

export type QuotePdfData = {
  customer: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  payments: { name: string; installments: number; installmentValue: number; total: number }[];
};

type Rgb = [number, number, number];
const BRAND: Rgb = [29, 95, 110];
const TEXT: Rgb = [30, 41, 51];
const MUTED: Rgb = [110, 120, 130];
const STRIPE: Rgb = [244, 248, 249];

export const QUOTE_VALID_DAYS = 7;

// As fontes padrão do PDF não têm o espaço especial que o Intl usa depois do "R$"
const money = (value: number) => formatMoney(value).replace(/\s/g, " ");
const date = (value: Date) => value.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export function quoteFileName(customer: string) {
  const slug = customer
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  return `orcamento-gs3d${slug ? `-${slug}` : ""}-${day}.pdf`;
}

// Gera o orçamento em A4. A biblioteca só é baixada quando o botão é clicado.
export async function createQuotePdf(data: QuotePdfData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 18;
  const right = width - margin;
  const today = new Date();
  const validUntil = new Date(today.getTime() + QUOTE_VALID_DAYS * 24 * 60 * 60 * 1000);

  // Faixa do topo com a marca
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, width, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("GS3D Studio", margin, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Impressão 3D personalizada · Rio das Ostras/RJ", margin, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ORÇAMENTO", right, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Emitido em ${date(today)}`, right, 28, { align: "right" });

  // Cliente e validade
  let y = 52;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  if (data.customer) doc.text("CLIENTE", margin, y);
  doc.text("VÁLIDO ATÉ", right, y, { align: "right" });
  y += 6;
  doc.setFontSize(12);
  doc.setTextColor(...TEXT);
  if (data.customer) doc.text(data.customer, margin, y);
  doc.text(date(validUntil), right, y, { align: "right" });

  // Tabela do item
  y += 14;
  const col = { product: margin + 3, qty: 118, unit: 152, total: right - 3 };
  doc.setFillColor(...STRIPE);
  doc.rect(margin, y - 6, right - margin, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("PRODUTO", col.product, y);
  doc.text("QTD", col.qty, y, { align: "right" });
  doc.text("PREÇO UN.", col.unit, y, { align: "right" });
  doc.text("TOTAL", col.total, y, { align: "right" });

  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  const nameLines: string[] = doc.splitTextToSize(data.productName, col.qty - col.product - 18);
  doc.text(nameLines, col.product, y);
  doc.text(String(data.quantity), col.qty, y, { align: "right" });
  doc.text(money(data.unitPrice), col.unit, y, { align: "right" });
  doc.text(money(data.total), col.total, y, { align: "right" });

  y += nameLines.length * 5 + 4;
  doc.setDrawColor(220, 226, 230);
  doc.line(margin, y, right, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Total", col.unit, y, { align: "right" });
  doc.setTextColor(...BRAND);
  doc.text(money(data.total), col.total, y, { align: "right" });

  // Formas de pagamento (só na venda direta)
  if (data.payments.length > 0) {
    y += 16;
    doc.setFontSize(12);
    doc.setTextColor(...TEXT);
    doc.text("Formas de pagamento", margin, y);
    y += 8;
    doc.setFontSize(10);
    data.payments.forEach((payment, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(...STRIPE);
        doc.rect(margin, y - 5, right - margin, 7.5, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT);
      doc.text(payment.name, col.product, y);
      doc.setTextColor(...MUTED);
      doc.text(
        payment.installments > 1
          ? `${payment.installments}x de ${money(payment.installmentValue)}`
          : "à vista",
        140,
        y,
        { align: "right" },
      );
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEXT);
      doc.text(money(payment.total), col.total, y, { align: "right" });
      y += 7.5;
    });
  }

  // Rodapé
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const note =
    data.payments.length > 0
      ? `Orçamento válido por ${QUOTE_VALID_DAYS} dias. Valores no cartão já incluem a taxa da maquininha.`
      : `Orçamento válido por ${QUOTE_VALID_DAYS} dias.`;
  doc.text(note, width / 2, height - 14, { align: "center" });
  doc.text("GS3D Studio · Obrigado pela preferência!", width / 2, height - 9, { align: "center" });

  return doc;
}
