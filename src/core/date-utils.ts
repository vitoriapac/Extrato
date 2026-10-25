const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Hot path: renders parse the same few hundred dates millions of times. Only the validated parts
// are cached, so the Date is still built in the current time zone on every call.
const parsedParts = new Map<string, [number, number, number] | null>();

export function parseLocalDate(value: unknown): Date | null {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value !== 'string') return null;
  let parts = parsedParts.get(value);
  if (parts === undefined) {
    parts = null;
    if (ISO_DATE.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0, 0);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day)
        parts = [year, month - 1, day];
    }
    // shortcut: plain bounded cache, cleared when full; switch to LRU only if profiles show churn.
    if (parsedParts.size >= 10_000) parsedParts.clear();
    parsedParts.set(value, parts);
  }
  return parts ? new Date(parts[0], parts[1], parts[2], 12, 0, 0, 0) : null;
}

export function formatLocalDate(value: unknown): string | null {
  const date = parseLocalDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addLocalDays(value: unknown, amount: number): string | null {
  const date = parseLocalDate(value);
  if (!date) return null;
  date.setDate(date.getDate() + Number(amount || 0));
  return formatLocalDate(date);
}

export function startOfLocalDay(value: unknown): Date | null {
  const date = parseLocalDate(value);
  return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0) : null;
}

export function endOfLocalDay(value: unknown): Date | null {
  const date = parseLocalDate(value);
  return date
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
    : null;
}

export function localDateRange(start: unknown, end: unknown): string[] {
  const first = parseLocalDate(start),
    last = parseLocalDate(end);
  if (!first || !last || first > last) return [];
  const result: string[] = [];
  for (let date = new Date(first); date <= last; date.setDate(date.getDate() + 1)) {
    const formatted = formatLocalDate(date);
    if (formatted) result.push(formatted);
  }
  return result;
}
