import { calculateWindowTrend } from './trends.js';
import { parseLocalDate } from '../../core/date-utils.js';

export interface PerformanceConfidence {
  key: 'insufficient' | 'low' | 'medium' | 'high';
  label: string;
}

export interface AccuracyClassification {
  key: 'none' | 'strong' | 'attention' | 'weak';
  icon: string;
  label: string;
}

export interface PerformanceCounts {
  resolved: number;
  correct: number;
  accuracy: number | null;
}

export const MIN_WEEKLY_QUESTIONS = 10;
export const MIN_TREND_WINDOW_QUESTIONS = 30;
export const MIN_TOPIC_TREND_WINDOW_QUESTIONS = 20;

export function accuracyFromCounts(correct: number, total: number): number | null {
  return total > 0 ? Math.round((correct / total) * 1000) / 10 : null;
}

export function performanceConfidence(
  total: number,
  minWeekly: number = MIN_WEEKLY_QUESTIONS
): PerformanceConfidence {
  if (total < minWeekly) return { key: 'insufficient', label: 'Amostra insuficiente' };
  if (total < 20) return { key: 'low', label: 'Evidência da amostra: baixa' };
  if (total < 50) return { key: 'medium', label: 'Evidência da amostra: média' };
  return { key: 'high', label: 'Evidência da amostra: alta' };
}

export function classifyAccuracy(accuracy: number | null, target: number): AccuracyClassification {
  if (accuracy === null) return { key: 'none', icon: 'circle', label: 'Sem dados' };
  if (accuracy >= target) return { key: 'strong', icon: 'circle-check', label: 'Na meta' };
  if (accuracy >= target - 10)
    return { key: 'attention', icon: 'alert-triangle', label: 'Atenção' };
  return { key: 'weak', icon: 'alert-circle', label: 'Prioritário' };
}

export function calculateTopicPerformance(
  records: Array<{ topicId?: string | null; resolved?: number; correct?: number }>,
  topicId: string
): PerformanceCounts {
  const filtered = records.filter(q => q.topicId === topicId);
  const resolved = filtered.reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
  const correct = filtered.reduce((sum, q) => sum + (Number(q.correct) || 0), 0);
  return { resolved, correct, accuracy: accuracyFromCounts(correct, resolved) };
}

/** Questões refeitas valem metade: já vistas, medem menos domínio novo. */
export const RETRY_QUESTION_WEIGHT = 0.5;
/** Questões da banca da prova valem o dobro quando o tópico tem evidência suficiente dela. */
export const TARGET_BANCA_QUESTION_WEIGHT = 2;
export const MIN_TARGET_BANCA_TOPIC_QUESTIONS = 10;
/** Decaimento temporal do Domínio: platô de 150 dias sem perda, depois meia-vida de 120d com piso 0,35. */
export const RECENCY_PLATEAU_DAYS = 150;
export const RECENCY_HALF_LIFE_DAYS = 120;
export const MIN_RECENCY_WEIGHT = 0.35;

export function recencyWeight(
  recordDate?: string | null,
  referenceDate?: string | null
): number {
  if (!recordDate || !referenceDate) return 1;
  const rec = parseLocalDate(recordDate);
  const ref = parseLocalDate(referenceDate);
  if (!rec || !ref) return 1;
  const ageDays = Math.round((ref.getTime() - rec.getTime()) / 86400000);
  if (ageDays <= RECENCY_PLATEAU_DAYS) return 1;
  return Math.max(
    MIN_RECENCY_WEIGHT,
    Math.pow(0.5, (ageDays - RECENCY_PLATEAU_DAYS) / RECENCY_HALF_LIFE_DAYS)
  );
}

export interface WeightedPerformanceCounts extends PerformanceCounts {
  weighting: {
    retryQuestions: number;
    targetBanca: string | null;
    targetBancaQuestions: number;
    /** True quando as questões da banca da prova entraram com peso dobrado. */
    bancaWeighted: boolean;
    recencyWeighted: boolean;
    answeredAccuracy: number | null;
    netAccuracy: number | null;
  };
}

/**
 * Acerto do tópico para o Domínio: refeitas com meio peso, decaimento após 150 dias (piso 0,35),
 * banca da prova em dobro com >= 10 questões e leitura líquida Cebraspe quando há brancas explícitas.
 */
