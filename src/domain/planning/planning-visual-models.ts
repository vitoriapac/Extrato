import { subjectColorOf } from '../subjects/subject-color.js';
import { parseLocalDate, addLocalDays } from '../../core/date-utils.js';

export interface SubjectMeta {
  id: string;
  name: string;
  color?: unknown;
}

export interface SubjectDistributionRowVisual {
  subjectId: string;
  name: string;
  colorSlot: number;
  plannedMinutes: number;
  studiedMinutes: number;
  plannedShare: number; // % do total planejado da semana
  studiedShare: number; // % do total estudado da semana
  diffMinutes: number; // studied - planned
  status: 'surplus' | 'on_track' | 'deficit' | 'unplanned';
}

export interface SubjectStudyDistributionVisualModel {
  rows: SubjectDistributionRowVisual[];
  totalPlannedMinutes: number;
  totalStudiedMinutes: number;
  maxMinutes: number;
}

/**
 * Constrói o modelo de dados para o gráfico de barras agrupadas Planejado × Estudado por matéria.
 * Função pura e determinística.
 */
export function buildSubjectStudyDistributionVisual({
  distributionRows = [],
  subjects = [],
}: {
  distributionRows: Array<{
    subjectId: string;
    name: string;
    plannedMinutes?: number | null;
    studiedMinutes?: number | null;
    plannedShare?: number | null;
    studiedShare?: number | null;
  }>;
  subjects: SubjectMeta[];
}): SubjectStudyDistributionVisualModel {
  const subjectMap = new Map<string, { colorSlot: number }>();
  for (const s of subjects) {
    subjectMap.set(s.id, {
      colorSlot: subjectColorOf(s, subjects),
    });
  }

  let totalPlanned = 0;
  let totalStudied = 0;
  let maxMinutes = 0;

  const rows: SubjectDistributionRowVisual[] = distributionRows.map(row => {
    const planned = Math.max(0, Number(row.plannedMinutes) || 0);
    const studied = Math.max(0, Number(row.studiedMinutes) || 0);
    totalPlanned += planned;
    totalStudied += studied;
    if (planned > maxMinutes) maxMinutes = planned;
    if (studied > maxMinutes) maxMinutes = studied;

    const diff = studied - planned;
    let status: 'surplus' | 'on_track' | 'deficit' | 'unplanned' = 'on_track';
    if (planned === 0 && studied > 0) status = 'unplanned';
    else if (diff > 15) status = 'surplus';
    else if (diff < -15) status = 'deficit';

    const colorSlot = subjectMap.get(row.subjectId)?.colorSlot || 1;

    return {
      subjectId: row.subjectId,
      name: row.name,
      colorSlot,
      plannedMinutes: planned,
      studiedMinutes: studied,
      plannedShare: Math.round(Number(row.plannedShare) || 0),
      studiedShare: Math.round(Number(row.studiedShare) || 0),
      diffMinutes: diff,
      status,
    };
  });

  return {
    rows,
    totalPlannedMinutes: totalPlanned,
    totalStudiedMinutes: totalStudied,
    maxMinutes: Math.max(60, maxMinutes),
  };
}

export interface PlanImpactAlignmentRowVisual {
  subjectId: string;
  name: string;
  colorSlot: number;
  plannedShare: number; // %
  impactShare: number; // %
  impactCount: number;
  topicCount: number;
  gapShare: number; // plannedShare - impactShare
  alignmentStatus: 'balanced' | 'underallocated' | 'overallocated';
}

export interface PlanImpactAlignmentVisualModel {
  rows: PlanImpactAlignmentRowVisual[];
  underallocatedCount: number;
  overallocatedCount: number;
  balancedCount: number;
}

/**
 * Constrói o modelo de dados para o gráfico de barras duplas de esforço vs. relevância no edital.
 * Função pura e determinística.
 */
