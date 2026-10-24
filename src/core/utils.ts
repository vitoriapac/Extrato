export function uid(prefix = 'id'): string {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID_PATTERN.test(value);
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12);
  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  );
}

export function isOptionalTimestamp(value: unknown): value is string | null | undefined {
  return value == null || (typeof value === 'string' && Number.isFinite(Date.parse(value)));
}

export function isFiniteNonNegative(value: unknown): boolean {
  return Number.isFinite(Number(value)) && Number(value) >= 0;
}

export function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function pluralize(
  count: number | string,
  singular: string,
  pluralForm = `${singular}s`
): string {
  return `${count} ${Number(count) === 1 ? singular : pluralForm}`;
}
