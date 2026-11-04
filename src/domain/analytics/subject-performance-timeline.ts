import { subjectColorOf } from '../subjects/subject-color.js';
import { addLocalDays, parseLocalDate } from '../../core/date-utils.js';

export interface PerformanceQuestionItem {
  date?: string | null;
  subjectId?: string | null;
  resolved?: number | null;
  correct?: number | null;
}

export interface SubjectMeta {
  id: string;
  name: string;
  color?: unknown;
}

export interface SubjectAccuracyPoint {
  periodKey: string;
  label: string;
  resolved: number;
  correct: number;
  accuracy: number | null; // null se resolved < minQuestionsForAccuracy (ex: 1)
}

export interface SubjectPerformanceSeries {
  subjectId: string;
  subjectName: string;
  colorSlot: number;
  totalResolved: number;
  totalCorrect: number;
  overallAccuracy: number | null;
  points: SubjectAccuracyPoint[];
}

export interface MultiSubjectPerformanceModel {
  periods: string[];
  periodLabels: string[];
  series: SubjectPerformanceSeries[];
  totalResolved: number;
  totalCorrect: number;
  overallAccuracy: number | null;
}

export interface BuildMultiSubjectPerformanceOptions {
  questions: PerformanceQuestionItem[];
  subjects: SubjectMeta[];
  today: string;
  period?: '7' | '30' | '90' | '180' | 'all';
  minSamplePerPoint?: number;
}

function resolveBucketKey(date: string, granularity: 'day' | 'week' | 'month'): string {
  if (granularity === 'month') return date.slice(0, 7);
  if (granularity === 'day') return date;
  // Semana: segunda-feira como início
  const parsed = parseLocalDate(date);
  const weekday = parsed ? parsed.getDay() : 1;
  const offset = (weekday + 6) % 7;
  return addLocalDays(date, -offset) || date;
}

/**
 * Agrupa respostas de questões por disciplina ao longo do tempo para gráfico multilinear.
 * Função pura e determinística sem dependências de DOM.
 */
export function buildMultiSubjectPerformanceModel({
  questions = [],
  subjects = [],
  today,
  period = '90',
  minSamplePerPoint = 1,
}: BuildMultiSubjectPerformanceOptions): MultiSubjectPerformanceModel {
  const days = period === 'all' ? null : Number(period) || 90;
  const cutoff = days ? addLocalDays(today, -(days - 1)) : null;

  const granularity: 'day' | 'week' | 'month' =
    period === '7' ? 'day' : period === '30' || period === '90' ? 'week' : 'month';

  const subjectMap = new Map<string, { name: string; colorSlot: number }>();
  for (const s of subjects) {
    subjectMap.set(s.id, {
      name: s.name,
      colorSlot: subjectColorOf(s, subjects),
    });
  }

  // Identifica períodos e acumula por disciplina
  const periodSet = new Set<string>();
  const matrix = new Map<string, Map<string, { resolved: number; correct: number }>>();
  let totalResolved = 0;
  let totalCorrect = 0;

  for (const q of questions) {
    const d = q.date;
    if (!d || !parseLocalDate(d) || d > today || (cutoff && d < cutoff)) continue;
    const resolved = Math.max(0, Number(q.resolved) || 0);
    const correct = Math.min(resolved, Math.max(0, Number(q.correct) || 0));
    if (resolved <= 0) continue;

    const subId = q.subjectId || '__sem_disciplina';
    const pKey = resolveBucketKey(d, granularity);
    periodSet.add(pKey);

    if (!matrix.has(subId)) {
      matrix.set(subId, new Map());
    }
    const subPeriods = matrix.get(subId)!;
    const current = subPeriods.get(pKey) || { resolved: 0, correct: 0 };
    current.resolved += resolved;
    current.correct += correct;
    subPeriods.set(pKey, current);

    totalResolved += resolved;
    totalCorrect += correct;
  }

  const sortedPeriods = [...periodSet].sort();
  const periodLabels = sortedPeriods.map(p => {
    if (granularity === 'month') {
      const [y, m] = p.split('-');
      return `${m}/${y.slice(2)}`;
    }
    const [, m, d] = p.split('-');
    return `${d}/${m}`;
  });

  const series: SubjectPerformanceSeries[] = [];

  for (const [subId, subPeriods] of matrix.entries()) {
    let subTotalResolved = 0;
    let subTotalCorrect = 0;

    const points: SubjectAccuracyPoint[] = sortedPeriods.map((pKey, idx) => {
      const data = subPeriods.get(pKey);
      if (!data || data.resolved < minSamplePerPoint) {
        return {
          periodKey: pKey,
          label: periodLabels[idx],
          resolved: data ? data.resolved : 0,
          correct: data ? data.correct : 0,
          accuracy: null,
        };
      }
      subTotalResolved += data.resolved;
      subTotalCorrect += data.correct;
      return {
        periodKey: pKey,
        label: periodLabels[idx],
        resolved: data.resolved,
        correct: data.correct,
        accuracy: Math.round((data.correct / data.resolved) * 100),
      };
    });

    const meta = subjectMap.get(subId) || {
      name: subId === '__sem_disciplina' ? 'Sem disciplina' : 'Outra',
      colorSlot: 1,
    };

    series.push({
      subjectId: subId,
      subjectName: meta.name,
      colorSlot: meta.colorSlot,
      totalResolved: subTotalResolved,
      totalCorrect: subTotalCorrect,
      overallAccuracy:
        subTotalResolved > 0 ? Math.round((subTotalCorrect / subTotalResolved) * 100) : null,
      points,
    });
  }

  // Ordena disciplinas por total de questões decrescente
  series.sort((a, b) => b.totalResolved - a.totalResolved);

  return {
    periods: sortedPeriods,
    periodLabels,
    series,
    totalResolved,
    totalCorrect,
    overallAccuracy: totalResolved > 0 ? Math.round((totalCorrect / totalResolved) * 100) : null,
  };
}
