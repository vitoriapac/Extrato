import { calculateTopicCoverage } from '../../domain/analytics/coverage.js';
import {
  calculateDailyStudySummary,
  collectActivityDates,
  collectGoalDates,
  computeActivityStreak,
} from '../../domain/analytics/study-streak.js';
import {
  classifyEvidenceScope,
  indexExamTopics,
  resolveExamEvidenceScope,
} from '../../domain/exams/exam-evidence-scope.js';
import {
  isSimulationInExamScope,
  isTopicInExamScope,
  normalizeExamTags,
} from '../../domain/exams/exam-scope.js';
import { buildUnifiedReviews } from '../calendar/build-unified-reviews.js';
import type { AppState } from '../../core/types.js';
import { firstActivityDate } from './first-activity-date.js';

export interface StudyMetricsSelectorsDependencies {
  getState: () => AppState;
  todayISO: () => string;
  addDays: (iso: string | null | undefined, days: number) => string;
  isSameWeek: (iso: string | null | undefined) => boolean;
  isSameMonth: (iso: string | null | undefined) => boolean;
  startOfWeek: (iso: any) => string;
  localDateFromTimestamp: (value: any) => string;
  getTopicById: (topicId: string | null | undefined) => { subject: any; topic: any } | null;
  getSubjectName: (subjectId: string) => string;
  getTopicName?: (topicId: string | null | undefined) => string;
  entitySubjectId: (item: Record<string, any>) => string | null;
  entitySubjectName?: (item: Record<string, any>) => string;
  activeTopics: () => any[];
  activeSubjects: () => any[];
  metaHoursForDate: (date?: string) => number;
  topicHistoryService: {
    add: (
      type: string,
      subjectId: string,
      topicId?: string | null,
      metadata?: any,
      options?: any
    ) => any;
    list: (filter?: Record<string, any>) => any[];
    eventLocalDate: (event: Record<string, any>) => string | null;
  };
}

