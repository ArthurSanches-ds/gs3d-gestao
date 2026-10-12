/**
 * Lê um número digitado no padrão brasileiro e devolve no formato que o
 * computador entende, como texto ("2.500,00" → "2500.00").
 * Devolve null se não for um número válido.
 */
export function parseBrazilianNumber(input: string): string | null {
  // Tira "R$", "%" e espaços
  const cleaned = input.replace(/R\$|%|\s/g, "");
  if (cleaned === "") return null;

  let normalized: string;

  if (cleaned.includes(",")) {
    // Tem vírgula: os pontos são de milhar e a vírgula é decimal
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // Só pontos, em grupos de 3 dígitos: são de milhar ("1.000")
    normalized = cleaned.replace(/\./g, "");
  } else {
    // Sem vírgula e sem padrão de milhar: o ponto é decimal ("0.08")
    normalized = cleaned;
  }

  // Confere se sobrou um número válido
  return /^-?\d+(\.\d+)?$/.test(normalized) ? normalized : null;
}
