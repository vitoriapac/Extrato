import { calculateWindowTrend } from './trends.js';

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
  if (total < 20) return { key: 'low', label: 'Confiança da amostra: baixa' };
  if (total < 50) return { key: 'medium', label: 'Confiança da amostra: média' };
  return { key: 'high', label: 'Confiança da amostra: alta' };
}

export function classifyAccuracy(
  accuracy: number | null,
  target: number
): AccuracyClassification {
  if (accuracy === null) return { key: 'none', icon: '⚪', label: 'Sem dados' };
  if (accuracy >= target) return { key: 'strong', icon: '🟢', label: 'Na meta' };
  if (accuracy >= target - 10) return { key: 'attention', icon: '🟡', label: 'Atenção' };
  return { key: 'weak', icon: '🔴', label: 'Prioritário' };
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
  const filtered = records.filter(
    q => q.topicId === topicId && q.date >= start && q.date <= end
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
