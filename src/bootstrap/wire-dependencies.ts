import {
  createStorageManager,
  repositoryReadLocalState,
  repositoryWriteLocalState,
} from '../storage/repository.js';
import {
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
  STORAGE_KEY,
  DEMO_STORAGE_KEY,
} from '../state/schema.js';
import { createRealStorageProvider } from '../storage/real-storage-provider.js';
import { createDemoStorageProvider } from '../storage/demo-storage-provider.js';
import { createAppContext } from '../application/create-app-context.js';
import { createAppRepositories } from '../repositories/collection-repository.js';
import { createReviewService } from '../application/reviews/review-service.js';
import { createStudyPlanService } from '../application/planning/study-plan-service.js';
import { createDailyPlanService } from '../application/planning/daily-plan-service.js';
import { createReplanService } from '../application/planning/replan-service.js';
import { createSessionService } from '../application/sessions/session-service.js';
import { createGuidedStudyService } from '../application/guided-study/guided-study-service.js';
import { createRecordService } from '../application/records/record-service.js';
import { recordPlanningCapacity } from '../domain/planning/capacity-history.js';
import { createGoalService } from '../application/goals/goal-service.js';
import { createSubjectService } from '../application/subjects/subject-service.js';
import { createTopicStrategyController } from '../features/topic-strategy/topic-strategy-controller.js';
import { createTopicHistoryService } from '../application/history/topic-history-service.js';
import { generateDemoData as defaultGenerateDemoData } from '../demo/demo-generator.js';
import { applyAdaptiveReviewRating as defaultApplyAdaptiveReviewRating } from '../domain/reviews.js';
import { buildStudyPlan as defaultBuildStudyPlan } from '../application/build-study-plan.js';
import {
  buildDailyPlanProposal as defaultBuildDailyPlanProposal,
  applyDailyPlanProposal as defaultApplyDailyPlanProposal,
  undoDailyPlanGeneration as defaultUndoDailyPlanGeneration,
} from '../application/planning/distribute-study-plan.js';
import {
  buildReplanProposal as defaultBuildReplanProposal,
  applyReplan as defaultApplyReplan,
  undoReplan as defaultUndoReplan,
} from '../application/replan-study.js';
import { normalizeErrorBreakdown as defaultNormalizeErrorBreakdown } from '../domain/diagnostics/error-categories.js';
import { completeRecommendationFeedback as defaultCompleteRecommendationFeedback } from '../application/recommendations/recommendation-feedback.js';
import { parseLocalDate as defaultParseLocalDate } from '../core/date-utils.js';
import { normalizeTopicStrategy as defaultNormalizeTopicStrategy } from '../state/strategic.js';

export interface WireAppDependenciesOptions {
  dbName?: string;
  dbVersion?: number;
  storeName?: string;
  storageKey?: string;
  demoStorageKey?: string;
  isDemoMode: boolean;
  getState: () => Record<string, any>;
  clock: {
    today: () => string;
    nowISO: () => string;
    [key: string]: any;
  };
  idGenerator: (prefix?: string) => string;
  readLocal?: (key: string) => string | null;
  writeLocal?: (key: string, value: string) => boolean;
  removeLocal?: (key: string) => void;
  sessionStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  generateDemoData?: (options: { today: string }) => Record<string, any>;
  getTopicById: (topicId: string) => { topic?: any; subject?: any } | null;
  evidenceScopeForTopic: (topicId: string) => any;
  applyAdaptiveReviewRating?: (current: any, rating: any, options: Record<string, any>) => any;
  addHistoryEvent: (
    type: string,
    subjectId: any,
    topicId?: any,
    details?: any
  ) => any;
  entitySubjectId: (entity: any) => string | null;
  refreshTopicReviewStats: (topicId: string) => void;
  buildStudyPlan?: (options: any) => any;
  buildDailyPlanProposal?: (options: any) => any;
  applyDailyPlanProposal?: (proposal: any) => any;
  undoDailyPlanGeneration?: (options: any) => any;
  buildReplanProposal?: (options: any) => any;
  applyReplan?: (proposal: any) => any;
  undoReplan?: (options: any) => any;
  normalizeErrorBreakdown?: (item: any) => any;
  completeRecommendationFeedback?: (
    feedbackList: any[],
    recommendationId: string,
    options?: any
  ) => any;
  measureRecommendationResults: (options: any) => any;
  currentStudyRecommendations: () => any[];
  parseLocalDate?: (dateStr: string) => Date | null;
  allTopics: () => any[];
  normalizeTopicStrategy?: (topic: any) => any;
  captureReadinessBeforeStrategy: (reason: string) => void;
  invalidatePlanPreview: () => void;
  persistAndRender: () => void;
  renderSubjects: () => void;
  showToast: (message: string) => void;
  timestampToLocalDateISO: (timestamp: number | string) => string;
}

