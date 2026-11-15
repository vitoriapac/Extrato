const formatters = new Map<number, Intl.NumberFormat>();

// pt-BR decimals and thousands (69,4 · 1.750); non-numeric input passes through unchanged.
export function formatDecimal(value: unknown, digits = 1): string {
  const number = Number(value);
  if (value == null || value === '' || !Number.isFinite(number)) return String(value ?? '');
  let formatter = formatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits });
    formatters.set(digits, formatter);
  }
  return formatter.format(number);
}

// Uniform delta formatting using typographical minus (U+2212) and explicit plus sign
export function formatDelta(value: unknown, digits = 1): string {
  const number = Number(value);
  if (value == null || value === '' || !Number.isFinite(number)) return '—';
  if (number === 0) return '0';
  const sign = number > 0 ? '+' : '−';
  return sign + formatDecimal(Math.abs(number), digits);
}

// Diferença em pontos percentuais: sempre com sinal (− tipográfico) e uma casa (+13,2 p.p. · −6,0 p.p.).
export function formatPoints(value: unknown, digits = 1): string {
  const number = Number(value);
  if (value == null || value === '' || !Number.isFinite(number)) return '—';
  const text = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(number));
  return `${number > 0 ? '+' : number < 0 ? '−' : ''}${text} p.p.`;
}

// Precisão e demais percentuais medidos: sempre uma casa (69,3% · 55,0%); sem dado, "Sem dados".
export function formatPercent(value: unknown, digits = 1): string {
  const number = Number(value);
  if (value == null || value === '' || !Number.isFinite(number)) return 'Sem dados';
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(number)}%`;
}

// Tamanho de uma diferença em p.p. quando o texto já diz o sentido ("caiu 20,0 p.p."): uma casa, sem sinal.
export function formatPointsMagnitude(value: unknown, digits = 1): string {
  const number = Number(value);
  if (value == null || value === '' || !Number.isFinite(number)) return '—';
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(number))} p.p.`;
}

/** Porcentagem de acertos com uma casa (65,4), para o número mostrado e o gráfico não divergirem. */
export const ratioPercent = (part: number, total: number): number =>
  Math.round((Number(part) / Number(total)) * 1000) / 10;

/** Inteiro com separador de milhar do pt-BR (1.750). */
export const formatInteger = (value: unknown): string =>
  Number.isFinite(Number(value)) ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(value)) : '—';
