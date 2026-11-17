/**
 * Ritual de Fechamento Semanal Inteligente (SEM-01 a SEM-09).
 *
 * Orquestra a janela civil local (segunda 00:00 a domingo 23:59:59.999) sobre os
 * serviços existentes (`buildWeeklyClose`, `buildWeeklyPerformanceBrief`,
 * `createWeeklyCloseSnapshot`, `upsertWeeklyCloseSnapshot`), separando prévia
 * de semana parcial vs. fechamento definitivo de semana civil encerrada.
 */

import { addLocalDays, formatLocalDate, parseLocalDate } from '../../core/date-utils.js';
import { formatPeriodBR } from '../../core/format-date.js';
import { formatPlanMinutes } from '../../core/format-duration.js';
import { buildWeeklyClose } from '../../domain/analytics/weekly-close.js';
import {
  computeStudyCycleLapSummary,
  type StudyCycleQueue,
} from '../../domain/planning/study-cycle-engine.js';
import type { LearningJournalEntry } from '../../core/types.js';
import { selectWeeklyPlans } from '../analytics/build-studytrack32-view-model.js';
import { strategicScopeKey } from '../analytics/build-strategic-timeline.js';
import {
  createWeeklyCloseSnapshot,
  planWeeklyCloseRevision,
  upsertWeeklyCloseSnapshot,
} from '../analytics/weekly-close-snapshot.js';
import { buildWeeklyPerformanceBrief } from '../performance/build-weekly-performance-brief.js';

export type WeeklyClosingWindowStatus =
  | 'partial_preview'
  | 'closed_ready'
  | 'already_finalized'
  | 'insufficient_data';

export interface CivilWeekWindow {
  weekStartLocal: string;
  weekEndLocal: string;
  previousStartLocal: string;
  previousEndLocal: string;
  periodLabel: string;
  previousPeriodLabel: string;
  isPartialCurrentWeek: boolean;
  windowLabel: 'Prévia da semana em andamento' | 'Semana civil concluída';
}

export interface BuildWeeklyClosingRitualOptions {
  today: string;
  referenceDate?: string | null;
  timezone?: string;
  sessions?: Array<Record<string, any>>;
  questions?: Array<Record<string, any>>;
  dailyPlans?: Array<Record<string, any>>;
  reviews?: Array<Record<string, any>>;
  simulations?: Array<Record<string, any>>;
  subjects?: Array<Record<string, any>>;
  weeklyCloseSnapshots?: Array<Record<string, any>>;
  learningJournal?: readonly LearningJournalEntry[];
  recommendations?: Array<Record<string, any>>;
  activeExamTags?: string[];
  targetAccuracy?: number;
  studyCycle?: StudyCycleQueue | null;
  subjectIdFor?: (item: any) => string | null;
}

const inRange = (date: unknown, start: string, end: string): boolean => {
  if (typeof date !== 'string' || !date) return false;
  const iso = date.slice(0, 10);
  return iso >= start && iso <= end;
};

const sumBy = (items: Array<Record<string, any>>, pick: (row: Record<string, any>) => unknown) =>
  items.reduce((acc, row) => acc + (Number(pick(row)) || 0), 0);

/**
 * Resolve a janela civil local segunda-feira (00:00) -> domingo (23:59:59.999) (SEM-08, SEM-09).
 */
export function resolveCivilWeekWindow(
  todayLocalISO: string,
  referenceDateISO?: string | null
): CivilWeekWindow {
  const anchorISO =
    referenceDateISO && /^\d{4}-\d{2}-\d{2}$/.test(referenceDateISO)
      ? referenceDateISO
      : todayLocalISO;
  const parsedAnchor = parseLocalDate(anchorISO) || parseLocalDate(todayLocalISO);
  const safeAnchor = (parsedAnchor && formatLocalDate(parsedAnchor)) || todayLocalISO;
  const weekday = parsedAnchor ? parsedAnchor.getDay() : 1; // 0 dom .. 6 sab
  const offsetToMonday = -((weekday + 6) % 7);

  const weekStartLocal = addLocalDays(safeAnchor, offsetToMonday) || safeAnchor;
  const weekEndLocal = addLocalDays(weekStartLocal, 6) || safeAnchor;
  const previousStartLocal = addLocalDays(weekStartLocal, -7) || weekStartLocal;
  const previousEndLocal = addLocalDays(weekStartLocal, -1) || weekStartLocal;

  // Semana corrente ainda não chegou ao fim do domingo civil local -> é sempre prévia.
  const isPartialCurrentWeek = weekEndLocal >= todayLocalISO;

  return {
    weekStartLocal,
    weekEndLocal,
    previousStartLocal,
    previousEndLocal,
    periodLabel: formatPeriodBR(weekStartLocal, weekEndLocal),
    previousPeriodLabel: formatPeriodBR(previousStartLocal, previousEndLocal),
    isPartialCurrentWeek,
    windowLabel: isPartialCurrentWeek
      ? 'Prévia da semana em andamento'
      : 'Semana civil concluída',
  };
}

