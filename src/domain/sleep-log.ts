import type { SleepEntry, SleepQuality } from '../core/types.ts';

export const SLEEP_QUALITIES: readonly SleepQuality[] = Object.freeze(['good', 'ok', 'poor']);
export const SLEEP_LABELS: Record<SleepQuality, string> = Object.freeze({
  good: 'Bem',
  ok: 'Mais ou menos',
  poor: 'Mal',
});
/** Dias mínimos em cada grupo (sono bom e sono ruim) para comparar. */
export const SLEEP_MIN_DAYS = 5;
const MAX_ENTRIES = 400;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeSleepEntry(raw: unknown): SleepEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const date = typeof source.date === 'string' && ISO_DATE.test(source.date) ? source.date : null;
  const quality = SLEEP_QUALITIES.includes(source.quality as SleepQuality)
    ? (source.quality as SleepQuality)
    : null;
  return date && quality ? { date, quality } : null;
}

/** Grava a noite de `date` (uma por dia), mantendo só os registros mais recentes. */
export function recordSleep(
  entries: SleepEntry[],
  date: string,
  quality: SleepQuality
): SleepEntry[] {
  return [...entries.filter(entry => entry.date !== date), { date, quality }]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_ENTRIES);
}

export interface SleepGroup {
  days: number;
  /** Média de minutos estudados por dia. */
  minutesPerDay: number;
  /** Acerto nas questões do grupo; null sem questões. */
  accuracy: number | null;
}

export interface SleepComparison {
  good: SleepGroup;
  poor: SleepGroup;
  /** True com ao menos SLEEP_MIN_DAYS dias em cada grupo. */
  enough: boolean;
}

/**
 * Estudo e acerto nos dias após sono bom × ruim. "Mais ou menos" fica de fora para os dois
 * extremos ficarem claros. É associação, não causa.
 */
export function compareStudyBySleep({
  sleepLog = [],
  studySessions = [],
  questoes = [],
}: {
  sleepLog?: SleepEntry[];
  studySessions?: Array<{ date?: string | null; durationSeconds?: number }>;
  questoes?: Array<{ date?: string | null; resolved?: number; correct?: number }>;
}): SleepComparison {
  const group = (quality: SleepQuality): SleepGroup => {
    const dates = new Set(
      sleepLog.filter(entry => entry.quality === quality).map(entry => entry.date)
    );
    const seconds = studySessions
      .filter(session => session.date && dates.has(session.date))
      .reduce((sum, session) => sum + Math.max(0, Number(session.durationSeconds) || 0), 0);
    let resolved = 0;
    let correct = 0;
    for (const question of questoes) {
      if (!question.date || !dates.has(question.date)) continue;
      const r = Math.max(0, Number(question.resolved) || 0);
      resolved += r;
      correct += Math.min(r, Math.max(0, Number(question.correct) || 0));
    }
    return {
      days: dates.size,
      minutesPerDay: dates.size ? Math.round(seconds / 60 / dates.size) : 0,
      accuracy: resolved ? Math.round((correct / resolved) * 1000) / 10 : null,
    };
  };
  const good = group('good');
  const poor = group('poor');
  return { good, poor, enough: good.days >= SLEEP_MIN_DAYS && poor.days >= SLEEP_MIN_DAYS };
}