export function calculateWeightedTopicPerformance(
  records: Array<{
    topicId?: string | null;
    resolved?: number;
    correct?: number;
    blank?: number | null;
    banca?: string | null;
    retry?: boolean;
    date?: string | null;
  }>,
  topicId: string,
  {
    targetBanca = null,
    referenceDate = null,
    scoringMode = 'padrao',
  }: {
    targetBanca?: string | null;
    referenceDate?: string | null;
    scoringMode?: string | null;
  } = {}
): WeightedPerformanceCounts {
  const filtered = records.filter(q => q.topicId === topicId);
  const count = (q: { resolved?: number }) => Math.max(0, Number(q.resolved) || 0);
  const isTarget = (q: { banca?: string | null }) =>
    Boolean(targetBanca) && q.banca === targetBanca;
  const targetBancaQuestions = filtered.filter(isTarget).reduce((sum, q) => sum + count(q), 0);
  const bancaWeighted = targetBancaQuestions >= MIN_TARGET_BANCA_TOPIC_QUESTIONS;
  const isCebraspe = scoringMode === 'certo-errado';

  let volume = 0;
  let weightedTotal = 0;
  let weightedCorrect = 0;
  let retryQuestions = 0;
  let recencyWeighted = false;
  let answeredWeightedTotal = 0;
  let answeredWeightedCorrect = 0;
  let netWeightedPoints = 0;

  for (const q of filtered) {
    const resolved = count(q);
    const correct = Math.min(resolved, Math.max(0, Number(q.correct) || 0));
    const retryWeight = q.retry ? RETRY_QUESTION_WEIGHT : 1;
    const rWeight = recencyWeight(q.date, referenceDate);
    if (rWeight < 1) recencyWeighted = true;
    const weight =
      retryWeight *
      rWeight *
      (bancaWeighted && isTarget(q) ? TARGET_BANCA_QUESTION_WEIGHT : 1);
    if (q.retry) retryQuestions += resolved;

    const hasExplicitBlank = q.blank != null && String(q.blank) !== '';
    const blank = hasExplicitBlank
      ? Math.min(resolved - correct, Math.max(0, Math.floor(Number(q.blank) || 0)))
      : 0;
    const wrong = Math.max(0, resolved - correct - blank);
    const answered = Math.max(0, resolved - blank);

    if (isCebraspe) {
      answeredWeightedTotal += answered * weight;
      answeredWeightedCorrect += correct * weight;
      netWeightedPoints += (correct - wrong) * weight;
    }

    const effectiveCorrect = isCebraspe && hasExplicitBlank ? correct - wrong : correct;
    volume += resolved * retryWeight;
    weightedTotal += resolved * weight;
    weightedCorrect += effectiveCorrect * weight;
  }

  const clampedWeightedCorrect = Math.max(0, weightedCorrect);
  return {
    resolved: Math.round(volume * 10) / 10,
    correct: Math.round(clampedWeightedCorrect * 10) / 10,
    accuracy: accuracyFromCounts(clampedWeightedCorrect, weightedTotal),
    weighting: {
      retryQuestions,
      targetBanca,
      targetBancaQuestions,
      bancaWeighted,
      recencyWeighted,
      answeredAccuracy: isCebraspe
        ? accuracyFromCounts(answeredWeightedCorrect, answeredWeightedTotal)
        : null,
      netAccuracy: isCebraspe
        ? accuracyFromCounts(Math.max(0, netWeightedPoints), weightedTotal)
        : null,
    },
  };
}

export function calculateSubjectPerformanceCounts(
  questions: Array<any>,
  simulados: Array<any>,
  subjectId: string,
  entitySubjectId: (item: any) => string | null
): PerformanceCounts {
  let resolved = 0;
  let correct = 0;

  questions
    .filter(question => entitySubjectId(question) === subjectId)
    .forEach(question => {
      resolved += Number(question.resolved) || 0;
      correct += Number(question.correct) || 0;
    });

  simulados.forEach(simulado =>
    (simulado.breakdown || [])
      .filter((item: any) => entitySubjectId(item) === subjectId)
      .forEach((item: any) => {
        resolved += Number(item.total) || 0;
        correct += Number(item.correct) || 0;
      })
  );

  return { resolved, correct, accuracy: accuracyFromCounts(correct, resolved) };
}