export function createStudyMetricsSelectors(deps: StudyMetricsSelectorsDependencies) {
  const {
    getState,
    todayISO,
    addDays,
    isSameWeek,
    startOfWeek,
    localDateFromTimestamp,
    getTopicById,
    getSubjectName,
    getTopicName = (_id?: string | null) => '',
    entitySubjectId,
    entitySubjectName = (item: Record<string, any>) => {
      const id = entitySubjectId(item);
      return id ? getSubjectName(id) : '—';
    },
    activeTopics,
    activeSubjects,
    metaHoursForDate,
    topicHistoryService,
  } = deps;

  function evidenceScopeForTopic(topicId: string | null) {
    const found = getTopicById(topicId);
    return found ? normalizeExamTags(found.topic.examTags) : null;
  }

  function topicInActiveExamScope(topic: Record<string, any>) {
    const state = getState();
    return isTopicInExamScope(topic, state.examBlueprint?.activeExamTags || []);
  }

  function examScopedTopics() {
    return activeTopics().filter(topicInActiveExamScope);
  }

  function examScopedSubjects() {
    const ids = new Set(examScopedTopics().map(topic => topic.subjectId));
    return activeSubjects().filter(subject => ids.has(subject.id));
  }

  function examEvidenceContext() {
    const state = getState();
    return resolveExamEvidenceScope({
      subjects: state.subjects,
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      sessions: state.studySessions,
      questions: state.questoes,
      reviews: state.reviewAgenda,
    });
  }

  function examScopedRecords(records: any[] = []) {
    const state = getState();
    const tags = state.examBlueprint?.activeExamTags || [];
    const index = indexExamTopics(state.subjects);
    return records.filter(
      record => classifyEvidenceScope(record, state.subjects, tags, index).includedInExamMetrics
    );
  }

  function examScopedSimulations() {
    const state = getState();
    const active = state.examBlueprint?.activeExamTags || [];
    return state.simulados.filter(item => isSimulationInExamScope(item, active));
  }

  function subjectProgress(subject: Record<string, any>) {
    return calculateTopicCoverage(subject.topics).value;
  }

  function getDailyStudySummary(date: string, options: any = {}) {
    const state = getState();
    return calculateDailyStudySummary({
      date,
      studySessions: state.studySessions,
      questoes: state.questoes,
      simulados: state.simulados,
      reviewAgenda: state.reviewAgenda,
      targetHours: metaHoursForDate(date),
      subjectId: options.subjectId,
      entitySubjectId,
      getSubjectName,
      localDateFromTimestamp,
    });
  }

  function getActivityDates() {
    const state = getState();
    return collectActivityDates({
      studySessions: state.studySessions,
      questoes: state.questoes,
      simulados: state.simulados,
      isDateMeaningful: date => getDailyStudySummary(date).meaningful,
    });
  }

  function getGoalDates() {
    const state = getState();
    return collectGoalDates({
      studySessions: state.studySessions,
      isGoalAchievedForDate: date => getDailyStudySummary(date).goalAchieved,
    });
  }

  function computeStreak(activityDates: Set<string>) {
    return computeActivityStreak(activityDates, { today: todayISO(), addDays });
  }

  function addHistoryEvent(
    type: string,
    subjectId: string,
    topicId: string | null = null,
    metadata: any = {}
  ) {
    return topicHistoryService.add(type, subjectId, topicId, metadata, {
      examScope: evidenceScopeForTopic(topicId),
    });
  }

  function historyEvents(type: string) {
    return topicHistoryService.list({ type });
  }

  function eventLocalDate(event: Record<string, any>) {
    return topicHistoryService.eventLocalDate(event);
  }

  function topicCompletionEvents() {
    return historyEvents('topic_completed');
  }

  function uniqueTopicsCompletedBetween(startDate: string, endDate: string) {
    const ids = new Set();
    topicCompletionEvents().forEach(event => {
      const date = eventLocalDate(event);
      if (date && date >= startDate && date <= endDate && event.topicId) ids.add(event.topicId);
    });
    return ids.size;
  }

  function contarTopicosConcluidosNoPeriodo(pred: (date: string) => boolean) {
    const ids = new Set();
    topicCompletionEvents().forEach(event => {
      const date = eventLocalDate(event);
      if (date && pred(date) && event.topicId) ids.add(event.topicId);
    });
    return ids.size;
  }

  function somarQuestoesNaSemana() {
    const state = getState();
    return state.questoes
      .filter(q => isSameWeek(q.date))
      .reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
  }

  function contarSimuladosNaSemana() {
    const state = getState();
    return state.simulados.filter(s => isSameWeek(s.date)).length;
  }

  function somarQuestoesDisciplinaNaSemana(subjectId: string) {
    const state = getState();
    return state.questoes
      .filter(q => entitySubjectId(q) === subjectId && isSameWeek(q.date))
      .reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
  }

  function getWeekStartMinus(weeksAgo: number) {
    const currentWeekStart = startOfWeek(todayISO());
    return addDays(currentWeekStart, -7 * weeksAgo);
  }

  function computeWeeklyHistory(numWeeks: number) {
    const state = getState();
    const start = firstActivityDate(state);
    const weeks = [];
    for (let i = 0; i < numWeeks; i++) {
      const weekStart = getWeekStartMinus(i);
      const weekEnd = addDays(weekStart, 6);
      const topicsConcl = uniqueTopicsCompletedBetween(weekStart, weekEnd);
      const questoesResolved = state.questoes
        .filter(q => q.date >= weekStart && q.date <= weekEnd)
        .reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
      const simuladosCount = state.simulados.filter(
        s => s.date >= weekStart && s.date <= weekEnd
      ).length;
      weeks.push({
        weekStart,
        weekEnd,
        current: i === 0,
        // Semanas encerradas antes do primeiro registro não contam como cumpridas nem perdidas.
        beforeStart: i !== 0 && (!start || weekEnd < start),
        topicsConcl,
        questoesResolved,
        simuladosCount,
        semanalOk: topicsConcl >= state.metas.semanal,
        questoesOk: questoesResolved >= state.metas.questoesSemanal,
        simuladosOk: simuladosCount >= state.metas.simuladosSemanal,
      });
    }
    return weeks;
  }

  function formatHoras(decimalHoras: number) {
    const totalMin = Math.round(decimalHoras * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
  }

  function totalStudySeconds(filterFn?: (session: any) => boolean) {
    const state = getState();
    const fn = filterFn || (() => true);
    return state.studySessions
      .filter(fn)
      .reduce((sum, s) => sum + (Number(s.durationSeconds) || 0), 0);
  }

  function segundosEstudadosHoje() {
    return totalStudySeconds((s: Record<string, any>) => s.date === todayISO());
  }

  function studyTimeByTopic(topicId: string) {
    return totalStudySeconds((s: Record<string, any>) => s.topicId === topicId);
  }

  function studySecondsByDate(sessions = getState().studySessions) {
    const map: Record<string, any> = {};
    sessions.forEach(s => {
      if (!s.date) return;
      map[s.date] = (map[s.date] || 0) + (Number(s.durationSeconds) || 0);
    });
    return map;
  }

  function validQuestionRecords() {
    const state = getState();
    return state.questoes.filter(q => q.date && (Number(q.resolved) || 0) > 0);
  }

  function weeklyStrategyCapacity() {
    const state = getState();
    return Object.values(state.metas?.horasPorDia || {}).reduce<number>(
      (sum, hours) => sum + Math.max(0, Number(hours) || 0) * 60,
      0
    );
  }

  function planStartDate() {
    const state = getState();
    const dates: any[] = [];
    state.studySessions.forEach(x => {
      if (x.date) dates.push(x.date);
    });
    state.questoes.forEach(x => {
      if (x.date) dates.push(x.date);
    });
    state.simulados.forEach(x => {
      if (x.date) dates.push(x.date);
    });
    state.topicHistory.forEach(x => {
      const d = eventLocalDate(x);
      if (d) dates.push(d);
    });
    state.subjects.forEach(subject => {
      const d = localDateFromTimestamp(subject.createdAt);
      if (d) dates.push(d);
    });
    const valid = dates
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && (!state.examDate || d <= state.examDate))
      .sort();
    return valid[0] || todayISO();
  }

  function refreshTopicReviewStats(topicId: string): void {
    const found = getTopicById(topicId);
    if (!found) return;
    const state = getState();
    const completed = (state.reviewAgenda || []).filter(
      (review: any) =>
        (review.topicId || review.topicRef) === topicId && review.status === 'Concluído'
    );
    const dates = completed
      .map((review: any) => review.completedAt)
      .filter(Boolean)
      .sort();
    found.topic.reviewCount = completed.length;
    found.topic.lastReviewedAt = dates.length ? dates[dates.length - 1] : null;
  }

  function refreshAllTopicReviewStats(): void {
    const state = getState();
    (state.subjects || []).forEach((subject: any) =>
      (subject.topics || []).forEach((topic: any) => refreshTopicReviewStats(topic.id))
    );
  }

  function getTopicDifficulty(topicId?: string | null): string {
    if (!topicId) return 'Médio';
    const found = getTopicById(topicId);
    return found?.topic?.difficulty || 'Médio';
  }

  function getRevisoesUnificadas() {
    const state = getState();
    return buildUnifiedReviews({
      calendar: state.calendar || [],
      reviewAgenda: state.reviewAgenda || [],
      subjectIdOf: entitySubjectId,
      subjectName: entitySubjectName,
      topicName: getTopicName,
    });
  }

  function simuladoEffectiveCounts(sim: Record<string, any>) {
    if (sim.breakdown && sim.breakdown.length > 0) {
      const correct = sim.breakdown.reduce((s: number, b: any) => s + (Number(b.correct) || 0), 0);
      const total = sim.breakdown.reduce((s: number, b: any) => s + (Number(b.total) || 0), 0);
      return { correct, total };
    }
    return { correct: Number(sim.correct) || 0, total: Number(sim.total) || 0 };
  }

  function simuladoNota(sim: Record<string, any>): number {
    const { correct, total } = simuladoEffectiveCounts(sim);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  function performanceScopedPlans(scope: any = examEvidenceContext()) {
    const state = getState();
    if (!(state.examBlueprint?.activeExamTags || []).length) return state.dailyPlans || [];
    const eligible = new Set(scope.content.eligibleTopics.map((item: any) => item.id));
    return (state.dailyPlans || [])
      .map((plan: any) => ({
        ...plan,
        items: (plan.items || []).filter((item: any) => item.topicId && eligible.has(item.topicId)),
      }))
      .filter((plan: any) => plan.items.length);
  }

  return {
    evidenceScopeForTopic,
    topicInActiveExamScope,
    examScopedTopics,
    examScopedSubjects,
    examEvidenceContext,
    examScopedRecords,
    examScopedSimulations,
    subjectProgress,
    getDailyStudySummary,
    getActivityDates,
    getGoalDates,
    computeStreak,
    addHistoryEvent,
    historyEvents,
    eventLocalDate,
    topicCompletionEvents,
    uniqueTopicsCompletedBetween,
    contarTopicosConcluidosNoPeriodo,
    somarQuestoesNaSemana,
    contarSimuladosNaSemana,
    somarQuestoesDisciplinaNaSemana,
    getWeekStartMinus,
    computeWeeklyHistory,
    formatHoras,
    totalStudySeconds,
    segundosEstudadosHoje,
    studyTimeByTopic,
    studySecondsByDate,
    validQuestionRecords,
    weeklyStrategyCapacity,
    planStartDate,
    refreshTopicReviewStats,
    refreshAllTopicReviewStats,
    getTopicDifficulty,
    getRevisoesUnificadas,
    simuladoEffectiveCounts,
    simuladoNota,
    performanceScopedPlans,
  };
}
