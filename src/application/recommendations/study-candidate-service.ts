import { parseLocalDate } from '../../core/date-utils.js';
import { formatDelta } from '../../core/format-number.js';
import type { AppState } from '../../core/types.js';
import { calculateWeightedTrend } from '../../domain/analytics/topic-performance.js';
import { buildIntelligentAlerts } from '../../domain/diagnostics/alerts.js';
import {
  calculateCoverageRhythm,
  calculateOverdueReviewsCount,
} from '../../domain/planning/rhythm-estimator.js';
import { buildStudyCandidates } from '../build-study-candidates.js';
import { buildStudyPlan } from '../build-study-plan.js';
import { recommendStudy } from '../recommend-study.js';
import { firstActivityDate } from '../selectors/first-activity-date.js';

export interface StudyCandidateServiceDependencies {
  getState: () => AppState;
  todayISO: () => string;
  addDays: (iso: string | null | undefined, days: number) => string;
  startOfWeek: (iso: any) => string;
  diasParaRevisao: (targetIso: string | null | undefined) => number | null;
  getTopicById: (topicId: string | null | undefined) => { subject: any; topic: any } | null;
  getTopicName: (topicId: string) => string;
  entitySubjectId: (item: Record<string, any>) => string | null;
  entitySubjectName: (item: Record<string, any>) => string;
  allTopics: () => any[];
  activeTopics: () => any[];
  activeSubjects: () => any[];
  isActiveStudyReference: (
    subjectId: string | null | undefined,
    topicId?: string | null
  ) => boolean;
  topicInActiveExamScope: (topic: Record<string, any>) => boolean;
  examScopedTopics: () => any[];
  examScopedRecords: (records?: any[]) => any[];
  examEvidenceContext: () => any;
  diagnoseTopic: (subjectId: string, topicId: string) => any;
  getTopicDifficulty: (topicId?: string | null) => string;
  taxaErroDisciplina: (subjectId: string) => number | null;
  diasSemEstudarDisciplina: (subjectId: string) => number;
  subjectAccuracyTarget: (subjectId: string) => number;
  topicRetentionScore: (subjectId: string, topicId: string) => any;
  topicMasteryIndex: (subjectId: string, topicId: string) => any;
  topicReviewHealthScore: (
    topic: Record<string, any>,
    masteryResult?: any,
    retentionResult?: any,
    diagnosis?: any
  ) => any;
  getSubjectWeeklyTrend: (subjectId: string, weeks?: number, records?: any[]) => any[];
  metaHoursToday: () => number;
  uniqueTopicsCompletedBetween: (startDate: string, endDate: string) => number;
  getRevisoesUnificadas: () => any[];
  getStudyPlanCandidates?: () => any[];
  isRendering: () => boolean;
}

// Percentage the weekly goal is behind the expected pace, or null when there is no fair base.
// Only a week the student lived entirely in the app is charged: someone who started on Thursday
// was never behind on Monday's share.
export function weeklyGoalGapFor({
  expectedFrac,
  actualFrac,
  historyStart,
  weekStart,
}: {
  expectedFrac: number;
  actualFrac: number;
  historyStart: string | null;
  weekStart: string;
}): number | null {
  if (!historyStart || historyStart > weekStart) return null;
  return expectedFrac >= 0.5 && actualFrac < expectedFrac - 0.15
    ? Math.round((expectedFrac - actualFrac) * 100)
    : null;
}

