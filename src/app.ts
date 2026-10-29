declare const __STUDYTRACK_BUILD_VERSION__: string;
declare global {
  interface Window {
    StudyTrackExamCatalog?: any;
    appState?: any;
    __EXTRATO_TEST__?: Record<string, unknown>;
  }
}

import { renderReadinessOverview } from './ui/renderers/readiness-overview-renderer.js';
import {
  matchesSubjectSearch,
  createSubjectSearchController,
} from './ui/subjects/subject-navigation.js';
import { createReviewsTabController } from './ui/tabs/reviews/reviews-tab-controller.js';
import { createCalendarTabController } from './ui/tabs/calendar/calendar-tab-controller.js';
import { createGoalsTabController } from './ui/tabs/goals/goals-tab-controller.js';
import { createTodayTabController } from './ui/tabs/today/today-tab-controller.js';
import { createSessionHistoryController } from './ui/tabs/today/session-history-controller.js';
import { createStudyRecommendationController } from './ui/tabs/today/study-recommendation-controller.js';
import { createOnboardingModalController } from './features/onboarding/onboarding-modal-controller.js';
import { createDashboardTabController } from './ui/tabs/dashboard/dashboard-tab-controller.js';
import { createStudyPlanBuilderController } from './ui/tabs/goals/study-plan-builder-controller.js';
import { createWeeklyCloseModalController } from './features/weekly-close/weekly-close-modal-controller.js';
import { createPerformanceTabController } from './ui/tabs/performance/performance-tab-controller.js';
import { createApprovalTabController } from './ui/tabs/approval/approval-tab-controller.js';
import { createQuestionAnalyticsController } from './ui/tabs/questions/question-analytics-controller.js';
import { createDiagnosticsTabController } from './ui/tabs/diagnostics/diagnostics-tab-controller.js';
import { createSubjectsTabController } from './ui/tabs/subjects/subjects-tab-controller.js';
import { createExamImportModalController } from './features/exam-import/exam-import-modal-controller.js';
import { createQuestionsTabController } from './ui/tabs/questions/questions-tab-controller.js';
import { createSimulationsTabController } from './ui/tabs/questions/simulations-tab-controller.js';
import { registerDelegatedActions } from './ui/navigation/delegated-actions-registry.js';
import { createShellUiController } from './ui/shell/shell-ui-controller.js';
import { createAppSelectors } from './application/selectors/app-selectors.js';
import { createStudyMetricsSelectors } from './application/selectors/study-metrics-selectors.js';
import { calculateWeightedTrend } from './domain/analytics/topic-performance.js';
import { createWhatIfController } from './ui/controllers/what-if-controller.js';
import { analyzeFocusAndEnergy } from './domain/analytics/focus-energy-analytics.js';
import { createErrorNotebookController } from './ui/controllers/error-notebook-controller.js';
import { createTimerUiController } from './ui/controllers/timer-ui-controller.js';
import { createStudyTimerRuntimeController } from './ui/controllers/study-timer-runtime-controller.js';
import { formatDuration, formatPlanMinutes } from './core/format-duration.js';
import { initialGoalSuggestions } from './domain/goals/initial-goal-guidance.js';
import { freezePlanExecution } from './domain/planning/plan-execution-snapshot.js';
import { buildDiagnosisPageModel } from './application/diagnostics/build-diagnosis-page-model.js';
import { buildDecisionCoherenceReport } from './application/diagnostics/build-decision-coherence-report.js';
import { renderDecisionCoherenceDebug } from './ui/renderers/decision-coherence-debug-renderer.js';
import { renderPreparationSignals } from './ui/renderers/preparation-signals-renderer.js';
import {
  captureProjection,
  buildProjectionCalibration,
} from './application/analytics/projection-calibration-history.js';
import {
  captureAchievementProjection,
  achievementProjectionHistory,
} from './application/projection/index.js';
import { buildRecommendationFollowup } from './application/recommendations/build-recommendation-followup.js';
import { renderRecommendationFollowup } from './ui/renderers/recommendation-followup-renderer.js';
import { countStudyDaysThisWeek } from './application/performance/study-day-count.js';
import { renderProjectionScenarioResult } from './ui/performance/achievement-projection-renderer.js';
import { createDiagnosisController } from './ui/controllers/diagnosis-controller.js';
import { createProjectionController } from './ui/controllers/projection-controller.js';
import { renderGoals } from './ui/renderers/goals-renderer.js';
import { createRecoveryController } from './ui/controllers/recovery-controller.js';
import { createRecoveryStateCommitter } from './application/recovery/recovery-state-committer.js';
import { renderNextBestAction } from './ui/renderers/next-best-action-renderer.js';
import { createExamMatrixController } from './ui/tabs/goals/exam-matrix-controller.js';
import { createSubjectTargetEditorController } from './ui/tabs/goals/subject-target-editor-controller.js';
import { renderRecoveryReviewDebt } from './ui/renderers/recovery-review-debt-renderer.js';
import { DEFAULT_LIST_VISIBLE_ITEMS } from './ui/progressive-list.js';
import {
  STORAGE_KEY,
  BACKUP_KEY,
  BACKUP_INDEX_KEY,
  AUTOMATIC_BACKUP_SLOTS,
  CURRENT_SCHEMA_VERSION,
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
  STATUS_OPTIONS,
  STATUS_CLASS,
  DIFFICULTY_OPTIONS,
  DIFFICULTY_CLASS,
  DEMO_STORAGE_KEY,
} from './state/schema.js';
import {
  uid,
  structuredCloneSafe,
  pluralize,
  escapeHtml,
  escapeAttr,
} from './core/utils.js';
import {
  repositoryReadLocalState,
  repositoryWriteLocalState,
} from './storage/repository.js';
import { createClock } from './core/clock.js';
import { formatDecimal } from './core/format-number.js';
import { parseLocalDate } from './core/date-utils.js';
import {
  setupApplicationLifecycle,
  bootstrapAppRuntime,
  setupProgressiveNavigation,
} from './bootstrap/application-bootstrap.js';
import { wireAppDependencies } from './bootstrap/wire-dependencies.js';
import { createMasterRenderer } from './bootstrap/master-renderer.js';
import {
  RENDER_SCOPE_SECTIONS,
  buildRenderSections,
} from './bootstrap/render-sections-config.js';
import { createTestBridgeConfig } from './bootstrap/create-test-bridge-api.js';
import { applyAdaptiveReviewRating } from './domain/reviews.js';
import { createDefaultState } from './state/defaults.js';
import { ensureStateDefaultsWithDeps } from './state/ensure-state-defaults.js';
import { createStateSyncCoordinator } from './state/state-sync-coordinator.js';
import { createHistoricalExamImportController } from './features/exam-intelligence-import/exam-import-controller.js';
import { labelDynamicControls, trapModalTab } from './ui/accessibility.js';
import { renderCollectionFooter, renderGroupHeader } from './ui/list-components.js';
import { classifyApprovalScore } from './domain/analytics/approval-metrics.js';
import { normalizeTopicStrategy } from './state/strategic.js';
import { buildExecutiveSummary } from './application/build-executive-summary.js';
import { buildErrorAnalysisViewModel } from './application/analytics/build-error-analysis-view-model.js';
import { renderErrorAnalysis } from './ui/renderers/error-analysis-renderer.js';
import { heatmapMetricLevel } from './domain/analytics/heatmap.js';
import { generateDiagnosis } from './application/generate-diagnosis.js';
import { needsMaintenance, prerequisiteBlockers } from './domain/study-eligibility.js';
import { completeRecommendationFeedback } from './application/recommendations/recommendation-feedback.js';
import { summarizeRecommendationHistory } from './application/recommendations/recommendation-history.js';
import { renderRecommendationHistory } from './ui/renderers/recommendation-history-renderer.js';
import { buildRecommendationOutcomeAudit } from './application/recommendations/build-recommendation-outcome-audit.js';
import { renderRecommendationOutcomeAudit } from './ui/renderers/recommendation-outcome-audit-renderer.js';
import {
  buildStudyAction,
  recommendationActionKind,
  recommendationActionLabel,
} from './application/recommendations/recommendation-action.js';
import { buildStudyPlan } from './application/build-study-plan.js';
import { buildReplanProposal, applyReplan, undoReplan } from './application/replan-study.js';
import {
  buildDailyPlanProposal,
  applyDailyPlanProposal,
  undoDailyPlanGeneration,
} from './application/planning/distribute-study-plan.js';
import { watchDailyExecutionDate } from './ui/controllers/daily-execution-controller.js';
import { createAchievementsController } from './ui/controllers/achievements-controller.js';
import { createExamImportService } from './application/subjects/exam-import-service.js';
import { createExamCatalogLoader } from './application/exams/exam-catalog-loader.js';
import { EXAM_TAGS, EXAM_SOURCES } from './domain/exams/exam-constants.js';
import {
  isCommonTopic,
  topicExamScopeLabel,
  normalizeExamTags,
} from './domain/exams/exam-scope.js';
import { setActiveExamTags } from './application/exams/exam-scope-transition.js';
import { createUiState, pickPersistentState } from './state/state-boundaries.js';
import { createTabRouter } from './ui/navigation/tab-router.js';
import { createAnalysisNavigationController } from './ui/navigation/analysis-navigation-controller.js';
import type { AppState } from './core/types.js';
import { createModalController } from './ui/controllers/modal-controller.js';
import { createDialogFeedback } from './ui/primitives/modal-dialogs.js';
import { createPreferencesController } from './ui/controllers/preferences-controller.js';
import { backupSummary } from './storage/backup-validator.js';
import {
  calculateSha256,
  rotateAutomaticBackup as rotateAutomaticBackupService,
  createBackupValidator,
  createBackupRestoreCoordinator,
} from './storage/backup-restore-controller.js';
import { createBackupModalController } from './ui/controllers/backup-modal-controller.js';
import { createRemoteSyncProvider } from './storage/remote-sync-provider.js';
import { createRemoteSyncController } from './ui/controllers/remote-sync-controller.js';
import { createErrorBoundaryController } from './ui/controllers/error-boundary-controller.js';
import { createDemoController } from './ui/controllers/demo-controller.js';
import { createStructuredImportController } from './features/structured-import/structured-import-controller.js';
import { renderStructuredImport } from './features/structured-import/structured-import-renderer.js';
import {
  parseStructuredStudyContent,
  createStructuredContentImportService,
} from './application/subjects/structured-content-import.js';
import { createQuestionImportService } from './application/questions/question-import-service.js';
import { createQuestionImportController } from './features/question-import/question-import-controller.js';
import { renderQuestionImport } from './features/question-import/question-import-renderer.js';
import {
  buildQuestionImportTemplate,
  QUESTION_IMPORT_TEMPLATE_FILE_NAME,
} from './features/question-import/question-import-template.js';
import { createApplicationRenderer } from './ui/renderers/application-renderer.js';
import { buildResultGoalsViewModel } from './application/goals/build-result-goals-view-model.js';
import { buildPeriodComparisonViewModel } from './application/analytics/build-period-comparison-view-model.js';
import { renderPeriodComparisonDetail } from './ui/renderers/period-comparison-detail-renderer.js';
import { buildWeeklyAvailability } from './application/goals/weekly-availability.js';
import { createGoalsBlueprintService } from './application/goals/goals-blueprint-service.js';
import { renderReadinessHistory } from './ui/renderers/readiness-history-renderer.js';
import { dismissAlert, reconcileAlerts } from './application/alert-lifecycle.js';
import { buildRecommendationCalibration } from './domain/analytics/recommendation-calibration.js';
import { renderRecommendationCalibrationModel } from './ui/renderers/recommendation-calibration-renderer.js';
import {
  APP_MODES,
  readAppMode,
  enterDemoMode,
  exitDemoMode,
  resetDemoMode,
} from './application/demo/demo-mode.js';
import { generateDemoData } from './demo/demo-generator.js';
import { createStateMigrator } from './state/migrations.js';
import { serializeBackup, backupFileName } from './storage/backup-service.js';
import { createGuidedTourController } from './ui/controllers/guided-tour-controller.js';
import {
  renderQuestionAnalyticsSummary,
  renderTopicQuestionPerformance,
  renderWeeklyQuestionTrend,
  renderQuestionErrorToolbar,
} from './ui/renderers/question-analytics-renderer.js';
import { buildPlanExecution } from './application/goals/build-plan-execution.js';
import { renderPlanExecution as renderPlanExecutionView } from './ui/renderers/plan-execution-renderer.js';
import { buildStudyDistribution } from './application/goals/build-study-distribution.js';
import { renderStudyDistribution } from './ui/renderers/study-distribution-renderer.js';
import { buildPlanImpactAlignment } from './application/goals/build-plan-impact-alignment.js';
import { renderPlanImpactAlignment } from './ui/renderers/plan-impact-alignment-renderer.js';
import { buildTopicExamProfile } from './application/exam-intelligence/build-topic-exam-profile.js';
import { resolveValidatedExamImpact } from './domain/exam-intelligence/validated-impact.js';
import { createSearchController } from './ui/controllers/search-controller.js';
import {
  renderIntelligentAlerts,
  renderExecutiveSummary as renderExecutiveSummaryView,
} from './ui/renderers/overview-renderer.js';
import { renderDiagnosisCenter as renderDiagnosisCenterView } from './ui/renderers/diagnosis-renderer.js';
import { renderTopicRetentionDashboard as renderTopicRetentionDashboardView } from './ui/renderers/retention-renderer.js';
import { createReportController } from './ui/controllers/report-controller.js';
import { createHelpController } from './ui/help/help-controller.js';
import { ERROR_CATEGORIES } from './domain/diagnostics/error-categories.js';
import { createTopicDiagnosisService } from './application/diagnostics/topic-diagnosis-service.js';
import { createStudyCandidateService } from './application/recommendations/study-candidate-service.js';
import { createApprovalReadinessService } from './application/analytics/approval-readiness-service.js';

