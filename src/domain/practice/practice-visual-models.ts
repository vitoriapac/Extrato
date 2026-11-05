import { subjectColorOf } from '../subjects/subject-color.js';

export interface SubjectMeta {
  id: string;
  name?: string;
  color?: unknown;
}

export interface WeeklyTrendPointVisual {
  weekIndex: number;
  label: string; // Ex: '04/11' ou 'S1'
  resolved: number;
  correct: number;
  accuracy: number | null; // % (0..100) ou null se insuficiente
  insufficientData: boolean;
}

export interface SubjectWeeklyTrendVisualModel {
  points: WeeklyTrendPointVisual[];
  trendDirection: 'improving' | 'stable' | 'worsening' | 'insufficient';
  trendLabel: string;
  trendDelta: number | null;
  maxResolved: number;
  averageAccuracy: number | null;
  colorSlot: number;
}

/**
 * Constrói o modelo de apresentação para a tendência semanal da matéria.
 * Pura e determinística.
 */
export function buildSubjectWeeklyTrendVisual({
  weeks = [],
  trend = {},
  colorSlot = 1,
  formatDate = (d: string) => d,
}: {
  weeks: Array<{
    start?: string;
    resolved?: number;
    correct?: number;
    accuracy?: number | null;
    insufficientData?: boolean;
  }>;
  trend?: {
    key?: string;
    label?: string;
    delta?: number | null;
  };
  colorSlot?: number;
  formatDate?: (dateStr: string) => string;
}): SubjectWeeklyTrendVisualModel {
  let maxResolved = 0;
  let totalResolved = 0;
  let totalCorrect = 0;

  const points: WeeklyTrendPointVisual[] = weeks.map((w, index) => {
    const resolved = Math.max(0, Number(w.resolved) || 0);
    const correct = Math.max(0, Number(w.correct) || 0);
    if (resolved > maxResolved) maxResolved = resolved;
    totalResolved += resolved;
    totalCorrect += correct;

    const formattedDate = w.start ? formatDate(w.start) : '';
    const label = formattedDate ? formattedDate.slice(0, 5) : `S${index + 1}`;
    const rawAccuracy = w.accuracy != null ? Number(w.accuracy) : null;
    const isInsufficient = Boolean(w.insufficientData) || resolved < 10 || rawAccuracy === null;

    return {
      weekIndex: index,
      label,
      resolved,
      correct,
      accuracy: isInsufficient ? null : Math.round(rawAccuracy),
      insufficientData: isInsufficient,
    };
  });

  const averageAccuracy = totalResolved >= 10 ? Math.round((totalCorrect / totalResolved) * 100) : null;

  let trendDirection: 'improving' | 'stable' | 'worsening' | 'insufficient' = 'insufficient';
  if (trend.key === 'improving' || trend.key === 'stable' || trend.key === 'worsening') {
    trendDirection = trend.key;
  }

  return {
    points,
    trendDirection,
    trendLabel: trend.label || 'Sem dados suficientes',
    trendDelta: trend.delta != null ? Number(trend.delta) : null,
    maxResolved: Math.max(10, maxResolved),
    averageAccuracy,
    colorSlot,
  };
}

export interface ErrorParetoItemVisual {
  id: string;
  label: string;
  icon: string;
  count: number;
  share: number; // % sobre total de erros (0..100)
  cumulativeShare: number; // % acumulada (0..100)
  isVital: boolean; // se está dentro dos 80% do Pareto
  delta: number | null; // vs período anterior
}

export interface ErrorParetoVisualModel {
  items: ErrorParetoItemVisual[];
  totalErrors: number;
  vitalCount: number;
  predominantCause: string | null;
  hasPrevious: boolean;
}

/**
 * Constrói o modelo de apresentação para o gráfico de Pareto das causas de erro.
 * Identifica a causa raiz e as categorias responsáveis por 80% das falhas.
 */
export function buildErrorParetoVisual({
  items = [],
  totalErrors = 0,
  hasPrevious = false,
}: {
  items: Array<{
    id: string;
    label: string;
    icon?: string;
    value?: number;
    delta?: number | null;
  }>;
  totalErrors?: number;
  hasPrevious?: boolean;
}): ErrorParetoVisualModel {
  const effectiveTotal = Math.max(0, Number(totalErrors) || 0);

  if (effectiveTotal === 0 || !items.length) {
    return {
      items: [],
      totalErrors: 0,
      vitalCount: 0,
      predominantCause: null,
      hasPrevious,
    };
  }

  const sorted = [...items]
    .filter(it => (Number(it.value) || 0) > 0)
    .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

  let running = 0;
  let vitalCount = 0;

  const visualItems: ErrorParetoItemVisual[] = sorted.map((it, idx) => {
    const count = Math.max(0, Number(it.value) || 0);
    running += count;
    const share = Math.round((count / effectiveTotal) * 100);
    const cumulativeShare = Math.min(100, Math.round((running / effectiveTotal) * 100));
    
    // Regra dos 80/20: se até o item anterior ainda não tínhamos chegado em 80%, este item é vital
    const isVital = idx === 0 || (running - count) / effectiveTotal < 0.8;
    if (isVital) vitalCount++;

    return {
      id: it.id,
      label: it.label,
      icon: it.icon || 'alert-circle',
      count,
      share,
      cumulativeShare,
      isVital,
      delta: it.delta != null ? Number(it.delta) : null,
    };
  });

  return {
    items: visualItems,
    totalErrors: effectiveTotal,
    vitalCount,
    predominantCause: visualItems[0]?.label || null,
    hasPrevious,
  };
}

