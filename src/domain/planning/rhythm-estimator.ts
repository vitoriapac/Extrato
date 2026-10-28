/**
 * Motor de cálculo determinístico para estimativa de ritmo de conclusão do edital
 * e monitoramento de revisões em atraso.
 *
 * Camada: Domain (sem dependências de DOM, Preact ou storage).
 */

export interface RhythmEstimatorInput {
  totalTopics: number;
  completedTopics: number;
  recentCompletedTopicsCount: number;
  windowDays?: number;
  today: string;
  examDate?: string | null;
  daysToExam?: number | null;
  addDays: (date: string, days: number) => string;
}

export interface RhythmEstimatorResult {
  status: 'sem-topicos' | 'completo' | 'sem-dados' | 'ok';
  remaining?: number;
  ratePerDay?: number;
  daysNeeded?: number;
  finishDate?: string;
  comparativo?: 'no-prazo' | 'atrasado' | null;
  daysToExam?: number | null;
}

/**
 * Calcula a velocidade diária de conclusão de tópicos e projeta a data de término
 * em relação à data limite da prova.
 */
export function calculateCoverageRhythm(input: RhythmEstimatorInput): RhythmEstimatorResult {
  const {
    totalTopics,
    completedTopics,
    recentCompletedTopicsCount,
    windowDays = 14,
    today,
    examDate,
    daysToExam,
    addDays,
  } = input;

  const remaining = totalTopics - completedTopics;

  if (totalTopics === 0) {
    return { status: 'sem-topicos' };
  }
  if (remaining <= 0) {
    return { status: 'completo' };
  }

  const ratePerDay = recentCompletedTopicsCount / windowDays;

  if (ratePerDay <= 0) {
    return { status: 'sem-dados', remaining };
  }

  const daysNeeded = Math.ceil(remaining / ratePerDay);
  const finishDate = addDays(today, daysNeeded);
  let comparativo: 'no-prazo' | 'atrasado' | null = null;

  if (examDate && daysToExam != null) {
    comparativo = daysNeeded <= daysToExam ? 'no-prazo' : 'atrasado';
  }

  return {
    status: 'ok',
    remaining,
    ratePerDay,
    daysNeeded,
    finishDate,
    comparativo,
    daysToExam: daysToExam ?? null,
  };
}

export interface OverdueReviewRecord {
  date?: string | null;
  status?: string | null;
  [key: string]: any;
}

export interface OverdueReviewsInput {
  calendarItems: OverdueReviewRecord[];
  reviewAgendaItems: OverdueReviewRecord[];
  today: string;
  isCurrentReference: (item: OverdueReviewRecord) => boolean;
}

/**
 * Totaliza as revisões em atraso (com data anterior a hoje e não concluídas)
 * tanto no calendário de estudos quanto na agenda de revisões.
 */
export function calculateOverdueReviewsCount(input: OverdueReviewsInput): number {
  const { calendarItems, reviewAgendaItems, today, isCurrentReference } = input;
  const doCalendario = calendarItems.filter(
    c => c.date && c.date < today && c.status !== 'Concluído' && isCurrentReference(c)
  ).length;
  const daAgenda = reviewAgendaItems.filter(
    a => a.date && a.date < today && a.status !== 'Concluído' && isCurrentReference(a)
  ).length;
  return doCalendario + daAgenda;
}