const THEME_STORAGE_KEY = 'bb-premium-theme';
const MODE_FLASH_KEY = 'bb-premium-mode-message';
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
const TEST_MODE = new URLSearchParams(location.search).get('test') === '1';
const APP_MODE = TEST_MODE ? APP_MODES.REAL : readAppMode(globalThis.sessionStorage);
const IS_DEMO_MODE = APP_MODE === APP_MODES.DEMO;
const INSTANCE_ID = uid('instance');
let suppressBeforeUnloadSave = false;

const appClock = createClock();
const nowISO = () => appClock.nowISO();
const todayISO = () => appClock.today();

const preferencesController = createPreferencesController({
  document,
  storage: localStorage,
  key: THEME_STORAGE_KEY,
});
document.getElementById('themeToggleBtn')!.addEventListener('click', () =>
  preferencesController.toggle()
);
preferencesController.sync();

let state: AppState = createDefaultState();
const uiState = createUiState();

const { EXAM_PRESETS, ensureExamCatalog } = createExamCatalogLoader({
  document,
  window,
  buildVersion: __STUDYTRACK_BUILD_VERSION__,
});
uiState.onboarding.presetId = EXAM_PRESETS[0]?.id || null;

const appSelectors = createAppSelectors({
  getState: () => state,
  getToday: todayISO,
});
const {
  getSubjectById,
  getTopicById,
  getSubjectName,
  getTopicName,
  entitySubjectId,
  entitySubjectName,
  allTopics,
  activeSubjects,
  activeTopics,
  isActiveStudyReference,
  subjectsForSelection,
  topicsForSelection,
  diasParaRevisao,
  diasParaRevisaoPill,
  monthKey,
  monthLabel,
  collectMonthKeys,
  startOfWeek,
  isSameWeek,
  isSameMonth,
  addDays,
  formatDatePt,
  localDateISO,
} = appSelectors;
const localDateFromTimestamp = (v: any) => localDateISO(v);

const { migrateState, normalizeHistoryEvent } = createStateMigrator({
  nowISO,
  todayISO,
  toLocalDate: localDateFromTimestamp,
  errorCategoryKeys: Object.keys(ERROR_CATEGORIES),
});

let studyPlanPreview: any = null;
let dailyPlanPreview: any = null;
let currentStudyRecommendations: any[] = [];
let currentConsolidatedDiagnosis: any = null;
let masterRenderer: ReturnType<typeof createMasterRenderer>;
let todayTabController: ReturnType<typeof createTodayTabController>;
let studyRecommendationController: ReturnType<typeof createStudyRecommendationController>;
let onboardingModalController: ReturnType<typeof createOnboardingModalController>;
let dashboardTabController: ReturnType<typeof createDashboardTabController>;
let studyPlanBuilderController: ReturnType<typeof createStudyPlanBuilderController>;
let weeklyCloseModalController: ReturnType<typeof createWeeklyCloseModalController>;
let performanceTabController: ReturnType<typeof createPerformanceTabController>;
let simulationsTabController: any = null;

function ensureStateDefaults() {
  ensureStateDefaultsWithDeps({
    getState: () => state,
    setState: next => {
      state = next;
    },
    nowISO,
    todayISO,
    normalizeHistoryEvent,
    normalizeErrorBreakdown: q => questionsTabController.normalizeErrorBreakdown(q),
    refreshAllTopicReviewStats: () => subjectsTabController.refreshAllTopicReviewStats(),
  });
}

const {
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
  storageManager: StorageManager,
} = wireAppDependencies({
  dbName: DB_NAME,
  dbVersion: DB_VERSION,
  storeName: STORE_NAME,
  storageKey: STORAGE_KEY,
  demoStorageKey: DEMO_STORAGE_KEY,
  isDemoMode: IS_DEMO_MODE,
  getState: () => state,
  clock: appClock,
  idGenerator: uid,
  readLocal: repositoryReadLocalState,
  writeLocal: repositoryWriteLocalState,
  removeLocal: key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {}
  },
  sessionStorage: typeof sessionStorage !== 'undefined' ? sessionStorage : undefined,
  generateDemoData: () => generateDemoData({ today: appClock.today() }),
  getTopicById,
  evidenceScopeForTopic: topicId => studyMetricsSelectors.evidenceScopeForTopic(topicId),
  applyAdaptiveReviewRating: (current: any, rating: any, options: Record<string, any>) =>
    applyAdaptiveReviewRating(current, rating, options),
  addHistoryEvent: (type, sId, tId, meta) =>
    studyMetricsSelectors.addHistoryEvent(type, sId, tId, meta),
  entitySubjectId,
  refreshTopicReviewStats: topicId => subjectsTabController.refreshTopicReviewStats(topicId),
  buildStudyPlan,
  buildDailyPlanProposal,
  applyDailyPlanProposal,
  undoDailyPlanGeneration,
  buildReplanProposal,
  applyReplan,
  undoReplan,
  normalizeErrorBreakdown: q => questionsTabController.normalizeErrorBreakdown(q),
  completeRecommendationFeedback,
  measureRecommendationResults: session =>
    studyRecommendationController.measureRecommendationResults(session),
  currentStudyRecommendations: () => currentStudyRecommendations,
  parseLocalDate,
  allTopics,
  normalizeTopicStrategy,
  captureReadinessBeforeStrategy: reason =>
    approvalReadinessService.captureReadinessBeforeStrategy(reason),
  invalidatePlanPreview: () => {
    studyPlanPreview = null;
  },
  persistAndRender: () => persistAndRender(),
  renderSubjects: () => subjectsTabController.renderSubjects(),
  showToast: message => showToast(message),
  timestampToLocalDateISO: localDateFromTimestamp,
});

const modalController = createModalController({ document, window });
const dialogFeedback = createDialogFeedback({ document, modalController });
const flashSaved = (durationMs?: number) => dialogFeedback.flashSaved(durationMs);
const showToast = (message: string, durationMs?: number) =>
  dialogFeedback.showToast(message, durationMs);
const showConfirm = (
  message: string,
  onConfirm: (value?: any) => void,
  onCancel?: () => void,
  options: any = {}
) => dialogFeedback.showConfirm(message, onConfirm, onCancel, options);
const showPrompt = (
  message: string,
  options: Record<string, any>,
  onConfirm: (value?: any) => void,
  onCancel?: () => void
) => dialogFeedback.showPrompt(message, options, onConfirm, onCancel);

const sha256 = (value: any) => calculateSha256(value);
const rotateAutomaticBackup = (previousRaw: string | null, options: any = {}) =>
  rotateAutomaticBackupService(previousRaw, options, StorageManager);

const validateBackupData = createBackupValidator({
  ensureDefaults: candidate => {
    const previous = state;
    try {
      state = candidate;
      ensureStateDefaults();
    } finally {
      state = previous;
    }
  },
  migrateState,
  currentSchemaVersion: CURRENT_SCHEMA_VERSION,
});