function summarizeJournalReflections(
  entries: readonly LearningJournalEntry[] = [],
  start: string,
  end: string
) {
  const inWindow = entries.filter(entry => inRange(entry.localDate, start, end));
  const tagCounts = new Map<string, number>();
  for (const entry of inWindow) {
    for (const tag of entry.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([tag, count]) => ({ tag, count }));

  return {
    entriesCount: inWindow.length,
    topTags,
    notesPreview: inWindow
      .filter(e => e.note)
      .slice(0, 2)
      .map(e => ({
        id: e.id,
        localDate: e.localDate,
        subjectName: e.subjectNameSnapshot || 'Disciplina',
        note: e.note,
      })),
    // SEM-07: Diário fornece contexto qualitativo; nunca infere melhora estatística.
    caveat: inWindow.length
      ? 'Anotações qualitativas registradas por você no período; não medem evolução estatística isoladamente.'
      : null,
  };
}

export function buildWeeklyClosingRitualViewModel(
  options: BuildWeeklyClosingRitualOptions
) {
  const {
    today,
    referenceDate = null,
    timezone = 'America/Sao_Paulo',
    sessions = [],
    questions = [],
    dailyPlans = [],
    reviews = [],
    simulations = [],
    subjects = [],
    weeklyCloseSnapshots = [],
    learningJournal = [],
    recommendations = [],
    activeExamTags = [],
    targetAccuracy = 80,
    studyCycle = null,
    subjectIdFor,
  } = options;

  const window = resolveCivilWeekWindow(today, referenceDate);
  const { weekStartLocal, weekEndLocal, previousStartLocal, previousEndLocal } = window;

  // SEM-06: Todas as horas derivam exclusivamente da coleção canônica `sessions`
  const weekSessions = sessions.filter(s => inRange(s?.date, weekStartLocal, weekEndLocal));
  const prevSessions = sessions.filter(s => inRange(s?.date, previousStartLocal, previousEndLocal));
  const weekQuestions = questions.filter(q => inRange(q?.date, weekStartLocal, weekEndLocal));
  const prevQuestions = questions.filter(q => inRange(q?.date, previousStartLocal, previousEndLocal));
  const weekReviewsDone = reviews.filter(
    r =>
      r?.status === 'Concluído' &&
      inRange(r.completedAt || r.date, weekStartLocal, weekEndLocal)
  );
  const weekPlans = selectWeeklyPlans(dailyPlans, weekStartLocal, weekEndLocal);
  const prevPlans = selectWeeklyPlans(dailyPlans, previousStartLocal, previousEndLocal);

  const studiedMinutes = Math.round(sumBy(weekSessions, s => s.durationSeconds) / 60);
  const prevStudiedMinutes = Math.round(sumBy(prevSessions, s => s.durationSeconds) / 60);

  const resolved = sumBy(weekQuestions, q => q.resolved);
  const correct = sumBy(weekQuestions, q => q.correct);
  const accuracy = resolved > 0 ? Math.round((correct / resolved) * 100) : null;

  const prevResolved = sumBy(prevQuestions, q => q.resolved);
  const prevCorrect = sumBy(prevQuestions, q => q.correct);
  const prevHasEvidence =
    prevStudiedMinutes > 0 || prevResolved > 0 || prevPlans.plannedMinutes > 0;

  // SEM-08: só comparar janelas quando ambas são semanas civis completas do mesmo concurso
  const comparableWithPrevious = !window.isPartialCurrentWeek && prevHasEvidence;
  const comparisonWarning = window.isPartialCurrentWeek
    ? 'A semana atual ainda está em andamento; ela não é comparada como equivalente a uma semana inteira encerrada.'
    : !prevHasEvidence
      ? 'Não há registros comparáveis na semana civil anterior para este mesmo concurso.'
      : null;

  const weeklyClose = buildWeeklyClose({
    period: { start: weekStartLocal, end: weekEndLocal },
    current: {
      plannedMinutes: weekPlans.plannedMinutes,
      executedMinutes: studiedMinutes,
    },
    previous: comparableWithPrevious
      ? {
          plannedMinutes: prevPlans.plannedMinutes,
          executedMinutes: prevStudiedMinutes,
          resolved: prevResolved,
          accuracy: prevResolved > 0 ? Math.round((prevCorrect / prevResolved) * 100) : null,
        }
      : {},
    plans: weekPlans.plans,
    questions: weekQuestions,
    recommendations,
    targetAccuracy,
  });

  const activeDays = new Set(
    weekSessions
      .filter(s => (Number(s?.durationSeconds) || 0) > 0 && typeof s?.date === 'string')
      .map(s => s.date.slice(0, 10))
  ).size;

  const focusSubjectsMap = new Map<string, number>();
  for (const s of weekSessions) {
    const subId = (subjectIdFor ? subjectIdFor(s) : null) || s.subjectId || null;
    if (!subId) continue;
    focusSubjectsMap.set(
      subId,
      (focusSubjectsMap.get(subId) || 0) + (Number(s.durationSeconds) || 0)
    );
  }
  const subjectNameMap = new Map(subjects.map(s => [String(s.id), String(s.name || 'Disciplina')]));
  const topFocusSubjects = [...focusSubjectsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, seconds]) => ({
      subjectId: id,
      subjectName: subjectNameMap.get(id) || 'Disciplina',
      minutes: Math.round(seconds / 60),
    }));

  const scopeKey = strategicScopeKey(activeExamTags);
  const existingSnapshot =
    weeklyCloseSnapshots
      .filter(
        snap =>
          snap?.period?.start === weekStartLocal &&
          snap?.period?.end === weekEndLocal &&
          strategicScopeKey(snap?.activeExamTags) === scopeKey
      )
      .at(-1) || null;

  const hasEnoughData =
    weeklyClose.state !== 'insufficient' && (studiedMinutes > 0 || resolved > 0 || weekPlans.plannedMinutes > 0);
  const windowStatus: WeeklyClosingWindowStatus = !hasEnoughData
    ? 'insufficient_data'
    : existingSnapshot
      ? 'already_finalized'
      : window.isPartialCurrentWeek
        ? 'partial_preview'
        : 'closed_ready';

  const confidenceLevel =
    studiedMinutes >= 180 && resolved >= 30
      ? 'high'
      : studiedMinutes >= 60 || resolved >= 10
        ? 'moderate'
        : 'low';
  const confidenceLabel =
    confidenceLevel === 'high'
      ? 'evidência alta'
      : confidenceLevel === 'moderate'
        ? 'evidência moderada'
        : 'dados insuficientes';

  // SEM-02 e SEM-03: 3 blocos estruturados (máximo 2 observações + 1 recomendação principal)
  const whatWorked: string[] = [];
  const needsAttention: string[] = [];

  if (!hasEnoughData) {
    whatWorked.push(
      'Ainda faltam registros suficientes nesta janela semanal para identificar destaques positivos.'
    );
    needsAttention.push(
      'Quando houver sessões ou questões na semana, o ritual resume o que funcionou sem julgar dias sem estudo.'
    );
  } else {
    if (studiedMinutes > 0) {
      whatWorked.push(
        `Tempo total registrado na coleção de sessões: ${formatPlanMinutes(studiedMinutes)} em ${weekSessions.length} ${weekSessions.length === 1 ? 'sessão' : 'sessões'} (${activeDays} ${activeDays === 1 ? 'dia ativo' : 'dias ativos'}).`
      );
    }
    if (resolved > 0 && accuracy != null && whatWorked.length < 2) {
      whatWorked.push(
        `${resolved} ${resolved === 1 ? 'questão resolvida' : 'questões resolvidas'} na janela, com ${accuracy}% de acerto${resolved < 30 ? ' (amostra pequena — interprete com cautela)' : ''}.`
      );
    } else if (weekReviewsDone.length > 0 && whatWorked.length < 2) {
      whatWorked.push(
        `${weekReviewsDone.length} ${weekReviewsDone.length === 1 ? 'revisão concluída' : 'revisões concluídas'} na janela.`
      );
    }

    if (weeklyClose.mainRisk?.message) {
      needsAttention.push(weeklyClose.mainRisk.message);
    }
    if (window.isPartialCurrentWeek && needsAttention.length < 2) {
      needsAttention.push(
        'Janela em andamento: números refletem apenas os dias decorridos até hoje e servem como prévia.'
      );
    } else if (resolved > 0 && resolved < 30 && needsAttention.length < 2) {
      needsAttention.push(
        'Amostra de questões ainda curta na semana; acompanhe junto ao resumo dos últimos 7 dias antes de concluir tendência.'
      );
    }
  }

  const topPriority = (weeklyClose.priorities || [])[0] || null;
  const improvementToTest = hasEnoughData
    ? {
        id: topPriority?.priorityId || `weekly-improvement-${weekStartLocal}`,
        priorityId: topPriority?.priorityId || null,
        title: topPriority
          ? `Testar foco em ${topPriority.topicId || topPriority.subjectId || 'prioridade principal'}`
          : weeklyClose.recommendedAction,
        detail: topPriority
          ? `${topPriority.action} (${formatPlanMinutes(topPriority.estimatedMinutes || 30)}) — ${topPriority.reason}`
          : weeklyClose.recommendedAction,
        subjectId: topPriority?.subjectId || null,
        topicId: topPriority?.topicId || null,
        estimatedMinutes: topPriority?.estimatedMinutes || 30,
        requiresPlanConfirmation: true as const,
      }
    : null;

  // Janela móvel de 7 dias permanece separada e explicitamente rotulada (SEM-01 / Janela temporal)
  const rollingBrief = buildWeeklyPerformanceBrief({
    today,
    questions,
    sessions,
    dailyPlans,
    reviews,
    simulations,
    subjects,
    subjectIdFor,
  });

  const journalReflections = summarizeJournalReflections(
    learningJournal,
    weekStartLocal,
    weekEndLocal
  );
  const cycleSummary = studyCycle ? computeStudyCycleLapSummary(studyCycle) : null;

  return {
    id: existingSnapshot?.id || `weekly-closing-${weekStartLocal}`,
    examId: activeExamTags[0] || null,
    timezone,
    period: { start: weekStartLocal, end: weekEndLocal },
    activeExamTags: Array.isArray(activeExamTags) ? [...activeExamTags] : [],
    window,
    windowStatus,
    isPartialCurrentWeek: window.isPartialCurrentWeek,
    comparableWithPrevious,
    comparisonWarning,
    confidence: {
      level: confidenceLevel,
      label: confidenceLabel,
    },
    metrics: {
      studiedMinutes,
      plannedMinutes: weekPlans.plannedMinutes,
      sessionsCount: weekSessions.length,
      activeDays,
      resolved,
      correct,
      accuracy,
      reviewsCompleted: weekReviewsDone.length,
      topFocusSubjects,
    },
    whatWorked: whatWorked.slice(0, 2),
    needsAttention: needsAttention.slice(0, 2),
    improvementToTest,
    journalReflections,
    cycleSummary,
    rollingBrief,
    // Campos compatíveis com `createWeeklyCloseSnapshot` e `upsertWeeklyCloseSnapshot`
    weeklyClose,
    gapMap: [],
    decisionHistory: [],
    comparisonMetrics: null,
    topicPriorities: (weeklyClose.priorities || []).map((p: any) => ({
      priorityId: p.priorityId,
      topicId: p.topicId,
      subjectId: p.subjectId,
    })),
    existingSnapshot,
  };
}

