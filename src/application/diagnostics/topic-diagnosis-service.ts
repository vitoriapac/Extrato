import { calculateReviewHealth } from '../../domain/analytics/review-health.js';
import { resolveSubjectAccuracyTarget } from '../../domain/analytics/subject-accuracy-target.js';
import {
  calculateDaysSinceSubjectStudy,
  calculateSubjectErrorRate,
  findSubjectLatestActivityDate,
} from '../../domain/analytics/subject-error-metrics.js';
import {
  calculateTopicMastery,
  calculateTopicRetention,
} from '../../domain/analytics/topic-metrics.js';
import {
  calculateDominantTopicError,
  calculateSubjectPerformanceCounts,
  calculateSubjectWeeklyTrend,
  calculateTopicErrorRate,
  calculateTopicPerformance,
  calculateTopicWeeklyTrend,
  calculateWeightedTrend,
  classifyAccuracy as classifyAccuracyTarget,
  performanceConfidence,
} from '../../domain/analytics/topic-performance.js';
import { analyzeErrors } from '../../domain/diagnostics/error-analysis.js';
import {
  DIAGNOSIS_STATUS_ICON,
  ERROR_CATEGORIES,
  ERROR_RECOMMENDATIONS,
  MIN_ERROR_RECOMMENDATION_COUNT,
  MIN_ERROR_RECOMMENDATION_COVERAGE,
  MIN_TOPIC_TREND_WINDOW_QUESTIONS,
} from '../../domain/diagnostics/error-categories.js';
import type { AppState } from '../../core/types.js';

export interface TopicDiagnosisServiceDependencies {
  getState: () => AppState;
  todayISO: () => string;
  addDays: (iso: string | null | undefined, days: number) => string;
  startOfWeek: (iso: any) => string;
  diasParaRevisao: (targetIso: string | null | undefined) => number | null;
  localDateFromTimestamp: (value: any) => string;
  getTopicById: (topicId: string | null | undefined) => { subject: any; topic: any } | null;
  entitySubjectId: (item: Record<string, any>) => string | null;
  validQuestionRecords: () => any[];
  normalizeErrorBreakdown: (question: Record<string, any>) => void;
  studyTimeByTopic: (topicId: string) => number;
  topicHistoryService: {
    list: (filter?: Record<string, any>) => any[];
    eventLocalDate: (event: Record<string, any>) => string | null;
  };
}