const stateSyncCoordinator = createStateSyncCoordinator({
  instanceId: INSTANCE_ID,
  isDemoMode: IS_DEMO_MODE,
  storageKey: STORAGE_KEY,
  backupIndexKey: BACKUP_INDEX_KEY,
  modeFlashKey: MODE_FLASH_KEY,
  currentSchemaVersion: CURRENT_SCHEMA_VERSION,
  storageManager: StorageManager,
  readLocalState: (key = STORAGE_KEY) => appContext.storage.readLocal(key),
  writeLocalState: (value: any, key = STORAGE_KEY) => appContext.storage.writeLocal(key, value),
  validateBackupData,
  sha256,
  rotateAutomaticBackup,
  nowISO,
  getState: () => state,
  setState: next => {
    state = next;
  },
  ensureStateDefaults,
  observePlanningCapacity,
  restoreTimerFromState: () => studyTimerRuntime.restoreTimerFromState(),
  render: () => render(),
  flashSaved: () => flashSaved(),
  showToast,
});
const { appStateStore, scheduleSave, enqueueStateTransaction, loadState } = stateSyncCoordinator;

const studyMetricsSelectors = createStudyMetricsSelectors({
  getState: () => state,
  todayISO,
  addDays,
  isSameWeek,
  isSameMonth,
  startOfWeek,
  localDateFromTimestamp,
  getTopicById,
  getSubjectName,
  entitySubjectId,
  activeTopics,
  activeSubjects,
  metaHoursForDate: (date?: string) => goalsBlueprintService.metaHoursForDate(date),
  topicHistoryService,
});

const {
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
  uniqueTopicsCompletedBetween,
  contarTopicosConcluidosNoPeriodo,
  somarQuestoesNaSemana,
  contarSimuladosNaSemana,
  somarQuestoesDisciplinaNaSemana,
  computeWeeklyHistory,
  formatHoras,
  segundosEstudadosHoje,
  studyTimeByTopic,
  studySecondsByDate,
  validQuestionRecords,
  weeklyStrategyCapacity,
  planStartDate,
} = studyMetricsSelectors;

const topicDiagnosisService = createTopicDiagnosisService({
  getState: () => state,
  todayISO,
  addDays,
  startOfWeek,
  diasParaRevisao,
  localDateFromTimestamp,
  getTopicById,
  entitySubjectId,
  validQuestionRecords,
  normalizeErrorBreakdown: q => questionsTabController.normalizeErrorBreakdown(q),
  studyTimeByTopic,
  topicHistoryService,
});

const {
  subjectAccuracyTarget,
  getTopicPerformance,
  getSubjectTopicPerformance,
  buildErrorProfile,
  getSubjectWeeklyTrend,
  topicMasteryIndex,
  diagnoseTopic,
  topicRetentionScore,
  topicReviewHealthScore,
  taxaErroDisciplina,
  ultimaAtividadeDisciplina,
  diasSemEstudarDisciplina,
} = topicDiagnosisService;

const studyCandidateService = createStudyCandidateService({
  getState: () => state,
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
  getTopicDifficulty: topicId => reviewsTabController.getTopicDifficulty(topicId),
  taxaErroDisciplina,
  diasSemEstudarDisciplina,
  subjectAccuracyTarget,
  topicRetentionScore,
  topicMasteryIndex,
  topicReviewHealthScore,
  getSubjectWeeklyTrend,
  metaHoursToday: () => goalsBlueprintService.metaHoursToday(),
  uniqueTopicsCompletedBetween,
  getRevisoesUnificadas: () => calendarTabController.getRevisoesUnificadas(),
  getStudyPlanCandidates: () => studyPlanBuilderController.studyPlanCandidates(),
  isRendering: () => Boolean(masterRenderer?.isRendering()),
});

const {
  clearRenderCandidatesCache,
  intelligenceCandidates,
  computeStudyPriorities,
  motivoPrioridade,
  computeRitmo,
  revisoesAtrasadas,
  computeAlertasInteligentes,
} = studyCandidateService;

const approvalReadinessService = createApprovalReadinessService({
  getState: () => state,
  todayISO,
  nowISO,
  uid,
  addDays,
  diasParaRevisao,
  entitySubjectId,
  activeSubjects,
  examScopedTopics,
  examScopedRecords,
  examScopedSimulations,
  examEvidenceContext,
  simuladoEffectiveCounts: sim => simulationsTabController.simuladoEffectiveCounts(sim),
  simuladoNota: sim => simulationsTabController.simuladoNota(sim),
  getRevisoesUnificadas: () => calendarTabController.getRevisoesUnificadas(),
  computeRitmo,
  topicMasteryIndex,
  topicRetentionScore,
  subjectProgress,
  ultimaAtividadeDisciplina,
  studySecondsByDate,
  metaHoursForDate: date => goalsBlueprintService.metaHoursForDate(date),
  performanceScopedPlans: scope => performanceTabController.performanceScopedPlans(scope),
});

const {
  getMetricDataState,
  metricStateLabel,
  subjectRadarModel,
  computeApprovalMetrics,
  readinessResult,
  indiceProntidao,
  projectPerformance,
  recentPerformance,
  gerarDiagnosticoAprovacao,
  saveCurrentReadinessSnapshot,
  buildReadinessBeforeStrategySnapshot,
  captureReadinessBeforeStrategy,
} = approvalReadinessService;

const goalsBlueprintService = createGoalsBlueprintService({
  getState: () => state,
  todayISO,
  nowISO,
  diasParaRevisao,
  entitySubjectId,
  goalsService,
  subjectGoalService,
  captureReadinessBeforeStrategy,
  invalidatePlanPreview: () => {
    studyPlanPreview = null;
  },
  persistAndRender: () => persistAndRender(),
  scheduleSave,
  showToast,
});
const {
  metaHoursForDate,
  metaHoursToday,
  updateMetaHoursDay,
  updateExamBlueprint,
  updateExamSubject,
  addMetaDisciplina,
} = goalsBlueprintService;

createReportController({
  document,
  window,
  getState: () => state,
  nowISO,
  isDemo: IS_DEMO_MODE,
  getCandidates: intelligenceCandidates,
  getDiagnosis: generateDiagnosis,
  getReadiness: () => readinessResult(computeApprovalMetrics()),
  getForecast: projectPerformance,
});

const listViewState = {
  questionsVisible: DEFAULT_LIST_VISIBLE_ITEMS,
  simulationsVisible: DEFAULT_LIST_VISIBLE_ITEMS,
  sessionDaysVisible: DEFAULT_LIST_VISIBLE_ITEMS,
};
const LIST_VIEW_STEPS = {
  questions: DEFAULT_LIST_VISIBLE_ITEMS,
  simulations: DEFAULT_LIST_VISIBLE_ITEMS,
  sessionDays: DEFAULT_LIST_VISIBLE_ITEMS,
};
let performanceSubjectId: any = null;
let performanceViewMode = 'with-data';
const errorAnalysisView = { days: 30, topicId: '' };
let performanceVisible = DEFAULT_LIST_VISIBLE_ITEMS;
let retentionShowAll = false;
const retentionView: Record<string, any> = { subjectId: '', order: 'asc', confidence: 'all' };

const isMobileHistoryLayout = () => window.matchMedia('(max-width:850px)').matches;
const renderListViewFooter = (
  total: number,
  visible: number,
  step: number,
  showMoreAction: string,
  showLessAction: string,
  colspan: number,
  label: string
) =>
  renderCollectionFooter({
    total,
    visible,
    step,
    showMoreAction,
    showLessAction: visible > step ? showLessAction : '',
    colspan,
    label,
  });
function changeListLimit(key: string, delta: number, renderFn: () => void) {
  (listViewState as Record<string, any>)[`${key}Visible`] =
    delta > 0 ? Number.MAX_SAFE_INTEGER : DEFAULT_LIST_VISIBLE_ITEMS;
  renderFn();
}
function resetRecordListLimits() {
  Object.keys(LIST_VIEW_STEPS).forEach(key => {
    (listViewState as Record<string, any>)[`${key}Visible`] = DEFAULT_LIST_VISIBLE_ITEMS;
  });
  reviewsTabController.agendaUiState.upcomingVisible =
    reviewsTabController.agendaUiState.completedVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  dashboardTabController?.resetUpcomingListDefault();
  calendarTabController.calendarUiState.visible = DEFAULT_LIST_VISIBLE_ITEMS;
  performanceVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  retentionShowAll = false;
}

const tabRouter = createTabRouter({
  document,
  window,
  onRenderTab: tab => render(tab),
  onResetLists: resetRecordListLimits,
  trapModalTab: event =>
    trapModalTab(event, [
      document.getElementById('guidedOnboardingOverlay'),
      document.getElementById('structuredImportOverlay'),
      document.getElementById('examImportOverlay'),
      document.getElementById('examClassificationOverlay'),
      document.getElementById('reviewRatingOverlay'),
      document.getElementById('sessionModalOverlay'),
      document.getElementById('modalOverlay'),
    ]),
  onCancelReview: () => reviewsTabController.closeReviewRating(),
});
const activateTab = (tabName: string, updateHash = true) =>
  tabRouter.activateTab(tabName, updateHash);
const activeTabName = () => tabRouter.activeTabName();
createHelpController({ document, window, activateTab }).mount();

document
  .getElementById('examDateInput')!
  .addEventListener('change', function (this: HTMLInputElement) {
    updateExamBlueprint('examDate', this.value);
  });

const timerUiController = createTimerUiController({
  document,
  activeTabName,
  activateTab,
  renderTimerFocusContext: () => studyTimerRuntime.renderTimerFocusContext(),
  isTimerRunning: () => studyTimerRuntime.isTimerRunning(),
  getTopicById,
  subjectService,
});
timerUiController.bindKeyboardShortcuts();