export function calculateTopicErrorRate(
  topicPerformance: PerformanceCounts,
  subjectPerformance: PerformanceCounts
) {
  const topicRate = topicPerformance.accuracy === null ? null : 100 - topicPerformance.accuracy;
  const subjectRate =
    subjectPerformance.accuracy === null ? null : 100 - subjectPerformance.accuracy;

  if (topicRate === null || topicPerformance.resolved < 10) {
    return {
      rate: subjectRate,
      source: subjectRate === null ? 'none' : 'subject',
      topicWeight: 0,
      topicPerformance,
      subjectPerformance,
    };
  }

  if (subjectRate === null) {
    return {
      rate: Math.round(topicRate * 10) / 10,
      source: 'topic',
      topicWeight: 1,
      topicPerformance,
      subjectPerformance,
    };
  }

  const topicWeight =
    topicPerformance.resolved >= 50 ? 1 : 0.2 + ((topicPerformance.resolved - 10) / 40) * 0.8;
  const rate = Math.round((topicRate * topicWeight + subjectRate * (1 - topicWeight)) * 10) / 10;

  return {
    rate,
    source: topicWeight === 1 ? 'topic' : 'blended',
    topicWeight,
    topicPerformance,
    subjectPerformance,
  };
}

export function calculateSubjectPerformanceBetween({
  records,
  subjectId,
  start,
  end,
  entitySubjectId,
  minWeekly = MIN_WEEKLY_QUESTIONS,
}: {
  records: Array<any>;
  subjectId: string;
  start: string;
  end: string;
  entitySubjectId: (item: any) => string | null;
  minWeekly?: number;
}) {
  const filtered = records.filter(
    q => entitySubjectId(q) === subjectId && q.date >= start && q.date <= end
  );
  const resolved = filtered.reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
  const correct = filtered.reduce((sum, q) => sum + (Number(q.correct) || 0), 0);
  return {
    start,
    end,
    resolved,
    correct,
    accuracy: accuracyFromCounts(correct, resolved),
    insufficientData: resolved < minWeekly,
  };
}

export function calculateSubjectWeeklyTrend({
  records,
  subjectId,
  weeks = 8,
  startOfWeekFn,
  addDaysFn,
  today,
  entitySubjectId,
  minWeekly = MIN_WEEKLY_QUESTIONS,
}: {
  records: Array<any>;
  subjectId: string;
  weeks?: number;
  startOfWeekFn: (iso: string) => string;
  addDaysFn: (iso: string, days: number) => string;
  today: string;
  entitySubjectId: (item: any) => string | null;
  minWeekly?: number;
}) {
  const currentStart = startOfWeekFn(today);
  return Array.from({ length: weeks }, (_, index) => {
    const weeksAgo = weeks - 1 - index;
    const start = addDaysFn(currentStart, -7 * weeksAgo);
    const end = addDaysFn(start, 6);
    return calculateSubjectPerformanceBetween({
      records,
      subjectId,
      start,
      end,
      entitySubjectId,
      minWeekly,
    });
  });
}

export function calculateTopicPerformanceBetween({
  records,
  topicId,
  start,
  end,
  minWeekly = MIN_WEEKLY_QUESTIONS,
}: {
  records: Array<any>;
  topicId: string;
  start: string;
  end: string;
  minWeekly?: number;
}) {
  const filtered = records.filter(q => q.topicId === topicId && q.date >= start && q.date <= end);
  const resolved = filtered.reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
  const correct = filtered.reduce((sum, q) => sum + (Number(q.correct) || 0), 0);
  return {
    start,
    end,
    resolved,
    correct,
    accuracy: accuracyFromCounts(correct, resolved),
    insufficientData: resolved < minWeekly,
  };
}

export function calculateTopicWeeklyTrend({
  records,
  topicId,
  weeks = 8,
  startOfWeekFn,
  addDaysFn,
  today,
  minWeekly = MIN_WEEKLY_QUESTIONS,
}: {
  records: Array<any>;
  topicId: string;
  weeks?: number;
  startOfWeekFn: (iso: string) => string;
  addDaysFn: (iso: string, days: number) => string;
  today: string;
  minWeekly?: number;
}) {
  const currentStart = startOfWeekFn(today);
  return Array.from({ length: weeks }, (_, index) => {
    const weeksAgo = weeks - 1 - index;
    const start = addDaysFn(currentStart, -7 * weeksAgo);
    const end = addDaysFn(start, 6);
    return calculateTopicPerformanceBetween({
      records,
      topicId,
      start,
      end,
      minWeekly,
    });
  });
}

export function calculateWeightedTrend(
  weeklyData: any[],
  minWindow: number = MIN_TREND_WINDOW_QUESTIONS
) {
  return calculateWindowTrend(weeklyData, minWindow);
}

export function calculateDominantTopicError(
  errorProfile: Record<string, any> | null,
  errorCategories: Record<string, any>,
  errorRecommendations: Record<string, any>
) {
  const dominant = errorProfile?.dominant;
  if (!dominant) return null;
  return {
    ...dominant,
    meta: errorCategories[dominant.key],
    recommendation: dominant.recommendation || errorRecommendations[dominant.key],
  };
}
