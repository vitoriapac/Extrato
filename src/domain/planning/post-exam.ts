import { addLocalDays, parseLocalDate } from '../../core/date-utils.ts';
import { scorePercent } from '../exams/simulation-score.ts';
import { cutoffPercent } from '../analytics/cutoff-reference.ts';
import type { PostExamRecord } from '../../core/types.ts';

/** Dias depois da prova em que o cartão "Depois da prova" aparece. */
export const POST_EXAM_WINDOW_DAYS = 60;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (value: unknown) =>
  typeof value === 'string' && ISO_DATE.test(value) && parseLocalDate(value) ? value : null;
const count = (value: unknown) => {
  if (value === '' || value == null) return null;
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number >= 0 ? number : null;
};

/** Registro pós-prova válido: data da prova obrigatória; acertos nunca passam do total. */
export function normalizePostExam(raw: unknown): PostExamRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const examDate = date(source.examDate);
  if (!examDate) return null;
  const total = count(source.total);
  const correct = count(source.correct);
  const wrong = count(source.wrong);
  return {
    examDate,
    total: total || null,
    correct: correct != null && total ? Math.min(correct, total) : correct,
    wrong:
      wrong != null && total && correct != null
        ? Math.min(wrong, total - Math.min(correct, total))
        : wrong,
    appealDeadline: date(source.appealDeadline),
  };
}

export interface PostExamModel {
  examDate: string;
  daysSince: number;
  record: PostExamRecord;
  /** Nota estimada pelo gabarito preliminar, em %; null sem acertos e total. */
  estimate: number | null;
  net: boolean;
  cutoff: number | null;
  cutoffGap: number | null;
  target: number | null;
  targetGap: number | null;
  /** Dias até o prazo de recurso (0 = hoje); null sem prazo ou já vencido. */
  appealDaysLeft: number | null;
}

const daysBetween = (from: string, to: string) =>
  Math.round(
    (parseLocalDate(to)!.getTime() - parseLocalDate(from)!.getTime()) / (24 * 60 * 60 * 1000)
  );
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Cartão dos 60 dias depois da prova: gabarito preliminar contra corte e meta, e prazo de recurso.
 * Um registro de outra data de prova é ignorado.
 */
export function buildPostExamModel({
  examDate,
  today,
  record = null,
  scoring = null,
  cutoff = null,
  targetScore = null,
}: {
  examDate: string | null;
  today: string;
  record?: PostExamRecord | null;
  scoring?: string | null;
  cutoff?: unknown;
  targetScore?: number | null;
}): PostExamModel | null {
  if (!date(examDate) || !date(today)) return null;
  const daysSince = daysBetween(examDate!, today);
  if (daysSince < 1 || daysSince > POST_EXAM_WINDOW_DAYS) return null;
  const own =
    record && record.examDate === examDate
      ? record
      : { examDate: examDate!, total: null, correct: null, wrong: null, appealDeadline: null };
  const net = scoring === 'certo-errado';
  const estimate =
    own.total && own.correct != null
      ? round1(
          scorePercent(
            { total: own.total, correct: own.correct, wrong: own.wrong ?? undefined },
            scoring
          )
        )
      : null;
  const cutoffValue = cutoffPercent(cutoff);
  const target =
    targetScore != null && Number.isFinite(Number(targetScore)) ? Number(targetScore) : null;
  const appealDaysLeft = own.appealDeadline ? daysBetween(today, own.appealDeadline) : null;
  return {
    examDate: examDate!,
    daysSince,
    record: own,
    estimate,
    net,
    cutoff: cutoffValue,
    cutoffGap: estimate !== null && cutoffValue !== null ? round1(estimate - cutoffValue) : null,
    target,
    targetGap: estimate !== null && target !== null ? round1(estimate - target) : null,
    appealDaysLeft: appealDaysLeft !== null && appealDaysLeft >= 0 ? appealDaysLeft : null,
  };
}

/** Véspera do prazo de recurso, para a tarefa chegar antes de o prazo vencer; nunca antes de hoje. */
export function appealTaskDate(appealDeadline: string, today: string): string {
  const eve = addLocalDays(appealDeadline, -1) || appealDeadline;
  return eve < today ? today : eve;
}
