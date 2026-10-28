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
