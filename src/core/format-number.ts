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