export function wireAppDependencies(options: WireAppDependenciesOptions) {
  const {
    dbName = DB_NAME,
    dbVersion = DB_VERSION,
    storeName = STORE_NAME,
    storageKey = STORAGE_KEY,
    demoStorageKey = DEMO_STORAGE_KEY,
    isDemoMode,
    getState,
    clock,
    idGenerator,
    readLocal = repositoryReadLocalState,
    writeLocal = repositoryWriteLocalState,
    removeLocal = (key: string) => {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      } catch (error) {}
    },
    sessionStorage: demoSessionStorage = typeof sessionStorage !== 'undefined'
      ? sessionStorage
      : undefined,
    generateDemoData = defaultGenerateDemoData,
    getTopicById,
    evidenceScopeForTopic,
    applyAdaptiveReviewRating = defaultApplyAdaptiveReviewRating,
    addHistoryEvent,
    entitySubjectId,
    refreshTopicReviewStats,
    buildStudyPlan = defaultBuildStudyPlan,
    buildDailyPlanProposal = defaultBuildDailyPlanProposal,
    applyDailyPlanProposal = defaultApplyDailyPlanProposal,
    undoDailyPlanGeneration = defaultUndoDailyPlanGeneration,
    buildReplanProposal = defaultBuildReplanProposal,
    applyReplan = defaultApplyReplan,
    undoReplan = defaultUndoReplan,
    normalizeErrorBreakdown = defaultNormalizeErrorBreakdown,
    completeRecommendationFeedback = defaultCompleteRecommendationFeedback,
    measureRecommendationResults,
    currentStudyRecommendations,
    parseLocalDate = defaultParseLocalDate,
    allTopics,
    normalizeTopicStrategy = defaultNormalizeTopicStrategy,
    captureReadinessBeforeStrategy,
    invalidatePlanPreview,
    persistAndRender,
    renderSubjects,
    showToast,
    timestampToLocalDateISO,
  } = options;

  const persistentStorageManager = createStorageManager({
    dbName,
    dbVersion,
    storeName,
  });

  const realStorageProvider = createRealStorageProvider({
    manager: persistentStorageManager,
    readLocal,
    writeLocal,
    removeLocal,
  });

  const demoStorageProvider =
    isDemoMode && demoSessionStorage && generateDemoData
      ? createDemoStorageProvider({
          storage: demoSessionStorage,
          stateKey: storageKey,
          demoKey: demoStorageKey,
          generate: () => generateDemoData({ today: clock.today() }),
        })
      : null;

  const appContext = createAppContext({
    storage: demoStorageProvider || realStorageProvider,
    clock,
    idGenerator,
    repositories: createAppRepositories(getState),
  });

  const reviewService = createReviewService({
    repository: appContext.repositories.reviewAgenda,
    clock,
    idGenerator,
    findTopic: (topicId: string) => getTopicById(topicId)?.topic || null,
    resolveEvidenceScope: evidenceScopeForTopic,
    calculateAdaptiveState: (current: any, rating: any, opts: Record<string, any>) =>
      applyAdaptiveReviewRating(current, rating, opts),
    algorithmVersion: () => getState().algorithmVersions?.adaptiveReview,
    onEvent: (type: string, review: Record<string, any>, details: Record<string, any>) =>
      addHistoryEvent(
        type,
        entitySubjectId(review),
        review.topicId || review.topicRef || null,
        details
      ),
    onTopicChanged: (topicId: string) => refreshTopicReviewStats(topicId),
  });

  const planningRepository = appContext.repositories.planning;

  const studyPlanService = createStudyPlanService({
    repository: planningRepository,
    calculate: buildStudyPlan,
    clock,
    idGenerator,
    algorithmVersion: () => getState().algorithmVersions?.recommendations,
    getActiveExamTags: () => getState().examBlueprint?.activeExamTags || [],
  });

  const dailyPlanService = createDailyPlanService({
    repository: planningRepository,
    buildProposal: buildDailyPlanProposal,
    applyProposal: applyDailyPlanProposal,
    undoGeneration: undoDailyPlanGeneration,
    clock,
    idGenerator,
  });

  const replanService = createReplanService({
    repository: planningRepository,
    buildProposal: buildReplanProposal,
    applyProposal: applyReplan,
    undoProposal: undoReplan,
    clock,
    idGenerator,
    getActiveExamTags: () => getState().examBlueprint?.activeExamTags || [],
  });

  const sessionService = createSessionService({
    repository: appContext.repositories.studySessions,
    questionsRepository: appContext.repositories.questoes,
    historyRepository: appContext.repositories.topicHistory,
    planningRepository,
    recommendationsRepository: appContext.repositories.recommendationFeedback,
    clock,
    idGenerator,
    normalizeQuestion: normalizeErrorBreakdown,
    resolveEvidenceScope: evidenceScopeForTopic,
    completeRecommendation: completeRecommendationFeedback,
    onCompleted: measureRecommendationResults,
  });

  const guidedStudyService = createGuidedStudyService({
    recommend: ({ id }: { id?: string } = {}) =>
      currentStudyRecommendations().filter(item => !id || item.id === id),
    sessionService,
    clock,
  });

  const calendarService = createRecordService({
    repository: appContext.repositories.calendar,
    clock,
    idGenerator,
    prefix: 'calendar',
  });

  const questionService = createRecordService({
    repository: appContext.repositories.questoes,
    clock,
    idGenerator,
    prefix: 'question',
    normalize: (item: Record<string, any>) => {
      item.resolved = Math.max(0, Math.floor(Number(item.resolved) || 0));
      item.correct = Math.min(item.resolved, Math.max(0, Math.floor(Number(item.correct) || 0)));
      normalizeErrorBreakdown(item);
      return item;
    },
  });

  const simulationService = createRecordService({
    repository: appContext.repositories.simulados,
    clock,
    idGenerator,
    prefix: 'simulado',
    normalize: (item: Record<string, any>) => {
      item.total = Math.max(0, Math.floor(Number(item.total) || 0));
      item.correct = Math.min(item.total, Math.max(0, Math.floor(Number(item.correct) || 0)));
      return item;
    },
  });

  const subjectGoalService = createRecordService({
    repository: appContext.repositories.metasPorDisciplina,
    clock,
    idGenerator,
    prefix: 'goal',
  });

  function observePlanningCapacity(source = 'observed') {
    const currentState = getState();
    recordPlanningCapacity(currentState.planningCapacityHistory, {
      hoursByDay: currentState.metas?.horasPorDia,
      today: clock.today(),
      capturedAt: clock.nowISO(),
      id: idGenerator('capacity'),
      source,
    });
  }

  const goalsService = createGoalService({
    repository: appContext.repositories.settings,
    getDayOfWeek: (date: string) => parseLocalDate(date)?.getDay() ?? new Date().getDay(),
    onCapacityObserved: observePlanningCapacity,
  });

  const subjectService = createSubjectService({
    repository: appContext.repositories.subjects,
    clock,
    idGenerator,
    onEvent: addHistoryEvent,
  });

  const topicStrategyController = createTopicStrategyController({
    findTopic: getTopicById,
    listTopics: allTopics,
    subjectService,
    normalizeTopic: normalizeTopicStrategy,
    beforeChange: () =>
      captureReadinessBeforeStrategy(
        'Antes de alterar impacto, esforço ou pré-requisitos de um tópico'
      ),
    invalidatePlan: () => {
      invalidatePlanPreview();
    },
    onChanged: persistAndRender,
    onCycle: () => {
      showToast('Esse vínculo criaria um ciclo entre pré-requisitos.');
      renderSubjects();
    },
  });

  const topicHistoryService = createTopicHistoryService({
    getState,
    clock,
    idGenerator,
    toLocalDate: timestampToLocalDateISO,
  });

  return {
    persistentStorageManager,
    realStorageProvider,
    demoStorageProvider,
    appContext,
    planningRepository,
    reviewService,
    studyPlanService,
    dailyPlanService,
    replanService,
    sessionService,
    guidedStudyService,
    calendarService,
    questionService,
    simulationService,
    subjectGoalService,
    goalsService,
    subjectService,
    topicStrategyController,
    topicHistoryService,
    observePlanningCapacity,
    storageManager: appContext.storage,
  };
}
