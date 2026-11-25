import { addLocalDays, parseLocalDate } from '../core/date-utils.ts';
import { isSafeId } from '../core/utils.ts';
import type { LawRecord } from '../core/types.ts';

/** Dias de descanso antes da próxima volta: depois da 1ª volta, 7; da 2ª, 15; da 3ª em diante, 30. */
export const LAW_REREAD_DAYS = Object.freeze([7, 15, 30]);
/** Sem leitura há mais que isso no meio de uma volta, a lei aparece como parada. */
export const LAW_STALLED_DAYS = 7;

export type LawStatusKey = 'due' | 'stalled' | 'reading' | 'new' | 'resting';

export interface LawStatus {
  key: LawStatusKey;
  label: string;
  /** Próxima volta (AAAA-MM-DD) quando a lei está descansando ou vencida. */
  nextLapDate: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (value: unknown) =>
  typeof value === 'string' && ISO_DATE.test(value) && parseLocalDate(value) ? value : null;
const count = (value: unknown) => {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number >= 0 ? number : 0;
};
const positiveInt = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : null;
};

/** Intervalo efetivo da leitura: recorte [startArticle, endArticle] ou [1, totalArticles]. */
export function lawEffectiveRange(law: Pick<LawRecord, 'startArticle' | 'endArticle' | 'totalArticles'>): {
  start: number;
  end: number | null;
  span: number | null;
  isRange: boolean;
} {
  const start = law.startArticle != null && law.startArticle >= 1 ? law.startArticle : 1;
  const endCandidate =
    law.endArticle != null && law.endArticle >= start
      ? law.totalArticles != null
        ? Math.min(law.endArticle, law.totalArticles)
        : law.endArticle
      : law.totalArticles ?? null;
  const end = endCandidate != null && endCandidate >= start ? endCandidate : null;
  const span = end != null ? end - start + 1 : null;
  const isRange = Boolean(
    (law.startArticle != null && law.startArticle >= 1) ||
      (law.endArticle != null && law.endArticle >= start)
  );
  return { start, end, span, isRange };
}

/** Progresso normalizado na volta atual sobre o recorte ou total da norma. */
export function lawLapProgress(law: LawRecord): {
  done: number;
  total: number | null;
  label: string | null;
} {
  const range = lawEffectiveRange(law);
  if (!range.end || !range.span || law.currentArticle <= 0) {
    return { done: 0, total: range.span, label: null };
  }
  const done = Math.max(0, Math.min(range.span, law.currentArticle - (range.start - 1)));
  const label = range.isRange
    ? `Art. ${law.currentArticle} (recorte ${range.start}–${range.end})`
    : `Art. ${law.currentArticle} de ${range.end}`;
  return { done, total: range.span, label };
}

/** Lei válida (nome obrigatório) ou null. Artigo atual nunca passa do total ou do recorte final. */
export function normalizeLaw(raw: unknown): LawRecord | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const id = typeof source.id === 'string' ? source.id.trim() : '';
  const name = typeof source.name === 'string' ? source.name.trim().slice(0, 120) : '';
  if (!id || !name) return null;
  const total = count(source.totalArticles) || null;
  const startArticleRaw = positiveInt(source.startArticle);
  const startArticle =
    startArticleRaw != null && total != null ? Math.min(startArticleRaw, total) : startArticleRaw;
  const endRaw = positiveInt(source.endArticle);
  const minEnd = startArticle ?? 1;
  const endBounded = endRaw != null ? (total != null ? Math.min(endRaw, total) : endRaw) : null;
  const endArticle = endBounded != null && endBounded >= minEnd ? endBounded : null;
  const upperLimit = endArticle ?? total;
  const current = count(source.currentArticle);
  const hotArticles =
    typeof source.hotArticles === 'string' && source.hotArticles.trim()
      ? source.hotArticles.trim().slice(0, 200)
      : null;
  const topicIds = Array.isArray(source.topicIds)
    ? [...new Set(source.topicIds.filter((tid): tid is string => isSafeId(tid)))].slice(0, 50)
    : [];

  return {
    id,
    name,
    subjectId: typeof source.subjectId === 'string' && source.subjectId ? source.subjectId : null,
    totalArticles: total,
    currentArticle: upperLimit ? Math.min(current, upperLimit) : current,
    laps: count(source.laps),
    lastReadAt: date(source.lastReadAt),
    lapCompletedAt: date(source.lapCompletedAt),
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : '',
    ...(startArticle != null ? { startArticle } : {}),
    ...(endArticle != null ? { endArticle } : {}),
    ...(hotArticles ? { hotArticles } : {}),
    ...(topicIds.length ? { topicIds } : {}),
  };
}

/** Fecha a volta atual: soma uma volta e recomeça do artigo zero. */
export function completeLawLap(law: LawRecord, today: string): LawRecord {
  return {
    ...law,
    laps: law.laps + 1,
    currentArticle: 0,
    lastReadAt: today,
    lapCompletedAt: today,
  };
}

/** Registra a leitura até um artigo; chegar ao último artigo (ou ao fim do recorte) fecha a volta. */
export function registerLawReading(law: LawRecord, article: number, today: string): LawRecord {
  const reached = Math.max(0, Math.floor(Number(article) || 0));
  const { end } = lawEffectiveRange(law);
  if (end && reached >= end) return completeLawLap(law, today);
  return { ...law, currentArticle: reached, lastReadAt: today };
}

const daysBetween = (from: string, to: string) =>
  Math.round(
    (parseLocalDate(to)!.getTime() - parseLocalDate(from)!.getTime()) / (24 * 60 * 60 * 1000)
  );

const ordinal = (n: number) => `${n}ª`;

export function lawStatus(law: LawRecord, today: string): LawStatus {
  if (!law.lastReadAt) return { key: 'new', label: 'Ainda não lida', nextLapDate: null };
  if (law.currentArticle > 0 || !law.laps || !law.lapCompletedAt) {
    const idle = daysBetween(law.lastReadAt, today);
    return idle > LAW_STALLED_DAYS
      ? { key: 'stalled', label: `Parada há ${idle} dias`, nextLapDate: null }
      : { key: 'reading', label: `Lendo a ${ordinal(law.laps + 1)} volta`, nextLapDate: null };
  }
  const rest = LAW_REREAD_DAYS[Math.min(law.laps, LAW_REREAD_DAYS.length) - 1];
  const nextLapDate = addLocalDays(law.lapCompletedAt, rest) || today;
  return nextLapDate <= today
    ? { key: 'due', label: `Hora da ${ordinal(law.laps + 1)} volta`, nextLapDate }
    : { key: 'resting', label: `${ordinal(law.laps)} volta concluída`, nextLapDate };
}

const STATUS_ORDER: Record<LawStatusKey, number> = {
  due: 0,
  stalled: 1,
  reading: 2,
  new: 3,
  resting: 4,
};

/** Vencidas e paradas primeiro: é onde a lei seca está escapando. */
export function sortLawsForReview(laws: LawRecord[], today: string): LawRecord[] {
  return [...laws].sort(
    (a, b) =>
      STATUS_ORDER[lawStatus(a, today).key] - STATUS_ORDER[lawStatus(b, today).key] ||
      a.name.localeCompare(b.name, 'pt-BR')
  );
}
