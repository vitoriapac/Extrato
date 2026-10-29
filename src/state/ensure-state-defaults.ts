import { normalizeAdherenceTarget } from '../application/adherence/adherence-target.js';
import { STUDY_ACTION_SOURCES } from '../application/recommendations/recommendation-action.js';
import type { ActiveTimerState, AppState, Metas, StudySession } from '../core/types.js';
import { uid } from '../core/utils.js';
import { PRIORITY_ALGORITHM_VERSION } from '../domain/analytics/priority-score.js';
import { EXAM_INTELLIGENCE_VERSION } from '../domain/exam-intelligence/config.js';
import { ADAPTIVE_PLANNING_VERSION } from '../domain/planning/adaptive-planning.js';
import { createAdaptiveReviewState, REVIEW_RATINGS } from '../domain/reviews.js';
import { normalizeStudySession } from '../domain/sessions/study-session.js';
import { CURRENT_SCHEMA_VERSION, DIFFICULTY_OPTIONS } from './schema.js';
import {
  normalizeAlgorithmVersions,
  normalizeExamBlueprint,
  normalizeTopicStrategy,
} from './strategic.js';

export interface EnsureStateDefaultsDependencies {
  getState: () => AppState;
  setState: (next: AppState) => void;
  nowISO: () => string;
  todayISO: () => string;
  normalizeHistoryEvent: (event: Record<string, any>) => void;
  normalizeErrorBreakdown: (question: Record<string, any>) => void;
  refreshAllTopicReviewStats: () => void;
}