export function createTopicDiagnosisService(deps: TopicDiagnosisServiceDependencies) {
  const {
    getState,
    todayISO,
    addDays,
    startOfWeek,
    diasParaRevisao,
    localDateFromTimestamp,
    getTopicById,
    entitySubjectId,
    validQuestionRecords,
    normalizeErrorBreakdown,
    studyTimeByTopic,
    topicHistoryService,
  } = deps;

  function subjectAccuracyTarget(subjectId: string) {
    const state = getState();
    return resolveSubjectAccuracyTarget(subjectId, state.examBlueprint, state.metas.metaAprovacao);
  }

  function classifyAccuracy(accuracy: number | null, subjectId: string) {
    return classifyAccuracyTarget(accuracy, subjectAccuracyTarget(subjectId));
  }

  function getTopicPerformance(topicId: string) {
    return calculateTopicPerformance(validQuestionRecords(), topicId);
  }

  function getSubjectTopicPerformance(subjectId: string) {
    const state = getState();
    const subject = state.subjects.find(item => item.id === subjectId);
    if (!subject) return [];
    return subject.topics
      .filter(topic => !topic.archived)
      .map(topic => {
        const performance = getTopicPerformance(topic.id);
        return {
          ...topic,
          ...performance,
          confidence: performanceConfidence(performance.resolved),
          classification: classifyAccuracy(performance.accuracy, subjectId),
        };
      })
      .sort((a, b) => {
        if (a.accuracy === null) return 1;
        if (b.accuracy === null) return -1;
        return a.accuracy - b.accuracy;
      });
  }

  function buildErrorProfile(records: any[]) {
    records.forEach(normalizeErrorBreakdown);
    return analyzeErrors(records, {
      minimumErrors: MIN_ERROR_RECOMMENDATION_COUNT,
      minimumCoverage: MIN_ERROR_RECOMMENDATION_COVERAGE,
    });
  }

  function getTopicErrorProfile(topicId: string) {
    const cutoff = addDays(todayISO(), -29);
    return buildErrorProfile(
      validQuestionRecords().filter(
        question =>
          question.topicId === topicId && question.date >= cutoff && question.date <= todayISO()
      )
    );
  }

  function getSubjectPerformanceCounts(subjectId: string) {
    const state = getState();
    return calculateSubjectPerformanceCounts(
      state.questoes,
      state.simulados,
      subjectId,
      entitySubjectId
    );
  }

  function topicErrorRate(topicId: string, subjectId: string) {
    return calculateTopicErrorRate(
      getTopicPerformance(topicId),
      getSubjectPerformanceCounts(subjectId)
    );
  }

  function getSubjectWeeklyTrend(subjectId: string, weeks = 8, records = validQuestionRecords()) {
    return calculateSubjectWeeklyTrend({
      records,
      subjectId,
      weeks,
      startOfWeekFn: startOfWeek,
      addDaysFn: addDays,
      today: todayISO(),
      entitySubjectId,
    });
  }

  function getTopicWeeklyTrend(topicId: string, weeks = 8) {
    return calculateTopicWeeklyTrend({
      records: validQuestionRecords(),
      topicId,
      weeks,
      startOfWeekFn: startOfWeek,
      addDaysFn: addDays,
      today: todayISO(),
    });
  }

  function topicLastActivityDate(topicId: string) {
    const state = getState();
    let last: any = null;
    const bump = (date: string) => {
      if (date && (!last || date > last)) last = date;
    };
    topicHistoryService
      .list({ topicId, includeLifecycle: false })
      .forEach(event => bump(topicHistoryService.eventLocalDate(event)!));
    state.questoes
      .filter(question => question.topicId === topicId)
      .forEach(question => bump(question.date));
    state.studySessions
      .filter(session => session.topicId === topicId)
      .forEach(session => bump(session.date));
    state.calendar
      .filter(item => item.topicId === topicId && item.status === 'Concluído')
      .forEach(item => bump(item.date));
    state.reviewAgenda
      .filter(item => (item.topicId || item.topicRef) === topicId && item.status === 'Concluído')
      .forEach(item => bump(item.date));
    return last;
  }

  function pendingReviewForTopic(topicId: string) {
    const state = getState();
    return (
      state.reviewAgenda
        .filter(
          review => (review.topicId || review.topicRef) === topicId && review.status !== 'Concluído'
        )
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0] || null
    );
  }

  function dominantTopicError(profile: Record<string, any>) {
    return calculateDominantTopicError(profile, ERROR_CATEGORIES, ERROR_RECOMMENDATIONS);
  }

  function topicMasteryIndex(_subjectId: string, topicId: string) {
    const state = getState();
    const found = getTopicById(topicId);
    if (!found) return calculateTopicMastery();
    const today = todayISO(),
      cutoff = addDays(today, -29);
    return calculateTopicMastery({
      topic: found.topic,
      performance: getTopicPerformance(topicId),
      trend: calculateWeightedTrend(getTopicWeeklyTrend(topicId), MIN_TOPIC_TREND_WINDOW_QUESTIONS),
      reviews: state.reviewAgenda.filter(
        review =>
          (review.topicId || review.topicRef) === topicId && review.date && review.date <= today
      ),
      recentSessions: state.studySessions.filter(
        session => session.topicId === topicId && session.date >= cutoff && session.date <= today
      ),
      periodStart: null,
      periodEnd: today,
    });
  }

  function diagnoseTopic(subjectId: string, topicId: string) {
    const found = getTopicById(topicId);
    if (!found) return null;
    const performance = getTopicPerformance(topicId);
    const mastery = topicMasteryIndex(subjectId, topicId);
    const effectiveError = topicErrorRate(topicId, subjectId);
    const trend = calculateWeightedTrend(
      getTopicWeeklyTrend(topicId),
      MIN_TOPIC_TREND_WINDOW_QUESTIONS
    );
    const errorProfile = getTopicErrorProfile(topicId);
    const dominantError = dominantTopicError(errorProfile);
    const lastActivity = topicLastActivityDate(topicId);
    const dateDistance = lastActivity ? diasParaRevisao(lastActivity) : null;
    const daysSinceStudy = dateDistance === null ? 0 : Math.max(0, -dateDistance);
    const pendingReview = pendingReviewForTopic(topicId);
    const reviewDistance = pendingReview?.date ? diasParaRevisao(pendingReview.date) : null;
    const overdueDays = reviewDistance === null ? 0 : Math.max(0, -reviewDistance);
    const target = subjectAccuracyTarget(subjectId);
    const reliablePerformance = performance.resolved >= 10 && performance.accuracy !== null;
    let status = 'Em dia';
    if (
      overdueDays >= 7 ||
      trend.state === 'strong_down' ||
      (reliablePerformance && performance.accuracy! < target - 15) ||
      (trend.key === 'down' && reliablePerformance && performance.accuracy! < target)
    )
      status = 'Crítico';
    else if (
      overdueDays > 0 ||
      (reliablePerformance && performance.accuracy! < target) ||
      trend.key === 'down' ||
      daysSinceStudy >= 7
    )
      status = 'Atenção';
    else if (!reliablePerformance || daysSinceStudy >= 4) status = 'Acompanhamento';

    let recommendation = dominantError?.recommendation || null;
    if (!recommendation && pendingReview && reviewDistance !== null && reviewDistance <= 0)
      recommendation = {
        action: 'Concluir a revisão programada',
        studyType: 'review',
        estimatedMinutes: 25,
        questions: 10,
      };
    if (!recommendation && found.topic.status === 'Não iniciado')
      recommendation = {
        action: 'Estudar a teoria e registrar os pontos principais',
        studyType: 'study',
        estimatedMinutes: 35,
        questions: 10,
      };
    if (!recommendation && reliablePerformance && performance.accuracy! < target)
      recommendation = {
        action: 'Resolver questões comentadas e revisar os erros',
        studyType: 'questions',
        estimatedMinutes: 40,
        questions: 15,
      };
    if (!recommendation)
      recommendation = {
        action:
          found.topic.status === 'Em andamento'
            ? 'Continuar o estudo do tópico'
            : 'Fazer uma revisão de manutenção',
        studyType: found.topic.status === 'Em andamento' ? 'study' : 'review',
        estimatedMinutes: 30,
        questions: 10,
      };

    const reasons = [];
    if (overdueDays > 0) reasons.push('revisão atrasada ' + overdueDays + 'd');
    if (reliablePerformance && performance.accuracy! < target)
      reasons.push(performance.accuracy + '% de acerto');
    if (trend.key === 'down') reasons.push('tendência em queda');
    if (daysSinceStudy >= 7) reasons.push(daysSinceStudy + 'd sem atividade');
    if (dominantError)
      reasons.push(
        dominantError.meta.label.toLowerCase() +
          ' em ' +
          dominantError.share +
          '% dos erros categorizados'
      );
    if (reasons.length === 0)
      reasons.push(reliablePerformance ? 'desempenho dentro do esperado' : 'amostra ainda pequena');

    return {
      subjectId,
      topicId,
      status,
      statusIcon: DIAGNOSIS_STATUS_ICON[status],
      performance,
      mastery,
      effectiveErrorRate: effectiveError.rate,
      performanceSource: effectiveError.source,
      trend,
      errorProfile,
      dominantError,
      lastActivity,
      daysSinceStudy,
      studySeconds: studyTimeByTopic(topicId),
      pendingReview,
      overdueDays,
      recommendation,
      reasons,
      summary: reasons.join(' · '),
    };
  }

  function topicRetentionScore(_subjectId: string, topicId: string) {
    const state = getState();
    const found = getTopicById(topicId);
    if (!found)
      return {
        score: 0,
        raw: null as any,
        confidence: 0,
        confidenceLabel: 'Baixa',
        available: false,
        detail: 'Tópico não encontrado',
      };
    const today = todayISO(),
      due = state.reviewAgenda.filter(
        r => (r.topicId || r.topicRef) === topicId && r.date && r.date <= today
      );
    const done = due.filter(r => r.status === 'Concluído' && r.completedAt);
    const onTime = done.filter(
      r => localDateFromTimestamp(r.completedAt) <= addDays(r.date, 1)
    ).length;
    const cutoff = addDays(today, -59);
    const questions = validQuestionRecords().filter(
      q => q.topicId === topicId && q.date >= cutoff && q.date <= today
    );
    const resolved = questions.reduce((n, q) => n + (Number(q.resolved) || 0), 0),
      correct = questions.reduce((n, q) => n + (Number(q.correct) || 0), 0);
    const dates = done
      .map(r => localDateFromTimestamp(r.completedAt))
      .filter(Boolean)
      .sort();
    const lastReview =
      dates[dates.length - 1] || localDateFromTimestamp(found.topic.lastReviewedAt) || null;
    const daysSince = lastReview ? Math.max(0, -(diasParaRevisao(lastReview) ?? 0)) : null;
    return calculateTopicRetention({
      due,
      resolved,
      correct,
      lastReview,
      daysSince,
      onTime,
      periodStart: cutoff,
      periodEnd: today,
    });
  }

  function topicReviewHealthScore(
    topic: Record<string, any>,
    masteryResult = topicMasteryIndex(topic.subjectId, topic.id),
    retentionResult = topicRetentionScore(topic.subjectId, topic.id),
    diagnosis = diagnoseTopic(topic.subjectId, topic.id)
  ) {
    const lastReviewDate = localDateFromTimestamp(topic.lastReviewedAt);
    const daysSinceReview = lastReviewDate
      ? Math.max(0, -(diasParaRevisao(lastReviewDate) ?? 0))
      : null;
    const evidenceValues = [masteryResult?.confidence, retentionResult?.confidence].filter(value =>
      Number.isFinite(Number(value))
    );
    const evidenceStrength = evidenceValues.length
      ? evidenceValues.reduce((sum, value) => sum + Number(value), 0) / evidenceValues.length
      : null;
    return calculateReviewHealth({
      daysSinceReview,
      hasPriorStudy:
        topic.status !== 'Não iniciado' ||
        Boolean(diagnosis?.performance?.resolved) ||
        Boolean(diagnosis?.studySeconds),
      retention: retentionResult?.available ? retentionResult.score : null,
      mastery: masteryResult?.confidence > 0 ? masteryResult.score : null,
      recentPerformance: diagnosis?.performance?.accuracy ?? null,
      examImpact: topic.examImportance == null ? null : Number(topic.examImportance) * 100,
      evidenceStrength,
    });
  }

  function taxaErroDisciplina(subjectId: string) {
    const state = getState();
    return calculateSubjectErrorRate(subjectId, state.questoes, state.simulados, entitySubjectId);
  }

  function ultimaAtividadeDisciplina(subjectId: string) {
    const state = getState();
    return findSubjectLatestActivityDate({
      subjectId,
      topicHistoryDates: topicHistoryService
        .list({ subjectId, includeLifecycle: false })
        .map(event => topicHistoryService.eventLocalDate(event)),
      questionDates: state.questoes
        .filter(q => entitySubjectId(q) === subjectId)
        .map(q => q.date),
      calendarDates: state.calendar
        .filter(c => entitySubjectId(c) === subjectId && c.status === 'Concluído')
        .map(c => c.date),
      reviewDates: state.reviewAgenda
        .filter(a => entitySubjectId(a) === subjectId && a.status === 'Concluído')
        .map(a => a.date),
      sessionDates: state.studySessions
        .filter(session => entitySubjectId(session) === subjectId)
        .map(session => session.date),
    });
  }

  function diasSemEstudarDisciplina(subjectId: string) {
    return calculateDaysSinceSubjectStudy(ultimaAtividadeDisciplina(subjectId), diasParaRevisao);
  }

  return {
    subjectAccuracyTarget,
    classifyAccuracy,
    getTopicPerformance,
    getSubjectTopicPerformance,
    buildErrorProfile,
    getTopicErrorProfile,
    getSubjectPerformanceCounts,
    topicErrorRate,
    getSubjectWeeklyTrend,
    getTopicWeeklyTrend,
    topicLastActivityDate,
    pendingReviewForTopic,
    dominantTopicError,
    topicMasteryIndex,
    diagnoseTopic,
    topicRetentionScore,
    topicReviewHealthScore,
    taxaErroDisciplina,
    ultimaAtividadeDisciplina,
    diasSemEstudarDisciplina,
  };
}