export interface SimulationTrendPointVisual {
  id: string;
  index: number;
  name: string;
  date: string;
  correct: number;
  total: number;
  score: number; // % (0..100)
  onTarget: boolean; // score >= targetScore
}

export interface SimulationTrendVisualModel {
  simulations: SimulationTrendPointVisual[];
  targetScore: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  scoreDelta: number | null; // latest - previous
  onTargetCount: number;
}

/**
 * Constrói o modelo para o gráfico de evolução de notas de simulados contra a meta de aprovação.
 */
export function buildSimulationTrendVisual({
  simulations = [],
  targetScore = 80,
  maxPoints = 12,
}: {
  simulations: Array<{
    id: string;
    nome?: string;
    date?: string;
    correct?: number;
    total?: number;
    score?: number;
  }>;
  targetScore?: number;
  maxPoints?: number;
}): SimulationTrendVisualModel {
  const validSims = [...simulations]
    .filter(s => (Number(s.total) || 0) > 0)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(-maxPoints);

  if (!validSims.length) {
    return {
      simulations: [],
      targetScore,
      averageScore: null,
      bestScore: null,
      latestScore: null,
      scoreDelta: null,
      onTargetCount: 0,
    };
  }

  let totalScoreSum = 0;
  let bestScore = 0;
  let onTargetCount = 0;

  const points: SimulationTrendPointVisual[] = validSims.map((sim, index) => {
    const correct = Math.max(0, Number(sim.correct) || 0);
    const total = Math.max(1, Number(sim.total) || 1);
    const score = Math.round(Number(sim.score) || (correct / total) * 100);
    totalScoreSum += score;
    if (score > bestScore) bestScore = score;
    const onTarget = score >= targetScore;
    if (onTarget) onTargetCount++;

    return {
      id: sim.id,
      index,
      name: sim.nome || `Simulado ${index + 1}`,
      date: sim.date || '—',
      correct,
      total,
      score,
      onTarget,
    };
  });

  const averageScore = Math.round(totalScoreSum / points.length);
  const latestScore = points[points.length - 1].score;
  const previousScore = points.length > 1 ? points[points.length - 2].score : null;
  const scoreDelta = previousScore !== null ? latestScore - previousScore : null;

  return {
    simulations: points,
    targetScore,
    averageScore,
    bestScore,
    latestScore,
    scoreDelta,
    onTargetCount,
  };
}

export interface SimulationSubjectBreakdownRowVisual {
  id: string;
  subjectId: string;
  subjectName: string;
  colorSlot: number;
  correct: number;
  total: number;
  score: number; // % (0..100)
  relativeGap: number; // score - overallScore (p.p.)
  isAboveAverage: boolean;
}

export interface SimulationBreakdownVisualModel {
  rows: SimulationSubjectBreakdownRowVisual[];
  overallScore: number;
  highestSubject: string | null;
  lowestSubject: string | null;
}

/**
 * Constrói o modelo de apresentação para o raio-x por disciplina dentro do detalhe do simulado.
 */
export function buildSimulationBreakdownVisual({
  breakdownItems,
  breakdown,
  subjects = [],
  overallScore = 0,
}: {
  breakdownItems?: Array<{
    id: string;
    subjectId?: string | null;
    correct?: number;
    total?: number;
  }>;
  breakdown?: Array<{
    id: string;
    subjectId?: string | null;
    correct?: number;
    total?: number;
  }>;
  subjects: SubjectMeta[];
  overallScore?: number;
}): SimulationBreakdownVisualModel {
  const items = breakdownItems || breakdown || [];
  const subjectMap = new Map<string, { name: string; colorSlot: number }>();
  for (const s of subjects) {
    subjectMap.set(s.id, {
      name: s.name || 'Disciplina',
      colorSlot: subjectColorOf(s, subjects),
    });
  }

  const rows: SimulationSubjectBreakdownRowVisual[] = [];

  for (const item of items) {
    const subId = item.subjectId || '__sem_disciplina';
    const total = Math.max(0, Number(item.total) || 0);
    const correct = Math.max(0, Number(item.correct) || 0);
    if (total === 0) continue;

    const score = Math.round((correct / total) * 100);
    const meta = subjectMap.get(subId) || {
      name: subId === '__sem_disciplina' ? 'Sem disciplina' : 'Outra',
      colorSlot: 1,
    };

    const relativeGap = score - overallScore;

    rows.push({
      id: item.id,
      subjectId: subId,
      subjectName: meta.name,
      colorSlot: meta.colorSlot,
      correct,
      total,
      score,
      relativeGap,
      isAboveAverage: relativeGap >= 0,
    });
  }

  rows.sort((a, b) => b.score - a.score);

  return {
    rows,
    overallScore: Math.round(overallScore),
    highestSubject: rows[0]?.subjectName || null,
    lowestSubject: rows.length ? rows[rows.length - 1].subjectName : null,
  };
}