export function createStudyCandidateService(deps: StudyCandidateServiceDependencies) {
  const {
    getState,
    todayISO,
    addDays,
    startOfWeek,
    diasParaRevisao,
    getTopicById,
    getTopicName,
    entitySubjectId,
    entitySubjectName,
    allTopics,
    activeTopics,
    activeSubjects,
    isActiveStudyReference,
    topicInActiveExamScope,
    examScopedTopics,
    examScopedRecords,
    examEvidenceContext,
    diagnoseTopic,
    getTopicDifficulty,
    taxaErroDisciplina,
    diasSemEstudarDisciplina,
    subjectAccuracyTarget,
    topicRetentionScore,
    topicMasteryIndex,
    topicReviewHealthScore,
    getSubjectWeeklyTrend,
    metaHoursToday,
    uniqueTopicsCompletedBetween,
    getRevisoesUnificadas,
    getStudyPlanCandidates,
    isRendering,
  } = deps;

  let renderCandidates: any = null;

  function clearRenderCandidatesCache() {
    renderCandidates = null;
  }

  function proximidadeProvaScore() {
    const state = getState();
    if (!state.examDate) return 0;
    const dias = diasParaRevisao(state.examDate);
    if (dias === null) return 0;
    return Math.max(0, Math.min(100, 100 - dias));
  }

  function collectStudyCandidates() {
    const state = getState();
    const today = todayISO();

    const candidateMap = new Map();
    const addCandidate = (key: string, candidate: Record<string, any>) => {
      const current = candidateMap.get(key);
      if (
        !current ||
        candidate.diasAtrasado > current.diasAtrasado ||
        (candidate.tipo === 'revisão' && current.tipo !== 'revisão')
      )
        candidateMap.set(key, candidate);
    };

    state.reviewAgenda
      .filter(review => {
        const subjectId = entitySubjectId(review);
        const topicId = review.topicId || review.topicRef || null;
        return (
          review.status !== 'Concluído' &&
          review.date &&
          review.date <= today &&
          isActiveStudyReference(subjectId, topicId!) &&
          (!topicId || topicInActiveExamScope(getTopicById(topicId)?.topic!))
        );
      })
      .forEach(review => {
        const subjectId = entitySubjectId(review);
        const topicId = review.topicId || review.topicRef || null;
        const diagnosis = topicId ? diagnoseTopic(subjectId!, topicId) : null;
        addCandidate(topicId || 'review:' + review.id, {
          id: 'review-' + review.id,
          subjectId,
          topicId,
          subjectName: entitySubjectName(review),
          topicName: topicId ? getTopicName(topicId) : review.topic || review.tipo || 'Revisão',
          tipo: 'revisão',
          dificuldade: getTopicDifficulty(topicId!),
          diasAtrasado: Math.max(0, -(diasParaRevisao(review.date) ?? 0)),
          erroQuestoes: diagnosis?.effectiveErrorRate ?? taxaErroDisciplina(subjectId!),
          diasSemEstudar: diagnosis?.daysSinceStudy ?? diasSemEstudarDisciplina(subjectId!),
          diagnosis,
        });
      });

    activeTopics()
      .filter(topic => topicInActiveExamScope(topic))
      .filter(topic => (topic.name || '').trim() !== '')
      .forEach(topic => {
        if (candidateMap.has(topic.id)) return;
        const diagnosis = diagnoseTopic(topic.subjectId, topic.id);
        addCandidate(topic.id, {
          subjectId: topic.subjectId,
          topicId: topic.id,
          subjectName: topic.subjectName,
          topicName: topic.name,
          tipo:
            topic.status === 'Concluído'
              ? 'manutenção'
              : topic.status === 'Em andamento'
                ? 'continuar'
                : 'novo tópico',
          dificuldade: topic.difficulty || 'Médio',
          diasAtrasado: 0,
          erroQuestoes: diagnosis?.effectiveErrorRate ?? taxaErroDisciplina(topic.subjectId),
          diasSemEstudar: diagnosis?.daysSinceStudy ?? diasSemEstudarDisciplina(topic.subjectId),
          diagnosis,
        });
      });

    const candidates = [...candidateMap.values()];
    candidates.forEach(candidate => {
      candidate.recommendedAction =
        candidate.diagnosis?.recommendation?.action ||
        (candidate.tipo === 'revisão' ? 'Concluir a revisão programada' : 'Estudar o tópico');
      candidate.studyType =
        candidate.diagnosis?.recommendation?.studyType ||
        (candidate.tipo === 'revisão' ? 'review' : 'study');
      candidate.estimatedMinutes =
        candidate.diagnosis?.recommendation?.estimatedMinutes ||
        (candidate.tipo === 'revisão' ? 25 : 35);
      candidate.recommendedQuestions = candidate.diagnosis?.recommendation?.questions || 0;
    });
    return candidates;
  }

  function computeIntelligenceCandidates() {
    const state = getState();
    const priorities = collectStudyCandidates();
    const topics = allTopics();
    const retentions = Object.fromEntries(
      topics.map(topic => [topic.id, topicRetentionScore(topic.subjectId, topic.id)])
    );
    const reviewHealths = Object.fromEntries(
      topics.map(topic => [
        topic.id,
        topicReviewHealthScore(
          topic,
          topicMasteryIndex(topic.subjectId, topic.id),
          retentions[topic.id]
        ),
      ])
    );
    return buildStudyCandidates({
      priorities,
      topics,
      retentions,
      reviewHealths,
      blueprint: state.examBlueprint.subjects,
      sessions: state.studySessions,
      today: todayISO(),
      examProximity: state.examDate ? proximidadeProvaScore() : null,
      activeExamTags: state.examBlueprint.activeExamTags || [],
      exams: state.exams,
      examQuestions: state.examQuestions,
    }).map(item => ({ ...item, accuracyTarget: subjectAccuracyTarget(item.subjectId) }));
  }

  function intelligenceCandidates() {
    if (renderCandidates) return renderCandidates;
    const candidates = computeIntelligenceCandidates();
    if (isRendering()) renderCandidates = candidates;
    return candidates;
  }

  function studyPlanCandidates({ guidedDefaults = false }: { guidedDefaults?: boolean } = {}) {
    return intelligenceCandidates()
      .filter((item: any) => item.topicId)
      .map((item: any) => {
        let estimatedMinutes = item.remainingMinutes;
        if (guidedDefaults && estimatedMinutes == null) {
          const topic = getTopicById(item.topicId)?.topic;
          estimatedMinutes =
            topic?.difficulty === 'Difícil' ? 120 : topic?.difficulty === 'Fácil' ? 45 : 75;
        }
        return { ...item, completed: false, estimatedMinutes, remainingMinutes: estimatedMinutes };
      });
  }
  const resolveStudyPlanCandidates = getStudyPlanCandidates || (() => studyPlanCandidates());

  function computeStudyPriorities() {
    return recommendStudy(intelligenceCandidates(), {
      availableMinutes: Math.round(metaHoursToday() * 60),
    }).map(item => ({
      ...item,
      tier: item.score >= 70 ? 'Alta' : item.score >= 40 ? 'Média' : 'Baixa',
    }));
  }

  function motivoPrioridade(priority: Record<string, any>) {
    if (priority.reasonSummary) return priority.reasonSummary;
    if (priority.reasons?.length) return priority.reasons.join(' · ');
    if (priority.diasAtrasado > 0) return 'Revisão atrasada (' + priority.diasAtrasado + 'd)';
    const diagnosis = priority.diagnosis;
    if (diagnosis?.trend?.key === 'down')
      return 'Tendência em queda (' + formatDelta(diagnosis.trend.delta) + ' p.p.)';
    if (
      diagnosis?.performance?.resolved >= 10 &&
      diagnosis.performance.accuracy !== null &&
      diagnosis.performance.accuracy < subjectAccuracyTarget(priority.subjectId)
    ) {
      return 'Baixo desempenho no tópico (' + diagnosis.performance.accuracy + '% de acerto)';
    }
    if (diagnosis?.dominantError) return 'Erro predominante: ' + diagnosis.dominantError.meta.label;
    if (priority.dificuldade === 'Difícil') return 'Tópico difícil';
    if (priority.tipo === 'continuar') return 'Em andamento';
    if (priority.diasSemEstudar >= 7) return priority.diasSemEstudar + 'd sem atividade no tópico';
    return priority.tipo === 'revisão' ? 'Revisão de hoje' : 'Tópico novo';
  }

  function computeRitmo() {
    const state = getState();
    const allT = activeTopics();
    const total = allT.length;
    const done = allT.filter(t => t.status === 'Concluído').length;
    const cutoff = addDays(todayISO(), -13);
    const recentDone = uniqueTopicsCompletedBetween(cutoff, todayISO());
    let daysToExam = null;
    if (state.examDate) {
      daysToExam = diasParaRevisao(state.examDate);
    }
    return calculateCoverageRhythm({
      totalTopics: total,
      completedTopics: done,
      recentCompletedTopicsCount: recentDone,
      today: todayISO(),
      examDate: state.examDate,
      daysToExam,
      addDays,
    });
  }

  function revisoesAtrasadas() {
    const state = getState();
    const isCurrent = (item: Record<string, any>) =>
      isActiveStudyReference(entitySubjectId(item), item.topicId || item.topicRef || null);
    return calculateOverdueReviewsCount({
      calendarItems: state.calendar,
      reviewAgendaItems: state.reviewAgenda,
      today: todayISO(),
      isCurrentReference: isCurrent,
    });
  }

  function computeAlertasInteligentes() {
    const state = getState();
    const today = todayISO(),
      scope = examEvidenceContext(),
      scopedQuestions = scope.questions.included;
    const eligibleSubjectIds = new Set(examScopedTopics().map(topic => topic.subjectId));
    const subjects = activeSubjects()
      .filter(subject => eligibleSubjectIds.has(subject.id))
      .map(subject => {
        const trend = calculateWeightedTrend(getSubjectWeeklyTrend(subject.id, 8, scopedQuestions));
        const lastSession = scope.sessions.included
          .filter((session: any) => entitySubjectId(session) === subject.id && session.date)
          .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)))[0];
        const lastStudyDay = parseLocalDate(lastSession?.date);
        const daysSinceStudy = lastStudyDay
          ? Math.max(
              0,
              Math.floor((Number(parseLocalDate(today)) - Number(lastStudyDay)) / 86400000)
            )
          : null;
        return {
          subjectId: subject.id,
          name: subject.name,
          trend: {
            direction: trend.key === 'down' ? 'down' : trend.key === 'up' ? 'up' : 'stable',
            state: trend.state,
            delta: trend.delta,
          },
          daysSinceStudy,
        };
      });
    const topics = intelligenceCandidates().map((item: any) => ({
      topicId: item.topicId,
      subjectId: item.subjectId,
      name: item.topicName,
      mastery: item.mastery,
      examImpact: item.examImpact,
      evidenceStrength: item.evidenceStrength,
      dominantError: item.diagnosis?.dominantError,
    }));
    const days = state.examDate ? diasParaRevisao(state.examDate) : null;
    const weeklyAvailableMinutes = Object.values(state.metas.horasPorDia).reduce<number>(
      (sum, hours) => sum + Math.max(0, Number(hours) || 0) * 60,
      0
    );
    const plan = buildStudyPlan({
      topics: resolveStudyPlanCandidates(),
      weeklyAvailableMinutes,
      weeksUntilExam: days === null ? 0 : Math.max(0, days / 7),
    });
    const dayOfWeek = parseLocalDate(today)!.getDay(),
      elapsed = dayOfWeek === 0 ? 7 : dayOfWeek,
      expectedFrac = elapsed / 7;
    const weekStart = startOfWeek(today),
      achieved = uniqueTopicsCompletedBetween(weekStart, addDays(weekStart, 6));
    const weeklyGoalGap = weeklyGoalGapFor({
      expectedFrac,
      actualFrac: state.metas.semanal > 0 ? achieved / state.metas.semanal : 1,
      historyStart: firstActivityDate(state),
      weekStart,
    });
    const scopedReviews = examScopedRecords(getRevisoesUnificadas()),
      hardTopicsWithoutReview = examScopedTopics().filter(
        topic =>
          topic.difficulty === 'Difícil' &&
          topic.status !== 'Concluído' &&
          !scopedReviews.some(
            review =>
              (review.topicId || review.topicRef) === topic.id && review.status !== 'Concluído'
          )
      ).length;
    return buildIntelligentAlerts({
      today,
      overdueReviews: scopedReviews.filter(
        review => review.date < today && review.status !== 'Concluído'
      ).length,
      subjects,
      topics,
      weeklyBalanceMinutes: plan.weeklyBalanceMinutes,
      hardTopicsWithoutReview,
      weeklyGoalGap,
    });
  }

  return {
    clearRenderCandidatesCache,
    proximidadeProvaScore,
    collectStudyCandidates,
    computeIntelligenceCandidates,
    intelligenceCandidates,
    studyPlanCandidates,
    computeStudyPriorities,
    motivoPrioridade,
    computeRitmo,
    revisoesAtrasadas,
    computeAlertasInteligentes,
  };
}