export function buildPlanImpactAlignmentVisual({
  alignmentRows = [],
  subjects = [],
}: {
  alignmentRows: Array<{
    subjectId: string;
    name: string;
    plannedShare: number;
    impactShare: number;
    impactCount: number;
    topicCount: number;
  }>;
  subjects: SubjectMeta[];
}): PlanImpactAlignmentVisualModel {
  const subjectMap = new Map<string, { colorSlot: number }>();
  for (const s of subjects) {
    subjectMap.set(s.id, {
      colorSlot: subjectColorOf(s, subjects),
    });
  }

  let underallocatedCount = 0;
  let overallocatedCount = 0;
  let balancedCount = 0;

  const rows: PlanImpactAlignmentRowVisual[] = alignmentRows.map(row => {
    const plannedShare = Math.round(Number(row.plannedShare) || 0);
    const impactShare = Math.round(Number(row.impactShare) || 0);
    const gap = plannedShare - impactShare;

    let alignmentStatus: 'balanced' | 'underallocated' | 'overallocated' = 'balanced';
    if (gap < -8) {
      alignmentStatus = 'underallocated';
      underallocatedCount++;
    } else if (gap > 8) {
      alignmentStatus = 'overallocated';
      overallocatedCount++;
    } else {
      balancedCount++;
    }

    const colorSlot = subjectMap.get(row.subjectId)?.colorSlot || 1;

    return {
      subjectId: row.subjectId,
      name: row.name,
      colorSlot,
      plannedShare,
      impactShare,
      impactCount: Number(row.impactCount) || 0,
      topicCount: Number(row.topicCount) || 0,
      gapShare: gap,
      alignmentStatus,
    };
  });

  return {
    rows,
    underallocatedCount,
    overallocatedCount,
    balancedCount,
  };
}

export interface WeeklyAllocationSubjectSlice {
  subjectId: string;
  subjectName: string;
  colorSlot: number;
  minutes: number;
  percentage: number; // % da capacidade total do plano
}

export interface WeeklyAllocationMix {
  theoryMinutes: number;
  questionsMinutes: number;
  reviewsMinutes: number;
  totalMinutes: number;
  theoryPercentage: number;
  questionsPercentage: number;
  reviewsPercentage: number;
}

export interface WeeklyAllocationBarVisualModel {
  subjects: WeeklyAllocationSubjectSlice[];
  mix: WeeklyAllocationMix;
  totalWeeklyMinutes: number;
  flexMinutes: number;
}

/**
 * Constrói o modelo de dados para a barra de alocação de capacidade semanal e o mini-donut de mix de estudo.
 */
export function buildWeeklyAllocationBarVisual({
  planItems = [],
  subjects = [],
  weeklyCapacityMinutes = 0,
}: {
  planItems: Array<{
    subjectId: string;
    subjectName?: string;
    minutes?: number | null;
    activityMix?: { theory?: number; questions?: number; reviews?: number };
  }>;
  subjects: SubjectMeta[];
  weeklyCapacityMinutes?: number;
}): WeeklyAllocationBarVisualModel {
  const subjectMap = new Map<string, { name: string; colorSlot: number }>();
  for (const s of subjects) {
    subjectMap.set(s.id, {
      name: s.name,
      colorSlot: subjectColorOf(s, subjects),
    });
  }

  const perSubjectMinutes = new Map<string, number>();
  let totalPlanMins = 0;
  let totalTheory = 0;
  let totalQuestions = 0;
  let totalReviews = 0;

  for (const item of planItems) {
    const mins = Math.max(0, Number(item.minutes) || 0);
    if (mins <= 0) continue;
    const subId = item.subjectId || '__sem_disciplina';
    perSubjectMinutes.set(subId, (perSubjectMinutes.get(subId) || 0) + mins);
    totalPlanMins += mins;

    const mix = item.activityMix || {};
    totalTheory += Math.max(0, Number(mix.theory) || 0);
    totalQuestions += Math.max(0, Number(mix.questions) || 0);
    totalReviews += Math.max(0, Number(mix.reviews) || 0);
  }

  const effectiveTotal = Math.max(totalPlanMins, weeklyCapacityMinutes, 1);

  const subjectSlices: WeeklyAllocationSubjectSlice[] = [];
  for (const [subId, mins] of perSubjectMinutes.entries()) {
    const meta = subjectMap.get(subId) || {
      name: subId === '__sem_disciplina' ? 'Sem disciplina' : 'Outra',
      colorSlot: 1,
    };
    subjectSlices.push({
      subjectId: subId,
      subjectName: meta.name,
      colorSlot: meta.colorSlot,
      minutes: mins,
      percentage: +((mins / effectiveTotal) * 100).toFixed(1),
    });
  }

  subjectSlices.sort((a, b) => b.minutes - a.minutes);

  const mixTotal = totalTheory + totalQuestions + totalReviews || totalPlanMins || 1;
  const mix: WeeklyAllocationMix = {
    theoryMinutes: totalTheory,
    questionsMinutes: totalQuestions,
    reviewsMinutes: totalReviews,
    totalMinutes: totalPlanMins,
    theoryPercentage: Math.round((totalTheory / mixTotal) * 100),
    questionsPercentage: Math.round((totalQuestions / mixTotal) * 100),
    reviewsPercentage: Math.round((totalReviews / mixTotal) * 100),
  };

  const flexMinutes = Math.max(0, weeklyCapacityMinutes - totalPlanMins);

  return {
    subjects: subjectSlices,
    mix,
    totalWeeklyMinutes: totalPlanMins,
    flexMinutes,
  };
}