export function ensureStateDefaultsWithDeps(deps: EnsureStateDefaultsDependencies): AppState {
  const {
    getState,
    setState,
    nowISO,
    todayISO,
    normalizeHistoryEvent,
    normalizeErrorBreakdown,
    refreshAllTopicReviewStats,
  } = deps;

  let state = getState();
  if (!state || typeof state !== 'object') {
    state = {} as AppState;
    setState(state);
  }
  if (!Array.isArray(state.subjects)) state.subjects = [];
  if (!Array.isArray(state.calendar)) state.calendar = [];
  if (!Array.isArray(state.reviewAgenda)) state.reviewAgenda = [];
  if (!Array.isArray(state.questoes)) state.questoes = [];
  if (!Array.isArray(state.simulados)) state.simulados = [];
  if (!Array.isArray(state.exams)) state.exams = [];
  if (!Array.isArray(state.examQuestions)) state.examQuestions = [];
  if (!Array.isArray(state.weeklyCloseSnapshots)) state.weeklyCloseSnapshots = [];
  if (!Array.isArray(state.planningCapacityHistory)) state.planningCapacityHistory = [];
  if (!Array.isArray(state.errorFlashcards)) state.errorFlashcards = [];
  if (!['agenda', 'sequence'].includes(state.executionMode)) state.executionMode = 'agenda';

  const metaDefaults = {
    semanal: 5,
    mensal: 20,
    questoesSemanal: 150,
    simuladosSemanal: 1,
    metaAprovacao: 70,
    consistenciaSemanal: 5,
    horasDiarias: 2.5,
  };
  if (!state.metas || typeof state.metas !== 'object') state.metas = {} as Metas;
  const consistencyTarget = state.metas.consistenciaSemanal;
  state.metas.aderenciaSemanal = normalizeAdherenceTarget(state.metas.aderenciaSemanal);
  Object.entries(metaDefaults).forEach(([key, value]) => {
    if (!Number.isFinite(Number((state.metas as Record<string, any>)[key])))
      (state.metas as Record<string, any>)[key] = value;
    else
      (state.metas as Record<string, any>)[key] = Number((state.metas as Record<string, any>)[key]);
  });
  state.metas.consistenciaSemanal =
    consistencyTarget == null
      ? 5
      : Math.max(1, Math.min(7, Math.round(state.metas.consistenciaSemanal)));
  const hoursSource =
    state.metas.horasPorDia && typeof state.metas.horasPorDia === 'object'
      ? state.metas.horasPorDia
      : {};
  state.metas.horasPorDia = {};
  for (let day = 0; day < 7; day++) {
    const value = Number(hoursSource[String(day)] ?? state.metas.horasDiarias);
    state.metas.horasPorDia[String(day)] = Number.isFinite(value)
      ? Math.max(0, value)
      : state.metas.horasDiarias;
  }
  if (typeof state.examDate !== 'string') state.examDate = '';
  state.examBlueprint = normalizeExamBlueprint(state.examBlueprint, state.examDate);
  state.algorithmVersions = normalizeAlgorithmVersions(state.algorithmVersions);
  state.algorithmVersions.recommendations = PRIORITY_ALGORITHM_VERSION;
  state.algorithmVersions.examIntelligence = EXAM_INTELLIGENCE_VERSION;
  state.algorithmVersions.adaptivePlanning = ADAPTIVE_PLANNING_VERSION;
  state.algorithmVersions.adaptiveReview = Math.max(
    2,
    Number(state.algorithmVersions.adaptiveReview) || 2
  );
  if (!state.examDate && state.examBlueprint.examDate)
    state.examDate = state.examBlueprint.examDate;
  if (state.examDate !== state.examBlueprint.examDate)
    state.examBlueprint.examDate = state.examDate || null;
  if (!Array.isArray(state.progressHistory)) state.progressHistory = [];
  if (!Array.isArray(state.projectionSnapshots)) state.projectionSnapshots = [];
  if (!Array.isArray(state.readinessSnapshots)) state.readinessSnapshots = [];
  if (!state.achievementsUnlocked || typeof state.achievementsUnlocked !== 'object')
    state.achievementsUnlocked = {};
  if (!Array.isArray(state.metasPorDisciplina)) state.metasPorDisciplina = [];
  if (!Array.isArray(state.studySessions)) state.studySessions = [];
  if (!Array.isArray(state.dailyPlans)) state.dailyPlans = [];
  if (!Array.isArray(state.studyPlans)) state.studyPlans = [];
  if (!Array.isArray(state.planAdjustments)) state.planAdjustments = [];
  if (!Array.isArray(state.adaptivePlanningHistory)) state.adaptivePlanningHistory = [];
  if (!Array.isArray(state.recommendationFeedback)) state.recommendationFeedback = [];
  if (!Array.isArray(state.recommendationHistory)) state.recommendationHistory = [];
  state.recommendationFeedback.forEach(item => {
    item.shownAt = item.shownAt || item.createdAt || null;
    item.ratedAt = item.ratedAt || null;
    item.algorithmVersion = Math.max(1, Number(item.algorithmVersion) || 1);
    item.score = Number.isFinite(Number(item.score)) ? Number(item.score) : null;
    item.confidence = item.confidence || null;
    item.snapshot = item.snapshot || null;
    item.baseline = item.baseline || null;
    item.outcome = item.outcome || null;
  });
  if (!Array.isArray(state.alertStates)) state.alertStates = [];
  if (!state.activeTimer || typeof state.activeTimer !== 'object')
    state.activeTimer = {} as ActiveTimerState;
  state.activeTimer.startedAt = state.activeTimer.startedAt || null;
  state.activeTimer.runStartedAt = state.activeTimer.runStartedAt || null;
  state.activeTimer.accumulatedSeconds = Math.max(
    0,
    Number(state.activeTimer.accumulatedSeconds) || 0
  );
  state.activeTimer.isRunning = Boolean(
    state.activeTimer.isRunning && state.activeTimer.runStartedAt
  );
  state.activeTimer.subjectId = state.activeTimer.subjectId || null;
  state.activeTimer.topicId = state.activeTimer.topicId || null;
  if (!['study', 'review', 'questions', 'simulation'].includes(state.activeTimer.type))
    state.activeTimer.type = 'study';
  state.activeTimer.hiddenAt = state.activeTimer.hiddenAt || null;
  state.activeTimer.planItemId = state.activeTimer.planItemId || null;
  state.activeTimer.targetMinutes = Number(state.activeTimer.targetMinutes) || null;
  state.activeTimer.strategy = state.activeTimer.strategy || null;
  state.activeTimer.strategyStep = Math.max(0, Number(state.activeTimer.strategyStep) || 0);
  state.activeTimer.recommendationId = state.activeTimer.recommendationId || null;
  state.activeTimer.recommendationSource = STUDY_ACTION_SOURCES.includes(
    state.activeTimer.recommendationSource!
  )
    ? state.activeTimer.recommendationSource
    : null;
  state.activeTimer.recommendationType = [
    'study',
    'review',
    'questions',
    'simulation',
    'prerequisite',
  ].includes(state.activeTimer.recommendationType!)
    ? state.activeTimer.recommendationType
    : null;
  state.activeTimer.prioritySnapshot = Number.isFinite(Number(state.activeTimer.prioritySnapshot))
    ? Number(state.activeTimer.prioritySnapshot)
    : null;
  state.dailyPlans.forEach(plan => {
    if (!plan.id) plan.id = uid('plan');
    if (typeof plan.date !== 'string') plan.date = todayISO();
    plan.availableMinutes = Math.max(0, Number(plan.availableMinutes) || 0);
    plan.studyPlanId = plan.studyPlanId || null;
    plan.generationOperationId = plan.generationOperationId || null;
    if (!Array.isArray(plan.items)) plan.items = [];
    plan.items.forEach(item => {
      if (!item.id) item.id = uid('plan-item');
      item.subjectId = item.subjectId || null;
      item.topicId = item.topicId || null;
      if (!['study', 'review', 'questions', 'simulation'].includes(item.type)) item.type = 'study';
      item.plannedMinutes = Math.max(0, Number(item.plannedMinutes) || 0);
      item.executedSeconds = Math.max(0, Number(item.executedSeconds) || 0);
      if (
        ![
          'planned',
          'in_progress',
          'partial',
          'completed',
          'deferred',
          'replaced',
          'skipped',
        ].includes(item.status)
      )
        item.status = 'planned';
      if (!Array.isArray(item.sessionIds)) item.sessionIds = [];
      item.originalDate = item.originalDate || plan.date;
      item.currentDate = item.currentDate || plan.date;
      item.rescheduleCount = Math.max(0, Number(item.rescheduleCount) || 0);
      item.skippedReason = item.skippedReason || null;
      item.recommendationId = item.recommendationId || null;
      item.studyPlanId = item.studyPlanId || null;
      item.studyPlanItemId = item.studyPlanItemId || null;
      item.generationOperationId = item.generationOperationId || null;
      item.rescheduledFromId = item.rescheduledFromId || null;
      item.rescheduleOperationId = item.rescheduleOperationId || null;
    });
  });
  state.studyPlans.forEach(plan => {
    if (!Array.isArray(plan.dailyPlanOperations)) plan.dailyPlanOperations = [];
  });
  if (!Array.isArray(state.topicHistory)) state.topicHistory = [];
  state.topicHistory.forEach(normalizeHistoryEvent);
  state.schemaVersion = CURRENT_SCHEMA_VERSION;
  state.subjects.forEach(s => {
    if (!Array.isArray(s.topics)) s.topics = [];
    if (typeof s.collapsed !== 'boolean') s.collapsed = false;
    if (typeof s.archived !== 'boolean') s.archived = false;
    if (s.archivedAt === undefined) s.archivedAt = null;
    if (typeof s.createdAt !== 'string') s.createdAt = nowISO();
    s.topics.forEach(t => {
      if (typeof t.notes !== 'string') t.notes = '';
      if (!Array.isArray(t.tags)) t.tags = [];
      if (!DIFFICULTY_OPTIONS.includes(t.difficulty!)) t.difficulty = 'Médio';
      if (typeof t.createdAt !== 'string') t.createdAt = nowISO();
      if (typeof t.archived !== 'boolean') t.archived = false;
      if (!('archivedAt' in t)) t.archivedAt = null;
      if (!('firstCompletedAt' in t)) t.firstCompletedAt = null;
      if (!('lastCompletedAt' in t)) t.lastCompletedAt = null;
      t.completionCount = Number(t.completionCount) || 0;
      if (!('lastReviewedAt' in t)) t.lastReviewedAt = null;
      t.reviewCount = Number(t.reviewCount) || 0;
      t.adaptiveReview = t.adaptiveReview ? createAdaptiveReviewState(t.adaptiveReview) : null;
      normalizeTopicStrategy(t);
    });
  });
  state.questoes.forEach(question => {
    question.topicId = question.topicId || null;
    normalizeErrorBreakdown(question);
  });
  state.simulados.forEach(sim => {
    if (!Array.isArray(sim.breakdown)) sim.breakdown = [];
  });
  state.studySessions = state.studySessions.map(session => {
    const normalized = normalizeStudySession(session, { today: todayISO });
    if (!normalized.id) normalized.id = uid('session');
    return normalized as StudySession;
  });
  state.reviewAgenda.forEach(review => {
    review.topicId = review.topicId || review.topicRef || null;
    if (!('completedAt' in review)) review.completedAt = null;
    review.manualDate = Boolean(review.manualDate);
    review.adaptive = review.adaptive !== false;
    review.adaptiveReason = review.adaptiveReason || null;
    review.suggestedDate = review.suggestedDate || null;
    review.lastRating = (REVIEW_RATINGS as Record<string, any>)[review.lastRating!]
      ? review.lastRating
      : null;
    review.adaptiveState = review.adaptiveState
      ? createAdaptiveReviewState(review.adaptiveState)
      : null;
  });
  refreshAllTopicReviewStats();
  return state;
}