const studyTimerRuntime = createStudyTimerRuntimeController({
  document,
  window,
  getState: () => state,
  nowISO,
  todayISO,
  uid,
  localDateFromTimestamp,
  escapeHtml,
  escapeAttr,
  getSubjectName,
  getTopicName,
  getSubjectById,
  getTopicById,
  subjectsForSelection,
  topicsForSelection,
  recommendationActionKind,
  intelligenceCandidates,
  getDailyExecutionItems: () => todayTabController.dailyExecutionController.build(),
  getCurrentStudyRecommendations: () => currentStudyRecommendations,
  guidedStudyService,
  sessionService,
  timerUiController,
  activeTabName,
  activateTab,
  scheduleSave,
  persistAndRender: () => persistAndRender(),
  renderPlanoHoje: () => todayTabController.renderPlanoHoje(),
  renderStudyRecommendation: () => studyRecommendationController.renderStudyRecommendation(),
  renderDiagnosisCenter: () => diagnosticsTabController.renderDiagnosisCenter(),
  addSimuladoRow: () => simulationsTabController.addSimuladoRow(),
  showToast,
  showConfirm,
});
studyTimerRuntime.bindEvents();

const backupRestoreCoordinator = createBackupRestoreCoordinator({
  getState: () => state,
  setState: next => {
    state = next;
  },
  ensureStateDefaults,
  restoreTimerFromState: () => studyTimerRuntime.restoreTimerFromState(),
  setPersistenceBlocked: blocked => stateSyncCoordinator.setPersistenceBlocked(blocked),
  isPersistenceBlocked: () => stateSyncCoordinator.isPersistenceBlocked(),
  persistAndRender: () => persistAndRender(),
  render: () => render(),
  showToast,
});

createBackupModalController({
  document,
  window,
  storage: {
    get: key => StorageManager.get(key),
    remove: key => appContext.storage.remove(key),
  },
  storageKeys: {
    storageKey: STORAGE_KEY,
    backupKey: BACKUP_KEY,
    backupIndexKey: BACKUP_INDEX_KEY,
    automaticSlots: AUTOMATIC_BACKUP_SLOTS,
  },
  sha256: sha256 as (text: string) => Promise<string>,
  validate: validateBackupData,
  serialize: serializeBackup,
  fileName: backupFileName,
  summary: backupSummary,
  getState: () => state,
  getDate: todayISO,
  notify: showToast,
  showConfirm,
  showPrompt,
  isDemoMode: () => IS_DEMO_MODE,
  onApplyBackup: backupRestoreCoordinator.applyImportedBackup,
  onResetComplete: () => {
    state = createDefaultState();
    ensureStateDefaults();
    suppressBeforeUnloadSave = true;
    location.reload();
  },
}).mount();

const remoteSyncProvider = createRemoteSyncProvider({
  fetch: window.fetch.bind(window),
  origin: location.origin,
});
createRemoteSyncController({
  document,
  window,
  provider: remoteSyncProvider,
  getState: () => pickPersistentState(state),
  validate: validateBackupData,
  describe: ({ normalized, version }: any) => backupSummary(normalized, version),
  confirm: showConfirm,
  createSnapshot: () => rotateAutomaticBackup(JSON.stringify(pickPersistentState(state))),
  onImported: backupRestoreCoordinator.applyImportedBackup,
  notify: showToast,
  isDisabled: () => IS_DEMO_MODE,
}).mount();

createDemoController({
  document,
  storage: sessionStorage,
  demoKey: DEMO_STORAGE_KEY,
  flashKey: MODE_FLASH_KEY,
  isDemo: IS_DEMO_MODE,
  getState: () => state,
  enterMode: enterDemoMode,
  resetMode: resetDemoMode,
  exitMode: exitDemoMode,
  confirm: showConfirm,
  reload: () => {
    suppressBeforeUnloadSave = true;
    appStateStore.cancelPendingSave();
    location.reload();
  },
  activateTab,
}).mount();

const achievementsController = createAchievementsController({
  document,
  getState: () => state,
  allTopics,
  activeSubjects,
  subjectProgress,
  computeStreak,
  getActivityDates,
  intelligenceCandidates,
  escapeHtml,
});

const guidedTourController = createGuidedTourController({
  document,
  window,
  activateTab,
  showToast,
});

const subjectSearchController = createSubjectSearchController({
  document,
  onChange: () => {
    subjectsTabController.subjectTopicLimits.clear();
    subjectsTabController.renderSubjects();
  },
});

const subjectsTabController = createSubjectsTabController({
  document,
  window,
  state,
  appContext,
  subjectService,
  topicHistoryService,
  topicStrategyController,
  subjectSearchController,
  persistAndRender: () => persistAndRender(),
  renderAll: () => renderAll(),
  showToast,
  showPrompt,
  showConfirm,
  activeSubjects,
  allTopics,
  getTopicById,
  getSubjectById,
  getTopicName,
  isCommonTopic,
  matchesSubjectSearch,
  subjectProgress,
  pluralize,
  renderCollectionFooter,
  topicMasteryIndex,
  topicRetentionScore,
  diagnoseTopic,
  topicReviewHealthScore,
  diasParaRevisao,
  localDateFromTimestamp,
  prerequisiteBlockers,
  needsMaintenance,
  evidenceScopeForTopic,
  entitySubjectId,
  startTimer: () => studyTimerRuntime.startTimer(),
  populateTimerContextControls: () => studyTimerRuntime.populateTimerContextControls(),
  openStudyTimerFocus: () => timerUiController.openStudyTimerFocus(),
  activeTabName,
  uid,
  nowISO,
  todayISO,
  escapeHtml,
  escapeAttr,
  EXAM_TAGS,
  STATUS_OPTIONS,
  STATUS_CLASS,
  DIFFICULTY_OPTIONS,
  DIFFICULTY_CLASS,
});

document.getElementById('addSubjectBtn')!.addEventListener('click', () =>
  subjectsTabController.addSubject()
);
document.getElementById('loadDefaultSubjectsBtn')!.addEventListener('click', () =>
  examImportModalController.openExamImport()
);
document.getElementById('verticalizedSyllabusToggleBtn')?.addEventListener('click', () => {
  subjectsTabController.setVerticalizedSyllabusActive(
    !subjectsTabController.isVerticalizedSyllabusActive()
  );
  subjectsTabController.renderSubjects();
});

const examImportService = createExamImportService({
  subjectService,
  getSubjects: () => state.subjects,
});
const structuredContentImportService = createStructuredContentImportService({
  subjectService,
  getSubjects: () => state.subjects,
});
let structuredImportOrigin: any = null;
const structuredImportController = createStructuredImportController({
  document,
  window,
  parse: parseStructuredStudyContent,
  service: structuredContentImportService,
  render: renderStructuredImport,
  notify: showToast,
  onOpen: () => {
    if (structuredImportOrigin === 'onboarding') onboardingModalController.suspendGuidedOnboarding();
  },
  onCancel: ({ completed }: any) => {
    if (structuredImportOrigin === 'onboarding') {
      onboardingModalController.resumeGuidedOnboarding(completed ? 'plan' : 'content');
      structuredImportOrigin = null;
    }
  },
  onImported: (result: Record<string, any>) => {
    studyPlanPreview = null;
    persistAndRender();
    showToast(
      `${pluralize(result.addedSubjects, 'disciplina')} e ${pluralize(result.addedTopics, 'tópico')} adicionados; ${pluralize(result.updatedTopics, 'tópico')} atualizados.`
    );
  },
});
document.getElementById('structuredContentImportBtn')?.addEventListener('click', () => {
  structuredImportOrigin = null;
});

createHistoricalExamImportController({
  document,
  getState: () => state,
  notify: showToast,
  onImported: (result: Record<string, any>) => {
    state.subjects = result.subjects;
    state.exams = result.exams;
    state.examQuestions = result.examQuestions;
    studyPlanPreview = null;
    persistAndRender();
  },
}).mount();

document.getElementById('downloadStructuredCsvBtn')?.addEventListener('click', () => {
  const csv =
      'disciplina,topico,dificuldade,importancia,esforco,tags\nPortuguês,Interpretação de texto,Médio,80,120,leitura|prioridade\n',
    blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
    url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = 'modelo-studytrack.csv';
  link.click();
  URL.revokeObjectURL(url);
});

const examImportModalController = createExamImportModalController({
  document,
  state,
  uiState,
  examImportService,
  EXAM_PRESETS,
  EXAM_SOURCES,
  EXAM_TAGS,
  ensureExamCatalog,
  topicExamScopeLabel,
  isCommonTopic,
  normalizeExamTags,
  setActiveExamTags,
  suspendGuidedOnboarding: () => onboardingModalController.suspendGuidedOnboarding(),
  resumeGuidedOnboarding: (step?: string) =>
    onboardingModalController.resumeGuidedOnboarding(step),
  activateTab,
  persistAndRender: () => persistAndRender(),
  showToast,
  pluralize,
  nowISO,
  escapeHtml,
  escapeAttr,
  examBadges: topic => subjectsTabController.examBadges(topic),
});
examImportModalController.mount();

const calendarTabController = createCalendarTabController({
  state,
  calendarService,
  clock: appClock,
  formatDatePt,
  entitySubjectId,
  entitySubjectName,
  getSubjectName,
  getTopicName,
  diasParaRevisao,
  diasParaRevisaoPill,
  activeSubjects,
  subjectsForSelection,
  collectMonthKeys: collectMonthKeys as (items: any[]) => string[],
  monthLabel,
  monthKey: monthKey as (date?: string) => string,
  showToast,
  showConfirm,
  persistAndRender: () => persistAndRender(),
  onCompleteAgendaReview: (id: string) => reviewsTabController.completeAgendaReview(id),
  isMobileHistoryLayout,
  renderCollectionFooter,
  escapeHtml,
  escapeAttr,
  pluralize,
  document,
});
calendarTabController.bindEvents();

const reviewsTabController = createReviewsTabController({
  state,
  reviewAgendaRepo: appContext.repositories.reviewAgenda,
  reviewService,
  diagnoseTopic,
  subjectAccuracyTarget,
  getTopicById,
  activeTopics,
  activeSubjects,
  subjectsForSelection,
  topicsForSelection,
  entitySubjectId,
  getSubjectName,
  getTopicName,
  formatDatePt,
  todayISO,
  nowISO,
  uid,
  addHistoryEvent,
  refreshTopicReviewStats: topicId => subjectsTabController.refreshTopicReviewStats(topicId),
  showToast,
  showConfirm,
  persistAndRender: () => persistAndRender(),
  monthKey: monthKey as (date?: string) => string,
  monthLabel,
  collectMonthKeys: collectMonthKeys as (items: any[]) => string[],
  diasParaRevisaoPill,
  renderGroupHeader,
  renderCollectionFooter,
  isMobileHistoryLayout,
  escapeHtml,
  escapeAttr,
  pluralize,
  document,
});
reviewsTabController.bindEvents();

