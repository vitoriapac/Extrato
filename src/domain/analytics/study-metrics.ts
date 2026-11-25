import { addLocalDays } from '../../core/date-utils.js';

export function summarizeStudyRecords({
  sessions = [],
  questions = [],
  simulations = [],
}: {
  sessions?: Array<Record<string, any>>;
  questions?: Array<Record<string, any>>;
  simulations?: Array<Record<string, any>>;
}) {
  const seconds = sessions.reduce((sum, item) => sum + (Number(item.durationSeconds) || 0), 0);
  const sessionQuestions = sessions.reduce(
    (sum, item) => sum + (Number(item.questionsResolved) || 0),
    0
  );
  const sessionCorrect = sessions.reduce(
    (sum, item) => sum + (Number(item.correctAnswers) || 0),
    0
  );
  const resolved =
    sessionQuestions + questions.reduce((sum, item) => sum + (Number(item.resolved) || 0), 0);
  const correct =
    sessionCorrect + questions.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
  return {
    seconds,
    questions: resolved,
    correct,
    accuracy: resolved ? Math.round((correct / resolved) * 100) : null,
    simulations: simulations.length,
  };
}

export interface FreshVsRetryStats {
  windowDays: number;
  fromDate: string;
  totalResolved: number;
  freshResolved: number;
  retryResolved: number;
  freshPercent: number | null;
  retryPercent: number | null;
  highRetryAlert: boolean;
}

/**
 * Calcula a proporção de questões inéditas vs. refeitas (`retry === true`) em uma
 * janela móvel de dias locais, sinalizando quando > 40% do volume recente é repetido.
 */
export function calculateFreshVsRetryStats(
  questions: Array<{ date?: string | null; resolved?: unknown; retry?: unknown }> = [],
  todayDate: string,
  windowDays = 30
): FreshVsRetryStats {
  const days = Math.max(1, Math.floor(Number(windowDays) || 30));
  const fromDate = addLocalDays(todayDate, 1 - days) || todayDate;
  let freshResolved = 0;
  let retryResolved = 0;

  for (const q of questions) {
    const date = typeof q?.date === 'string' ? q.date : '';
    if (!date || date < fromDate || date > todayDate) continue;
    const resolved = Math.max(0, Math.floor(Number(q.resolved) || 0));
    if (!resolved) continue;
    if (q.retry) retryResolved += resolved;
    else freshResolved += resolved;
  }

  const totalResolved = freshResolved + retryResolved;
  const freshPercent =
    totalResolved > 0 ? Math.round((freshResolved / totalResolved) * 100) : null;
  const retryPercent =
    totalResolved > 0 ? Math.round((retryResolved / totalResolved) * 100) : null;

  return {
    windowDays: days,
    fromDate,
    totalResolved,
    freshResolved,
    retryResolved,
    freshPercent,
    retryPercent,
    highRetryAlert: totalResolved >= 20 && (retryPercent ?? 0) > 40,
  };
}
