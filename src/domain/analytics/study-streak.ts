/**
 * Sumarização de atividades diárias de estudo, identificação de datas ativas
 * e cálculo de sequência ininterrupta (streak).
 *
 * Camada: Domain (sem dependências de DOM, Preact ou storage).
 */

import { summarizeStudyRecords } from './study-metrics.js';
import { calculateActivityStreak } from './consistency.js';

export interface DailyStudySummaryInput {
  date: string;
  studySessions: Array<Record<string, any>>;
  questoes: Array<Record<string, any>>;
  simulados: Array<Record<string, any>>;
  reviewAgenda: Array<Record<string, any>>;
  targetHours: number;
  subjectId?: string;
  entitySubjectId: (item: Record<string, any>) => string | null;
  getSubjectName?: (id: string) => string;
  localDateFromTimestamp: (timestamp?: string | number | null) => string | null;
}

export interface DailyStudySummaryResult {
  date: string;
  sessions: Array<Record<string, any>>;
  seconds: number;
  questions: number;
  correct: number;
  reviews: number;
  simulations: number;
  targetSeconds: number;
  goalPct: number;
  accuracy: number | null;
  subjectNames: string[];
  meaningful: boolean;
  goalAchieved: boolean;
}

/**
 * Consolida o resumo de estudos de uma data civil específica, calculando tempo total,
 * questões resolvidas, revisões e atingimento da meta diária configurada.
 */
export function calculateDailyStudySummary(
  input: DailyStudySummaryInput
): DailyStudySummaryResult {
  const {
    date,
    studySessions,
    questoes,
    simulados,
    reviewAgenda,
    targetHours,
    subjectId = '',
    entitySubjectId,
    getSubjectName = (id: string) => id,
    localDateFromTimestamp,
  } = input;

  const matchesSubject = (item: Record<string, any>) =>
    !subjectId || entitySubjectId(item) === subjectId;

  const sessions = studySessions.filter(s => s.date === date && matchesSubject(s));
  const allSessionIds = new Set(studySessions.map(s => s.id));

  const independentQuestions = questoes.filter(
    q =>
      q.date === date &&
      matchesSubject(q) &&
      (!q.studySessionId || !allSessionIds.has(q.studySessionId))
  );

  const simulations = simulados.filter(
    sim =>
      sim.date === date &&
      (!subjectId || (sim.breakdown || []).some((row: Record<string, any>) => entitySubjectId(row) === subjectId))
  );

  const reviews = reviewAgenda.filter(
    review =>
      review.status === 'Concluído' &&
      localDateFromTimestamp(review.completedAt) === date &&
      matchesSubject(review)
  );

  const metrics = summarizeStudyRecords({
    sessions,
    questions: independentQuestions,
    simulations,
  });

  const { seconds, questions, correct, accuracy } = metrics;
  const subjectNames = new Set<string>();

  sessions.forEach(s => {
    const id = entitySubjectId(s);
    if (id) subjectNames.add(getSubjectName(id));
  });

  independentQuestions.forEach(q => {
    const id = entitySubjectId(q);
    if (id) subjectNames.add(getSubjectName(id));
  });

  const targetSeconds = Math.max(0, targetHours) * 3600;
  const goalPct = targetSeconds > 0 ? Math.round((seconds / targetSeconds) * 100) : 0;

  const meaningful =
    seconds >= 300 ||
    independentQuestions.some(q => (Number(q.resolved) || 0) > 0) ||
    metrics.simulations > 0;

  const goalAchieved = targetSeconds > 0 && seconds >= targetSeconds;

  return {
    date,
    sessions,
    seconds,
    questions,
    correct,
    reviews: reviews.length,
    simulations: metrics.simulations,
    targetSeconds,
    goalPct,
    accuracy,
    subjectNames: [...subjectNames],
    meaningful,
    goalAchieved,
  };
}

export interface CollectActivityDatesInput {
  studySessions: Array<{ id: string; date?: string | null }>;
  questoes: Array<{ studySessionId?: string | null; date?: string; resolved?: number }>;
  simulados: Array<{ date?: string | null }>;
  isDateMeaningful: (date: string) => boolean;
}

/**
 * Coleta todas as datas únicas que possuem atividade de estudo significativa
 * (pelo menos 5 min de estudo, questões resolvidas ou simulados realizados).
 */
export function collectActivityDates(input: CollectActivityDatesInput): Set<string> {
  const { studySessions, questoes, simulados, isDateMeaningful } = input;
  const set = new Set<string>();
  const sessionIds = new Set(studySessions.map(s => s.id));

  const allDates = new Set(
    [
      ...studySessions.map(s => s.date),
      ...questoes
        .filter(q => !q.studySessionId || !sessionIds.has(q.studySessionId))
        .map(q => q.date),
      ...simulados.map(s => s.date),
    ].filter(Boolean) as string[]
  );

  allDates.forEach(date => {
    if (isDateMeaningful(date)) {
      set.add(date);
    }
  });

  return set;
}

export interface CollectGoalDatesInput {
  studySessions: Array<{ date?: string | null }>;
  isGoalAchievedForDate: (date: string) => boolean;
}

/**
 * Coleta todas as datas únicas em que a meta diária de estudos foi cumprida.
 */
export function collectGoalDates(input: CollectGoalDatesInput): Set<string> {
  const { studySessions, isGoalAchievedForDate } = input;
  const set = new Set<string>();
  const sessionDates = new Set(studySessions.map(s => s.date).filter(Boolean) as string[]);

  sessionDates.forEach(date => {
    if (isGoalAchievedForDate(date)) {
      set.add(date);
    }
  });

  return set;
}

/**
 * Calcula a sequência ininterrupta de dias estudados.
 */
export function computeActivityStreak(
  activityDates: Set<string>,
  options: { today: string; addDays: (date: string, days: number) => string }
) {
  return calculateActivityStreak(activityDates, options);
}