const errorNotebookController = createErrorNotebookController({
  getState: () => state,
  getMount: () => document.getElementById('errorNotebookMount'),
  getMainContainer: () => document.getElementById('questionsMainContainer'),
  getToggleBtn: () => document.getElementById('errorNotebookToggleBtn'),
  getDueAgendaMount: () => document.getElementById('errorNotebookDueAgenda'),
  getDueTodayMount: () => document.getElementById('errorNotebookDueToday'),
  todayISO,
  nowISO,
  persistAndRender: () => persistAndRender(),
  showToast,
  activateTab,
});

const questionsTabController = createQuestionsTabController({
  document,
  window,
  state,
  listViewState,
  LIST_VIEW_STEPS,
  questionService,
  errorCategories: ERROR_CATEGORIES,
  errorNotebookController,
  renderQuestionAnalytics: () => questionAnalyticsController.renderQuestionAnalytics(),
  simulationEditController: {
    get state() {
      return (
        simulationsTabController?.simulationEditController?.state || {
          editingId: null,
          draft: null,
        }
      );
    },
  },
  openBreakdownIds: new Set<string>(),
  persistAndRender: () => persistAndRender(),
  showToast,
  showConfirm,
  formatDatePt,
  getSubjectName,
  getTopicName,
  entitySubjectId,
  activeSubjects,
  subjectsForSelection,
  topicsForSelection: (sId, tId) => topicsForSelection(sId, tId || null),
  renderListViewFooter,
  isMobileLayout: isMobileHistoryLayout,
  uid,
  todayISO,
  nowISO,
  escapeHtml,
  escapeAttr,
});

const questionAnalyticsController = createQuestionAnalyticsController({
  document,
  getPerformanceSubjectId: () => performanceSubjectId,
  setPerformanceSubjectId: id => {
    performanceSubjectId = id;
  },
  getPerformanceViewMode: () => performanceViewMode,
  setPerformanceViewMode: mode => {
    performanceViewMode = mode;
  },
  getPerformanceVisible: () => performanceVisible,
  getErrorAnalysisView: () => errorAnalysisView,
  validQuestionRecords,
  entitySubjectId,
  activeSubjects,
  activeTopics,
  getSubjectWeeklyTrend,
  calculateWeightedTrend,
  getSubjectTopicPerformance,
  topicMasteryIndex,
  renderQuestionAnalyticsSummary,
  renderTopicQuestionPerformance,
  renderWeeklyQuestionTrend,
  buildErrorProfile,
  renderQuestionErrorToolbar,
  buildErrorAnalysisViewModel,
  renderErrorAnalysis,
  renderCollectionFooter,
  formatDatePt,
  escapeHtml,
  escapeAttr,
  addDays,
  todayISO,
});

simulationsTabController = createSimulationsTabController({
  document,
  window,
  state,
  listViewState,
  LIST_VIEW_STEPS,
  simulationService,
  questionEditController: questionsTabController.questionEditController,
  openQuestionErrorIds: questionsTabController.openQuestionErrorIds,
  errorCategories: ERROR_CATEGORIES,
  persistAndRender: () => persistAndRender(),
  showToast,
  showConfirm,
  formatDatePt,
  activeSubjects,
  subjectsForSelection,
  topicsForSelection: (sId, tId) => topicsForSelection(sId, tId || null),
  renderListViewFooter,
  isMobileLayout: isMobileHistoryLayout,
  uid,
  todayISO,
  escapeHtml,
  escapeAttr,
});

document.getElementById('addQuestaoRowBtn')!.addEventListener('click', () =>
  questionsTabController.addQuestaoRow()
);
document.getElementById('errorNotebookToggleBtn')?.addEventListener('click', () => {
  errorNotebookController.toggle();
  questionsTabController.renderQuestoes();
});
document.getElementById('addSimuladoRowBtn')!.addEventListener('click', () =>
  simulationsTabController.addSimuladoRow()
);

