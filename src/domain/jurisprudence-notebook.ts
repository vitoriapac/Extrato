import { addLocalDays, parseLocalDate } from '../core/date-utils.ts';
import { isSafeId } from '../core/utils.ts';
import type { JurisprudenceKind, JurisprudenceRecord } from '../core/types.ts';

/** Intervalos espaçados sugeridos (em dias) para revisão de julgados e súmulas. */
export const JURISPRUDENCE_REVIEW_DAYS = Object.freeze([7, 21, 45]);

export const JURISPRUDENCE_KINDS: readonly JurisprudenceKind[] = Object.freeze([
  'informativo_stf',
  'informativo_stj',
  'sumula_vinculante',
  'sumula_stj',
  'sumula_stf',
  'sumula_tst',
  'tema_repetitivo',
]);

export const JURISPRUDENCE_KIND_LABELS: Readonly<Record<JurisprudenceKind, string>> = Object.freeze({
  informativo_stf: 'Informativo STF',
  informativo_stj: 'Informativo STJ',
  sumula_vinculante: 'Súmula Vinculante',
  sumula_stj: 'Súmula STJ',
  sumula_stf: 'Súmula STF',
  sumula_tst: 'Súmula TST',
  tema_repetitivo: 'Tema Repetitivo',
});

export type JurisprudenceStatusKey = 'due' | 'new' | 'resting';

export interface JurisprudenceStatus {
  key: JurisprudenceStatusKey;
  label: string;
  nextReviewDate: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KIND_SET = new Set<string>(JURISPRUDENCE_KINDS);

const validDate = (value: unknown): string | null =>
  typeof value === 'string' && ISO_DATE.test(value) && parseLocalDate(value) ? value : null;

const nonNegInt = (value: unknown): number => {
  const num = Math.floor(Number(value));
  return Number.isFinite(num) && num >= 0 ? num : 0;
};

/** Normaliza um registro de informativo/súmula/tema ou retorna null se inválido. */
export function normalizeJurisprudenceRecord(raw: unknown): JurisprudenceRecord | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const id = typeof source.id === 'string' ? source.id.trim() : '';
  if (!id || !isSafeId(id)) return null;
  const code = typeof source.code === 'string' ? source.code.trim().slice(0, 80) : '';
  const title = typeof source.title === 'string' ? source.title.trim().slice(0, 200) : '';
  if (!code && !title) return null;
  const kind: JurisprudenceKind = KIND_SET.has(String(source.kind))
    ? (source.kind as JurisprudenceKind)
    : 'informativo_stf';
  const thesisSummary =
    typeof source.thesisSummary === 'string' ? source.thesisSummary.trim().slice(0, 1000) : '';
  const subjectId = isSafeId(source.subjectId) ? String(source.subjectId) : null;
  const topicId = isSafeId(source.topicId) ? String(source.topicId) : null;
  const laps = nonNegInt(source.laps);
  const lastReadAt = validDate(source.lastReadAt);
  const nextReviewDate = validDate(source.nextReviewDate);
  const createdAt = typeof source.createdAt === 'string' ? source.createdAt : '';

  return {
    id,
    kind,
    code: code || title.slice(0, 80),
    title: title || code,
    thesisSummary,
    subjectId,
    topicId,
    laps,
    lastReadAt,
    nextReviewDate,
    createdAt,
  };
}

/** Registra uma leitura/revisão concluída e agenda o próximo retorno espaçado (7 → 21 → 45 dias). */
export function registerJurisprudenceReading(
  item: JurisprudenceRecord,
  today: string
): JurisprudenceRecord {
  const nextLaps = nonNegInt(item.laps) + 1;
  const interval =
    JURISPRUDENCE_REVIEW_DAYS[Math.min(nextLaps, JURISPRUDENCE_REVIEW_DAYS.length) - 1];
  const nextReviewDate = addLocalDays(today, interval) || today;
  return {
    ...item,
    laps: nextLaps,
    lastReadAt: today,
    nextReviewDate,
  };
}

/** Situação atual do julgado ou súmula frente à data civil local `today`. */
export function jurisprudenceStatus(
  item: JurisprudenceRecord,
  today: string
): JurisprudenceStatus {
  if (!item.lastReadAt || item.laps === 0) {
    return { key: 'new', label: 'Ainda não revisado', nextReviewDate: null };
  }
  const restDays =
    JURISPRUDENCE_REVIEW_DAYS[Math.min(item.laps, JURISPRUDENCE_REVIEW_DAYS.length) - 1];
  const nextReviewDate = item.nextReviewDate || addLocalDays(item.lastReadAt, restDays) || today;
  if (nextReviewDate <= today) {
    return {
      key: 'due',
      label: `Hora da ${item.laps + 1}ª revisão`,
      nextReviewDate,
    };
  }
  return {
    key: 'resting',
    label: `${item.laps}ª revisão em dia`,
    nextReviewDate,
  };
}

const ORDER: Record<JurisprudenceStatusKey, number> = {
  due: 0,
  new: 1,
  resting: 2,
};

/** Ordena priorizando julgados/súmulas com revisão vencida, depois novos, depois em dia. */
export function sortJurisprudenceForReview(
  items: JurisprudenceRecord[],
  today: string
): JurisprudenceRecord[] {
  return [...items].sort((a, b) => {
    const sa = jurisprudenceStatus(a, today);
    const sb = jurisprudenceStatus(b, today);
    if (ORDER[sa.key] !== ORDER[sb.key]) return ORDER[sa.key] - ORDER[sb.key];
    return `${a.code} ${a.title}`.localeCompare(`${b.code} ${b.title}`, 'pt-BR');
  });
}