export type PreparationPhase =
  | 'undated'
  | 'construction'
  | 'consolidation'
  | 'final_stretch'
  | 'final_review';

export interface PhaseRoadmapVisualModel {
  phase: PreparationPhase;
  phaseLabel: string;
  daysRemaining: number | null;
  examDate: string | null;
  startDate: string;
  today: string;
  progressPercentage: number; // 0..100
  phasesList: Array<{
    key: PreparationPhase;
    label: string;
    description: string;
    minDays: number;
    maxDays: number;
    isActive: boolean;
    isPassed: boolean;
  }>;
}

/**
 * Constrói o modelo de dados para a Régua da Jornada e Fases até a Prova.
 */
export function buildPhaseRoadmapVisual({
  examDate = null,
  today,
  planStartDate = null,
}: {
  examDate?: string | null;
  today: string;
  planStartDate?: string | null;
}): PhaseRoadmapVisualModel {
  if (!examDate || !parseLocalDate(examDate)) {
    return {
      phase: 'undated',
      phaseLabel: 'Sem data de prova definida',
      daysRemaining: null,
      examDate: null,
      startDate: planStartDate || today,
      today,
      progressPercentage: 0,
      phasesList: [],
    };
  }

  const todayObj = parseLocalDate(today);
  const examObj = parseLocalDate(examDate);
  const diffTime = (examObj?.getTime() || 0) - (todayObj?.getTime() || 0);
  const daysRemaining = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  let phase: PreparationPhase = 'construction';
  let phaseLabel = 'Construção de Base';
  if (daysRemaining <= 7) {
    phase = 'final_review';
    phaseLabel = 'Semana de Revisão Final';
  } else if (daysRemaining <= 30) {
    phase = 'final_stretch';
    phaseLabel = 'Modo Reta Final (85/15)';
  } else if (daysRemaining <= 90) {
    phase = 'consolidation';
    phaseLabel = 'Consolidação e Fixação';
  }

  const start = planStartDate && planStartDate < today ? planStartDate : addLocalDays(today, -30) || today;
  const startObj = parseLocalDate(start);
  const totalDurationDays = Math.max(1, Math.round(((examObj?.getTime() || 0) - (startObj?.getTime() || 0)) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.round(((todayObj?.getTime() || 0) - (startObj?.getTime() || 0)) / (1000 * 60 * 60 * 24)));
  const progressPercentage = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDurationDays) * 100)));

  const phasesList = [
    {
      key: 'construction' as const,
      label: 'Construção',
      description: 'Teoria e fundação de base (>90 dias)',
      minDays: 91,
      maxDays: 365,
      isActive: phase === 'construction',
      isPassed: daysRemaining <= 90,
    },
    {
      key: 'consolidation' as const,
      label: 'Consolidação',
      description: 'Teoria, questões e revisões em equilíbrio (31–90 dias)',
      minDays: 31,
      maxDays: 90,
      isActive: phase === 'consolidation',
      isPassed: daysRemaining <= 30,
    },
    {
      key: 'final_stretch' as const,
      label: 'Reta Final',
      description: '85% em questões/revisão e 15% teoria (8–30 dias)',
      minDays: 8,
      maxDays: 30,
      isActive: phase === 'final_stretch',
      isPassed: daysRemaining <= 7,
    },
    {
      key: 'final_review' as const,
      label: 'Revisão Final',
      description: 'Manutenção rápida e descanso ativo (0–7 dias)',
      minDays: 0,
      maxDays: 7,
      isActive: phase === 'final_review',
      isPassed: daysRemaining === 0,
    },
  ];

  return {
    phase,
    phaseLabel,
    daysRemaining,
    examDate,
    startDate: start,
    today,
    progressPercentage,
    phasesList,
  };
}