const questionImportService = createQuestionImportService({
  subjectService,
  questionService,
  getSubjects: () => state.subjects,
  getQuestions: () => state.questoes,
  errorCategoryKeys: Object.keys(ERROR_CATEGORIES),
  today: todayISO,
  atomic: (task: () => any) => {
    const snapshot = structuredClone(pickPersistentState(state));
    try {
      return task();
    } catch (error: any) {
      Object.assign(state, snapshot);
      throw error;
    }
  },
});
createQuestionImportController({
  document,
  window,
  service: questionImportService,
  render: renderQuestionImport,
  notify: showToast,
  onImported: (result: Record<string, any>) => {
    studyPlanPreview = null;
    persistAndRender();
    showToast(
      `${pluralize(result.addedQuestionsCount, 'questão')} em ${pluralize(result.addedSessions, 'sessão')} importadas com sucesso.`
    );
  },
});
document.getElementById('downloadQuestionsCsvBtn')?.addEventListener('click', () => {
  const blob = new Blob(['\uFEFF' + buildQuestionImportTemplate(todayISO())], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = QUESTION_IMPORT_TEMPLATE_FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
});

const goalsTabController = createGoalsTabController({
  getState: () => state,
  document,
  parseLocalDate,
  todayISO,
  buildWeeklyAvailability,
  formatPlanMinutes,
  formatDecimal,
  metaHoursToday,
  metaHoursForDate,
  addDays,
  startOfWeek,
  WEEKDAY_LABELS,
  buildPlanExecution,
  buildStudyDistribution,
  buildPlanImpactAlignment,
  examScopedTopics,
  resolveValidatedExamImpact,
  buildTopicExamProfile,
  renderPlanExecutionView,
  renderStudyDistribution,
  renderPlanImpactAlignment,
  formatDatePt,
  escapeHtml,
  escapeAttr,
  entitySubjectId,
  buildResultGoalsViewModel,
  renderGoals,
  initialGoalSuggestions,
  weeklyStrategyCapacity,
  activeSubjects,
  getSubjectName,
  buildPeriodComparisonViewModel,
  renderPeriodComparisonDetail,
  localDateFromTimestamp,
  somarQuestoesDisciplinaNaSemana: (subjectId: string | null) =>
    subjectId ? somarQuestoesDisciplinaNaSemana(subjectId) : 0,
  computeRitmo,
});

function renderSelectedPeriodComparison() {
  const container = document.getElementById('periodComparisonResults');
  const preset = document.getElementById('periodComparisonPreset') as HTMLSelectElement | null;
  if (!container || !preset) return;
  goalsTabController.renderSelectedPeriodComparison(
    container,
    preset,
    document.getElementById('periodComparisonStart') as HTMLInputElement | null,
    document.getElementById('periodComparisonEnd') as HTMLInputElement | null,
    document.getElementById('periodComparisonStartWrap'),
    document.getElementById('periodComparisonEndWrap')
  );
}
document
  .getElementById('periodComparisonPreset')
  ?.addEventListener('change', renderSelectedPeriodComparison);
document
  .getElementById('periodComparisonStart')
  ?.addEventListener('change', renderSelectedPeriodComparison);
document
  .getElementById('periodComparisonEnd')
  ?.addEventListener('change', renderSelectedPeriodComparison);

function renderMetasSection() {
  const container = document.getElementById('metasContainer');
  if (container) {
    const hasAccuracyEvidence =
      state.questoes.some(item => Number(item.resolved) > 0) ||
      state.simulados.some(item => Number(item.total) > 0);
    goalsTabController.renderMetas(container, {
      weeklyTopics: contarTopicosConcluidosNoPeriodo(isSameWeek),
      monthlyTopics: contarTopicosConcluidosNoPeriodo(isSameMonth),
      questions: somarQuestoesNaSemana(),
      simulations: contarSimuladosNaSemana(),
      accuracy: hasAccuracyEvidence ? recentPerformance().current!.accuracy : null,
      studyDays: countStudyDaysThisWeek(state.studySessions, todayISO()),
    });
  }
  renderSelectedPeriodComparison();
}

document.getElementById('addMetaDisciplinaBtn')!.addEventListener('click', () => {
  const subjectId = (document.getElementById('novaMetaDisciplinaSelect') as HTMLSelectElement)
    .value;
  const rawMeta = (document.getElementById('novaMetaDisciplinaValor') as HTMLInputElement).value;
  addMetaDisciplina(subjectId, rawMeta);
});

const projectionController = createProjectionController({
  getExecutionContext: () => ({
    dailyPlans: state.dailyPlans,
    sessions: state.studySessions,
    subjects: state.subjects,
    capacityHistory: state.planningCapacityHistory,
    adherenceTarget: state.metas.aderenciaSemanal,
  }),
  getContext: (metrics = computeApprovalMetrics(), readiness = readinessResult(metrics)) => ({
    today: todayISO(),
    scope: examEvidenceContext(),
    metrics,
    readiness,
    examDate: state.examDate || null,
    targetScore: state.examBlueprint?.configuredAt
      ? state.examBlueprint.targetScore
      : state.metas.metaAprovacao,
    consistencyTarget: state.metas.consistenciaSemanal,
    snapshots: state.projectionSnapshots,
    activeExamTags: state.examBlueprint.activeExamTags || [],
  }),
  buildRecent: recentPerformance,
  getSimulations: () =>
    examScopedSimulations().map(item => ({
      ...item,
      ...simulationsTabController.simuladoEffectiveCounts(item),
      breakdown: (item.breakdown || []).map((row: any) => ({
        ...row,
        subjectId: entitySubjectId(row),
      })),
    })),
  countStudyDays: countStudyDaysThisWeek,
  getCandidates: intelligenceCandidates,
  getPlan: () => studyPlanBuilderController.latestStudyPlan(),
  getCapacity: weeklyStrategyCapacity,
  getAdaptiveHistory: () => state.adaptivePlanningHistory,
});
const currentAchievementProjection = (
  metrics = computeApprovalMetrics(),
  readiness = readinessResult(metrics),
  candidates: any[] | null = null
) => projectionController.current(metrics, readiness, candidates);

const recoveryController = createRecoveryController({
  getState: () => state,
  getPlan: () => studyPlanBuilderController.latestStudyPlan(),
  getActiveExamTags: () => state.examBlueprint.activeExamTags || [],
  getPreview: (trajectory: Record<string, any> | null) => projectionController.recovery(trajectory),
  isDisabled: () => IS_DEMO_MODE,
  services: {
    clock: appClock,
    idGenerator: uid,
    buildReadinessSnapshot: (_before: unknown, timestamp: string, reason: string) =>
      buildReadinessBeforeStrategySnapshot(reason, timestamp),
    commitState: createRecoveryStateCommitter({
      getState: () => state,
      publish: (value: any) => {
        Object.assign(state, value);
      },
      persist: async (serialized: string) =>
        !stateSyncCoordinator.isPersistenceBlocked() &&
        StorageManager.set(STORAGE_KEY, serialized),
      runExclusive: enqueueStateTransaction,
      clock: appClock,
      onCommitted: (value: any) => {
        flashSaved();
        stateSyncCoordinator.notifyRemoteState(
          JSON.stringify(pickPersistentState(value)),
          value.updatedAt
        );
      },
    }),
  },
});

function feedbackRecoveryResult(result: Record<string, any>) {
  if (result.status === 'rejected') {
    showToast(result.reason);
    return false;
  }
  studyPlanPreview = null;
  dailyPlanPreview = null;
  render('desempenho');
  weeklyCloseModalController.renderStudyTrack32Insights();
  studyPlanBuilderController.renderStudyPlanBuilder();
  approvalTabController.renderApprovalDashboard();
  showToast(
    result.status === 'applied'
      ? 'Plano de recuperação confirmado. A carga semanal foi preservada.'
      : 'A redistribuição foi revertida em uma nova versão do plano semanal. Atividades realizadas foram preservadas.'
  );
  return true;
}

const examMatrixController = createExamMatrixController({
  document,
  window,
  getState: () => state,
  examEvidenceContext,
  intelligenceCandidates,
  examScopedTopics,
  activeTopics,
  activeSubjects,
  currentAchievementProjection: () => currentAchievementProjection(),
  nowISO,
  idGenerator: uid,
  escapeHtml,
  escapeAttr,
  formatDatePt,
  showToast,
  persistAndRender: () => persistAndRender(),
  captureReadinessBeforeStrategy,
  invalidatePlanPreview: () => {
    studyPlanPreview = null;
  },
  resetRecordListLimits,
  getProgressiveLists: () => (globalThis as Record<string, any>).studytrackProgressiveLists,
  EXAM_TAGS,
  EXAM_SOURCES,
});
examMatrixController.bindEvents();

const subjectTargetEditorController = createSubjectTargetEditorController({
  document,
  getState: () => state,
  examEvidenceContext,
  examScopedSubjects,
  entitySubjectId,
  todayISO,
  nowISO,
  escapeHtml,
  escapeAttr,
  showToast,
  persistAndRender: () => persistAndRender(),
  captureReadinessBeforeStrategy,
  invalidatePlanPreview: () => {
    studyPlanPreview = null;
  },
});
subjectTargetEditorController.bindEvents();

const sessionHistoryController = createSessionHistoryController({
  state,
  sessionService,
  todayISO,
  addDays,
  formatDatePt: (iso?: string | null) => (iso ? formatDatePt(iso) : ''),
  formatDuration,
  entitySubjectId,
  getSubjectName: (id?: string | null) => (id ? getSubjectName(id) : ''),
  getTopicName: (id?: string | null) => (id ? getTopicName(id) : ''),
  getSubjectById,
  subjectsForSelection,
  isMobileHistoryLayout,
  showToast,
  showConfirm,
  persistAndRender: () => persistAndRender(),
  renderHeatmap: () => dashboardTabController.renderHeatmap(),
  escapeHtml,
  escapeAttr,
  pluralize,
  document,
});

function calculateStudyPlanPreview() {
  studyPlanBuilderController.calculateStudyPlanPreview();
  studyPlanPreview = studyPlanBuilderController.getStudyPlanPreview();
}
function confirmStudyPlan() {
  studyPlanBuilderController.confirmStudyPlan();
  studyPlanPreview = null;
  dailyPlanPreview = null;
}
function calculateDailyPlanPreview() {
  studyPlanBuilderController.calculateDailyPlanPreview();
  dailyPlanPreview = studyPlanBuilderController.getDailyPlanPreview();
}
function confirmDailyPlanPreview() {
  studyPlanBuilderController.confirmDailyPlanPreview();
  dailyPlanPreview = null;
}

const analysisNavigationController = createAnalysisNavigationController({
  document,
  getState: () => state,
  getTopicName,
  getSubjectName,
  escapeHtml,
  activeTabName,
  activateTab,
  getPerformanceViewState: () => performanceTabController.getViewState(),
  setPerformanceViewState: next => performanceTabController.setViewState(next),
  calculateStudyPlanPreview,
});
analysisNavigationController.bindEvents();

function refreshStudyRecommendationItems(opts?: any) {
  const result = studyRecommendationController.refreshStudyRecommendationItems(opts);
  currentStudyRecommendations = studyRecommendationController.getCurrentRecommendations();
  return result;
}

const diagnosticsTabController = createDiagnosticsTabController({
  document,
  getState: () => state,
  scheduleSave,
  todayISO,
  addDays,
  startOfWeek,
  formatPlanMinutes,
  escapeHtml,
  escapeAttr,
  pluralize,
  diasParaRevisao,
  computeAlertasInteligentes,
  computeApprovalMetrics,
  readinessResult,
  computeRitmo,
  computeStudyPriorities,
  motivoPrioridade,
  examScopedTopics,
  examScopedSubjects,
  uniqueTopicsCompletedBetween,
  buildExecutiveSummary,
  renderExecutiveSummaryView,
  reconcileAlerts,
  renderIntelligentAlerts,
  dismissAlert,
  refreshStudyRecommendationItems,
  examEvidenceContext,
  getStudyPlanPreview: () => studyPlanPreview,
  currentAchievementProjection,
  buildDiagnosisPageModel,
  renderDiagnosisCenterView,
  renderRecoveryReviewDebt,
  analyzeFocusAndEnergy,
  analysisContextBanner: dest => analysisNavigationController.analysisContextBanner(dest),
  renderNextBestAction,
  getDailyPriority: (action: any) =>
    todayTabController.dailyExecutionController.build(action)?.priority,
  renderPreparationSignals,
  buildDecisionCoherenceReport,
  renderDecisionCoherenceDebug,
  buildStudyAction,
  recommendationActionLabel,
  getCurrentStudyRecommendations: () => currentStudyRecommendations,
  setCurrentConsolidatedDiagnosis: diag => {
    currentConsolidatedDiagnosis = diag;
  },
  latestStudyPlan: () => studyPlanBuilderController.latestStudyPlan(),
  weeklyStrategyCapacity,
  locationSearch: () => location.search,
});

createDiagnosisController({
  document,
  refreshRecommendations: refreshStudyRecommendationItems,
  getRecommendations: () => currentStudyRecommendations,
  onStale: () => {
    showToast('A recomendação mudou. Atualize o diagnóstico antes de pré-visualizar.');
    diagnosticsTabController.renderDiagnosisCenter();
  },
  openPreview: calculateStudyPlanPreview,
  activateTab,
  requestFrame: requestAnimationFrame,
}).register();

const whatIfController = createWhatIfController({
  getContainer: () => document.getElementById('whatIfSimulatorMount'),
  getState: () => state,
  getCurrentMetrics: () => {
    const metrics = computeApprovalMetrics();
    const topics = activeTopics();
    const covered = topics.filter(
      t => t.status === 'Concluído' || t.status === 'Em andamento' || (t.completionCount ?? 0) > 0
    );
    return {
      readinessScore: readinessResult(metrics).value,
      weeklyStudyMinutes: weeklyStrategyCapacity(),
      totalTopicsCount: topics.length,
      coveredTopicsCount: covered.length,
    };
  },
});

todayTabController = createTodayTabController({
  formatPlanMinutes,
  formatDatePt,
  formatDuration,
  formatHoras,
  document,
  getState: () => state,
  getUiState: () => uiState,
  isDemoMode: () => IS_DEMO_MODE,
  todayISO,
  nowISO,
  uid,
  escapeHtml,
  escapeAttr,
  scheduleSave,
  showToast,
  activateTab,
  getSubjectName,
  getTopicName,
  motivoPrioridade,
  freezePlanExecution,
  metaHoursToday,
  hasStartedStudyTimer: () => studyTimerRuntime.hasStartedStudyTimer(),
  openStudyTimerFocus: () => timerUiController.openStudyTimerFocus(),
  startPlannedActivity: itemId => studyTimerRuntime.startPlannedActivity(itemId),
  openGuidedOnboarding: (opts?: any) => onboardingModalController.openGuidedOnboarding(opts),
  guidedTourController,
  whatIfController,
  latestStudyPlan: () => studyPlanBuilderController.latestStudyPlan(),
  weeklyStrategyCapacity,
  computeStudyPriorities,
  getCurrentStudyRecommendations: () => studyRecommendationController.getCurrentRecommendations(),
  refreshStudyRecommendationItems: (opts?: any) => refreshStudyRecommendationItems(opts),
  renderOverviewDecisionArea: () => studyRecommendationController.renderOverviewDecisionArea(),
  uniqueTopicsCompletedBetween,
  getRevisoesUnificadas: () => calendarTabController.getRevisoesUnificadas(),
  segundosEstudadosHoje,
  diasParaRevisao,
  startOfWeek,
});
todayTabController.bindEvents();

studyRecommendationController = createStudyRecommendationController({
  document,
  getState: () => state,
  metaHoursToday,
  intelligenceCandidates,
  todayISO,
  nowISO,
  uid,
  localDateISO,
  formatPlanMinutes,
  formatDatePt,
  escapeHtml,
  escapeAttr,
  pluralize,
  showToast,
  showPrompt,
  scheduleSave,
  renderRecommendationHistorySummary: () =>
    approvalTabController.renderRecommendationHistorySummary(),
  getTopicName,
  getSubjectName,
  getTopicById,
  getTopicPerformance,
  needsMaintenance,
  activeTopics,
  dailyExecutionController: {
    build: (action?: any) => todayTabController.dailyExecutionController.build(action),
  },
  hasStartedStudyTimer: () => studyTimerRuntime.hasStartedStudyTimer(),
  activeTimerMatchesRecommendation: rec => studyTimerRuntime.activeTimerMatchesRecommendation(rec),
  renderActiveStudyTimerNotice: rec => studyTimerRuntime.renderActiveStudyTimerNotice(rec),
  openStudyTimerFocus: () => timerUiController.openStudyTimerFocus(),
  topicResumeLabel: topicId => timerUiController.topicResumeLabel(topicId),
  guidedStudyService,
  todayDailyStudyPlan: () => todayTabController.todayDailyStudyPlan(),
  freezePlanExecution,
  startPlannedActivity: itemId => studyTimerRuntime.startPlannedActivity(itemId),
  addQuestaoRow: (initial?: any) => questionsTabController.addQuestaoRow(initial),
  activateTab,
  reviewService,
  completeAgendaReview: id => reviewsTabController.completeAgendaReview(id),
  validQuestionRecords,
  renderFinalStretchBanner: () => todayTabController.renderFinalStretchBanner(),
  renderAlertasInteligentes: () => diagnosticsTabController.renderAlertasInteligentes(),
  renderPlanoHoje: () => todayTabController.renderPlanoHoje(),
  replanService,
  planningRepository,
  metaHoursForDate,
  startOfWeek,
  addDays,
  diasParaRevisao,
  localDateFromTimestamp,
});

onboardingModalController = createOnboardingModalController({
  document,
  getState: () => state,
  getUiState: () => uiState,
  isDemoMode: () => IS_DEMO_MODE,
  ensureExamCatalog,
  showToast,
  escapeHtml,
  escapeAttr,
  formatPlanMinutes,
  todayISO,
  examPresets: EXAM_PRESETS,
  difficultyOptions: DIFFICULTY_OPTIONS,
  subjectService,
  getSubjectById,
  activeSubjects,
  scheduleSave,
  persistAndRender: () => persistAndRender(),
  buildStudyPlanProposal: (opts?: any) =>
    studyPlanBuilderController.buildCurrentStudyPlanProposal(opts),
  calculateStudyPlanPreview,
  getStudyPlanPreview: () => studyPlanPreview,
  confirmStudyPlan,
  calculateDailyPlanPreview,
  getDailyPlanPreview: () => dailyPlanPreview,
  confirmDailyPlanPreview,
  render: () => render(),
  activateTab,
  syncModalShell: () => shellUiController?.syncModalShell(),
  openExamImport: (presetId: string, source: string) =>
    examImportModalController.openExamImport(presetId, source),
  onStructuredImport: () => {
    structuredImportOrigin = 'onboarding';
    structuredImportController.choose();
  },
  updateExamBlueprint: (field: string, val: any, opts?: any) =>
    updateExamBlueprint(field as any, val, opts),
  updateMetaHoursDay: (day: string, hours: string, opts?: any) =>
    updateMetaHoursDay(day, hours, opts),
});

const shellUiController = createShellUiController({
  document,
  window,
  activateTab,
  getState: () => state,
  scheduleSave,
  persistAndRender: () => persistAndRender(),
  renderPlanoHoje: () => todayTabController.renderPlanoHoje(),
  guidedTourController,
  dismissFirstSteps: () => todayTabController.dismissFirstSteps(),
  restoreFirstSteps: () => todayTabController.restoreFirstSteps(),
  renderFirstStepsMissionCard: () => todayTabController.renderFirstStepsMissionCard(),
  showToast,
  onboardingController: onboardingModalController,
});
shellUiController.initStickyHeaderAndOverviewNav();

createSearchController({
  document,
  window,
  getState: () => state,
  activateTab,
  showToast,
  openExamImport: (preset?: any, origin?: any) =>
    examImportModalController.openExamImport(preset, origin),
  getRecommendations: () => currentStudyRecommendations,
  onExecuteRecommendation: id => studyRecommendationController.executeStudyRecommendation(id),
  jumpToTopic: (sId, tId) => shellUiController.jumpToTopic(sId, tId),
  escapeHtml,
  escapeAttr,
}).mount();

const approvalTabController = createApprovalTabController({
  document,
  getState: () => state,
  todayISO,
  nowISO,
  uid,
  escapeHtml,
  escapeAttr,
  formatDatePt,
  formatPlanMinutes,
  scheduleSave,
  computeApprovalMetrics,
  readinessResult,
  classifyApprovalScore,
  projectPerformance,
  examScopedSimulations,
  simuladoEffectiveCounts: sim => simulationsTabController.simuladoEffectiveCounts(sim),
  entitySubjectId,
  currentAchievementProjection,
  intelligenceCandidates,
  activeTopics,
  activeSubjects,
  allTopics,
  renderCollectionFooter,
  renderReadinessOverview,
  renderReadinessHistory,
  renderTopicRetentionDashboardView,
  captureProjection,
  captureAchievementProjection,
  buildProjectionCalibration,
  getMetricDataState,
  metricStateLabel,
  gerarDiagnosticoAprovacao,
  buildRecommendationCalibration,
  renderRecommendationCalibrationModel,
  buildRecommendationOutcomeAudit,
  renderRecommendationOutcomeAudit,
  buildRecommendationFollowup,
  renderRecommendationFollowup,
  summarizeRecommendationHistory,
  renderRecommendationHistory,
  topicRetentionScore,
  topicReviewHealthScore,
  topicMasteryIndex,
  onRenderStudyTrack32Insights: () => weeklyCloseModalController.renderStudyTrack32Insights(),
  getRetentionView: () => retentionView,
  isRetentionShowAll: () => retentionShowAll,
});

dashboardTabController = createDashboardTabController({
  document,
  window,
  getState: () => state,
  todayISO,
  parseLocalDate,
  addDays,
  formatDecimal,
  formatDatePt,
  formatDuration,
  pluralize,
  escapeHtml,
  escapeAttr,
  recentPerformance,
  projectPerformance,
  revisoesAtrasadas,
  diasParaRevisao,
  activateTab,
  renderAgenda: () => reviewsTabController.renderAgenda(),
  getActivityDates,
  getGoalDates,
  getDailyStudySummary,
  heatmapMetricLevel,
  computeStreak,
  activeSubjects,
  activeTopics,
  subjectProgress,
  entitySubjectName,
  getTopicName,
  readinessResult,
  computeApprovalMetrics,
  recordProgressSnapshot: pct => performanceTabController.recordProgressSnapshot(pct),
  selectSessionHistoryDate: date => sessionHistoryController.selectSessionHistoryDate(date),
  planStartDate,
});

studyPlanBuilderController = createStudyPlanBuilderController({
  document,
  window,
  getState: () => state,
  studyPlanService,
  dailyPlanService,
  recoveryController,
  intelligenceCandidates,
  getTopicById,
  getTopicName,
  getSubjectName,
  todayISO,
  nowISO,
  addDays,
  diasParaRevisao,
  formatDatePt,
  formatPlanMinutes,
  pluralize,
  escapeHtml,
  escapeAttr,
  metaHoursForDate,
  uid,
  showToast,
  scheduleSave,
  renderPlanoHoje: () => todayTabController?.renderPlanoHoje(),
  captureReadinessBeforeStrategy,
  readinessResult,
  computeApprovalMetrics,
  currentAchievementProjection,
  examEvidenceContext,
  analysisContextBanner: dest => analysisNavigationController.analysisContextBanner(dest),
  feedbackRecoveryResult,
});

weeklyCloseModalController = createWeeklyCloseModalController({
  document,
  window,
  getState: () => state,
  planningRepository,
  examEvidenceContext,
  intelligenceCandidates,
  getSubjectName,
  getTopicName,
  todayISO,
  nowISO,
  addDays,
  diasParaRevisao,
  formatPlanMinutes,
  escapeHtml,
  escapeAttr,
  uid,
  showToast,
  showConfirm,
  scheduleSave,
  renderApprovalDashboard: () => approvalTabController?.renderApprovalDashboard(),
  renderPlanoHoje: () => todayTabController?.renderPlanoHoje(),
  saveCurrentReadinessSnapshot,
  captureReadinessBeforeStrategy,
  readinessResult,
  computeApprovalMetrics,
  currentAchievementProjection,
  examScopedSimulations,
  allTopics,
});

performanceTabController = createPerformanceTabController({
  document,
  window,
  getState: () => state,
  todayISO,
  formatDatePt,
  formatDecimal,
  escapeHtml,
  escapeAttr,
  examEvidenceContext,
  examScopedSubjects,
  examScopedSimulations,
  currentAchievementProjection,
  achievementProjectionHistory,
  recoveryController,
  readinessResult,
  computeApprovalMetrics,
  intelligenceCandidates,
  entitySubjectId,
  simuladoEffectiveCounts: sim => simulationsTabController.simuladoEffectiveCounts(sim),
  localDateFromTimestamp,
  topicMasteryIndex,
  topicRetentionScore,
  buildTopicExamProfile,
  topicHistoryService,
  analysisContextBanner: dest => analysisNavigationController.analysisContextBanner(dest),
  renderExamIntelligenceSection: () => examMatrixController.renderExamIntelligenceSection(),
  projectionController,
  renderProjectionScenarioResult,
  applyConfirmedRecoveryPlan: async (sig: string) =>
    feedbackRecoveryResult(await recoveryController.apply(sig)),
  render: tab => render(tab),
  activateTab,
  activeSubjects,
  subjectRadarModel,
});
performanceTabController.registerController();

registerDelegatedActions({
  document,
  window,
  todayISO,
  parseLocalDate,
  showToast,
  activateTab,
  controllers: {
    dashboard: dashboardTabController,
    studyPlan: studyPlanBuilderController,
    weeklyClose: weeklyCloseModalController,
    performance: performanceTabController,
    subjects: subjectsTabController,
    questions: questionsTabController,
    simulations: simulationsTabController,
    calendar: calendarTabController,
    reviews: reviewsTabController,
    today: todayTabController,
    recommendations: studyRecommendationController,
    onboarding: onboardingModalController,
    examMatrix: examMatrixController,
    timerUi: timerUiController,
    diagnostics: diagnosticsTabController,
    approval: approvalTabController,
    goals: goalsTabController,
    sessionHistory: sessionHistoryController,
  },
  customHandlers: {
    advanceGuidedStrategy: () => studyTimerRuntime.advanceGuidedStrategy(),
    changeUpcomingLimit: (delta: number) => dashboardTabController.changeUpcomingLimit(delta),
    showAllUpcoming: () => dashboardTabController.showAllUpcoming(),
    resetUpcomingLimit: () => dashboardTabController.resetUpcomingLimit(),
    setPerformanceViewMode: (mode: string) => {
      performanceViewMode = ['with-data', 'insufficient', 'without-data', 'all'].includes(mode)
        ? mode
        : 'with-data';
      performanceVisible = DEFAULT_LIST_VISIBLE_ITEMS;
      questionAnalyticsController.renderQuestionAnalytics();
    },
    setErrorAnalysisFilter: (field: string, value: any) => {
      if (field === 'days' && [7, 30, 60, 90].includes(Number(value)))
        errorAnalysisView.days = Number(value);
      if (field === 'topicId') errorAnalysisView.topicId = value || '';
      questionAnalyticsController.renderQuestionAnalytics();
    },
    changePerformanceLimit: (_delta: number) => {
      performanceVisible = Number.MAX_SAFE_INTEGER;
      questionAnalyticsController.renderQuestionAnalytics();
    },
    showAllPerformance: () => {
      performanceVisible = Number.MAX_SAFE_INTEGER;
      questionAnalyticsController.renderQuestionAnalytics();
    },
    resetPerformanceLimit: () => {
      performanceVisible = DEFAULT_LIST_VISIBLE_ITEMS;
      questionAnalyticsController.renderQuestionAnalytics();
    },
    showAllRetention: () => {
      retentionShowAll = true;
      approvalTabController.renderTopicRetentionDashboard();
    },
    resetRetentionLimit: () => {
      retentionShowAll = false;
      approvalTabController.renderTopicRetentionDashboard();
    },
    setRetentionFilter: (field: string, value: any) => {
      if (field in retentionView) retentionView[field] = value;
      retentionShowAll = false;
      approvalTabController.renderTopicRetentionDashboard();
    },
    updateExamSubject,
  },
  specialConfig: {
    onSetPerformanceSubject: value => {
      performanceSubjectId = value;
    },
    renderQuestionAnalytics: () => questionAnalyticsController.renderQuestionAnalytics(),
    getListViewSteps: () => LIST_VIEW_STEPS,
    getListViewState: () => listViewState,
    changeListLimit,
    getRenderers: () => ({
      renderQuestoes: () => questionsTabController.renderQuestoes(),
      renderSimulados: () => simulationsTabController.renderSimulados(),
      renderStudySessionsHistory: () => sessionHistoryController.renderStudySessionsHistory(),
    }),
  },
});

const errorBoundary = createErrorBoundaryController({ document, onRetry: () => render('active') });
const applicationRenderer = createApplicationRenderer({
  sections: buildRenderSections({
    renderPerformance: () => performanceTabController.renderPerformance(),
    renderKPIs: () => dashboardTabController.renderKPIs(),
    renderGuidedOnboarding: () => onboardingModalController.renderGuidedOnboarding(),
    renderOverviewDecisionArea: () => studyRecommendationController.renderOverviewDecisionArea(),
    renderApprovalDashboard: () => approvalTabController.renderApprovalDashboard(),
    populateTimerContextControls: () => studyTimerRuntime.populateTimerContextControls(),
    renderHeader: () => dashboardTabController.renderHeader(),
    renderProgressChart: () => performanceTabController.renderProgressChart(),
    renderBadges: () => achievementsController.render(),
    renderRadarDisciplinas: () => performanceTabController.renderRadarDisciplinas(),
    renderDashboard: () => dashboardTabController.renderDashboard(),
    renderStudySessionsHistory: () => sessionHistoryController.renderStudySessionsHistory(),
    renderSubjects: () => subjectsTabController.renderSubjects(),
    renderCalIndicadores: () => calendarTabController.renderCalIndicadores(),
    renderCalTarefasHoje: (elId?: string) => calendarTabController.renderCalTarefasHoje(elId),
    renderCalAtrasadas: (elId?: string) => calendarTabController.renderCalAtrasadas(elId),
    renderCalendarFilters: () => calendarTabController.renderCalendarFilters(),
    renderCalendar: () => calendarTabController.renderCalendar(),
    renderMonthCalendar: () => calendarTabController.renderMonthCalendar(),
    renderAgendaFilters: () => reviewsTabController.renderAgendaFilters(),
    renderAgenda: () => reviewsTabController.renderAgenda(),
    renderErrorNotebookDueNotices: () => errorNotebookController.renderDueNotices(),
    renderQuestoes: () => questionsTabController.renderQuestoes(),
    renderQuestionAnalytics: () => questionAnalyticsController.renderQuestionAnalytics(),
    renderSimulados: () => simulationsTabController.renderSimulados(),
    renderMetas: renderMetasSection,
    renderPlanExecution: () => {
      const container = document.getElementById('planExecutionResults');
      if (container) goalsTabController.mountPlanExecution(container);
    },
    renderExamBlueprintConfig: () => examMatrixController.renderExamBlueprintConfig(),
    renderStudyPlanBuilder: () => studyPlanBuilderController.renderStudyPlanBuilder(),
    renderWeeklyHoursGoals: () => {
      const container = document.getElementById('weeklyHoursGoals');
      if (container) goalsTabController.mountWeeklyAvailability(container);
    },
    renderSubjectTargetEditor: () => subjectTargetEditorController.renderSubjectTargetEditor(),
    renderMetasPorDisciplina: () => {
      const container = document.getElementById('metasPorDisciplinaContainer');
      if (!container) return;
      const sel = document.getElementById('novaMetaDisciplinaSelect') as HTMLSelectElement | null;
      goalsTabController.renderMetasPorDisciplina(container, sel);
    },
    renderHistoricoMetas: () => {
      const container = document.getElementById('historicoMetasContainer');
      if (container) goalsTabController.renderHistoricoMetas(container, computeWeeklyHistory(8));
    },
    renderRitmo: () => goalsTabController.renderRitmo(),
    renderExecutiveSummary: () => diagnosticsTabController.renderExecutiveSummary(),
    renderDiagnosisCenter: () => diagnosticsTabController.renderDiagnosisCenter(),
    renderStudyRecommendation: () => studyRecommendationController.renderStudyRecommendation(),
    renderWeeklyReplan: () => studyRecommendationController.renderWeeklyReplan(),
    renderSimuladosPlanejados: () => todayTabController.renderSimuladosPlanejados(),
    renderMetasHoje: () => todayTabController.renderMetasHoje(),
    renderAlertasInteligentes: () => diagnosticsTabController.renderAlertasInteligentes(),
    renderPlanoHoje: () => todayTabController.renderPlanoHoje(),
    renderDailyExecutionCard: () => todayTabController.renderDailyExecutionCard(),
  }),
  scopes: RENDER_SCOPE_SECTIONS,
  globalSections: ['indicadores', 'cabeçalho', 'execução diária'],
  getActiveScope: activeTabName,
  afterRender: labelDynamicControls,
  onError: (error: unknown, name: string) => errorBoundary.report(error, name),
});

masterRenderer = createMasterRenderer({
  applicationRenderer,
  getActiveTabName: activeTabName,
  renderStudyTrack32Insights: () => weeklyCloseModalController.renderStudyTrack32Insights(),
  errorBoundary,
  scheduleSave,
  onRenderFinish: clearRenderCandidatesCache,
});

const render = (scope = 'all') => masterRenderer.render(scope);
const persistAndRender = () => masterRenderer.persistAndRender();
const renderAll = () => masterRenderer.renderAll();

watchDailyExecutionDate({ document, window, getToday: todayISO, onChange: () => render('active') });

tabRouter.registerShortcuts();
onboardingModalController.bindEvents();
shellUiController.registerShellEvents();

setupApplicationLifecycle({
  window,
  document,
  isTestMode: TEST_MODE,
  canSaveBeforeUnload: () =>
    !suppressBeforeUnloadSave &&
    !stateSyncCoordinator.isPersistenceBlocked() &&
    !appStateStore.isTransactionActive(),
  onPersistLocal: () =>
    appContext.storage.writeLocal(STORAGE_KEY, JSON.stringify(pickPersistentState(state))),
  onResponsiveChange: () => {
    questionsTabController.renderQuestoes();
    simulationsTabController.renderSimulados();
    sessionHistoryController.renderStudySessionsHistory();
    reviewsTabController.renderAgenda();
    calendarTabController.renderCalendar();
  },
});

calendarTabController.setCalendarMobileView('month');
const activateInitialTab = () => tabRouter.activateInitialTab();
const pristineTestState = TEST_MODE ? structuredCloneSafe(state) : null;

bootstrapAppRuntime({
  isTestMode: TEST_MODE,
  context: appContext,
  loadState,
  activateInitialTab,
  testBridgeConfig: TEST_MODE
    ? createTestBridgeConfig({
        window,
        document,
        appMode: APP_MODE,
        isDemoMode: IS_DEMO_MODE,
        pristineTestState,
        getState: () => state,
        setState: next => {
          state = next;
        },
        migrateState,
        ensureStateDefaults,
        restoreTimerFromState: () => studyTimerRuntime.restoreTimerFromState(),
        refreshTimerDisplay: () => studyTimerRuntime.refreshTimerDisplay(),
        getConsolidatedDiagnosis: () => currentConsolidatedDiagnosis,
        settleSaves: () => appStateStore.settleSaves(),
        validateBackupData,
        startOfWeek,
        isSameWeek,
        addDays,
        diasParaRevisao,
        todayISO,
        localDateFromTimestamp,
        adaptiveReviewSuggestion: (topicId, baseDays, baseDate) =>
          reviewsTabController.adaptiveReviewSuggestion(topicId, baseDays, baseDate),
        syncQuestionFromStudySession: session =>
          sessionHistoryController.syncQuestionFromStudySession(session),
        getSubjectDependencies: sId => subjectsTabController.getSubjectDependencies(sId),
        getTopicDependencies: tId => subjectsTabController.getTopicDependencies(tId),
        computeApprovalMetrics,
        indiceProntidao,
        readinessResult,
        computeStudyPriorities,
        topicRetentionScore,
        topicMasteryIndex,
        intelligenceCandidates,
        studyPlanCandidates: opts => studyPlanBuilderController.studyPlanCandidates(opts),
        renderAll,
        render,
        activateInitialTab,
        sha256,
        rotateAutomaticBackup,
        StorageManager,
        whatIfController,
        renderVerticalizedSyllabus: () => subjectsTabController.renderVerticalizedSyllabus(),
        errorNotebookController,
      })
    : undefined,
});

setupProgressiveNavigation({
  document,
  window,
  onNavigateReset: () => resetRecordListLimits(),
});