/**
 * Registra o snapshot do fechamento semanal de modo idempotente (SEM-05).
 */
export function finalizeWeeklyClosingIdempotent(
  snapshots: Array<Record<string, any>>,
  ritualModel: ReturnType<typeof buildWeeklyClosingRitualViewModel>,
  {
    nowISO,
    idGenerator = (prefix = 'weekly-close') => `${prefix}_${Date.now()}`,
  }: {
    nowISO: () => string;
    idGenerator?: (prefix?: string) => string;
  }
) {
  if (!ritualModel || ritualModel.weeklyClose?.state === 'insufficient') {
    return {
      created: false,
      unchanged: false,
      snapshot: null,
      status: 'insufficient_data' as const,
    };
  }

  const candidate = createWeeklyCloseSnapshot(ritualModel, {
    savedAt: nowISO(),
    id: idGenerator('weekly-close'),
  });
  if (!candidate) {
    return {
      created: false,
      unchanged: false,
      snapshot: null,
      status: 'insufficient_data' as const,
    };
  }

  const plan = planWeeklyCloseRevision(snapshots, candidate);
  if (plan.unchanged && plan.previous) {
    return {
      created: false,
      unchanged: true,
      snapshot: plan.previous,
      status: 'already_finalized' as const,
    };
  }

  const saved = upsertWeeklyCloseSnapshot(snapshots, candidate);
  const latest = snapshots.at(-1) || candidate;
  return {
    created: saved,
    unchanged: !saved,
    snapshot: latest,
    status: 'finalized' as const,
  };
}
