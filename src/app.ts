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
import {
  performanceConfidence,
  classifyAccuracy as classifyAccuracyTarget,
  calculateTopicPerformance,
  calculateSubjectPerformanceCounts,
  calculateTopicErrorRate,
  calculateSubjectWeeklyTrend,
  calculateTopicWeeklyTrend,
  calculateWeightedTrend,
  calculateDominantTopicError,
} from './domain/analytics/topic-performance.js';
import { createWhatIfController } from './ui/controllers/what-if-controller.js';
import { buildFinalStretchBanner } from './domain/planning/final-stretch-policy.js';
import { simulateWhatIfScenario } from './domain/forecasts/what-if-simulator.js';
import { identifyVolatileTopics } from './domain/analytics/volatile-mastery.js';
import { parseRawSyllabusText } from './application/subjects/raw-syllabus-parser.js';
import {
  buildStudyCycleQueue,
  getCurrentCycleBlock,
  advanceStudyCycleQueue,
  peekUpcomingCycleBlocks,
} from './domain/planning/study-cycle-engine.js';
import { analyzeFocusAndEnergy } from './domain/analytics/focus-energy-analytics.js';
import { createErrorNotebookController } from './ui/controllers/error-notebook-controller.js';
import { resolveEntitlements } from './domain/billing/entitlements.js';
import { createCloudSaaSProvider } from './storage/cloud-saas-provider.js';
import { loadPersistedState } from './state/load-persisted-state.js';
import {
  computeTimerSeconds,
  hasActiveTimer,
  activeTimerMatchesRecommendation as activeTimerMatchesRecommendationModule,
  renderActiveStudyTimerNoticeHtml,
  advanceGuidedStrategyStep,
} from './ui/controllers/timer-controller.js';
import {
  formatTimer,
  findDailyPlanItem as findDailyPlanItemCoordinator,
  releaseActivePlanItem as releaseActivePlanItemCoordinator,
  buildCompletedSessionRecord,
} from './application/sessions/timer-coordinator.js';
import { createTimerUiController } from './ui/controllers/timer-ui-controller.js';
import { announceTimerEvent } from './ui/primitives/a11y.js';
import { createSessionModalController } from './ui/controllers/session-modal-controller.js';
import { createStudyTimerViewController } from './ui/controllers/study-timer-view-controller.js';
import { formatDuration, formatPlanMinutes } from './core/format-duration.js';
import { initialGoalSuggestions } from './domain/goals/initial-goal-guidance.js';
import { freezePlanExecution } from './domain/planning/plan-execution-snapshot.js';
import { buildDiagnosisPageModel } from './application/diagnostics/build-diagnosis-page-model.js';
import { buildDecisionCoherenceReport } from './application/diagnostics/build-decision-coherence-report.js';
import { renderDecisionCoherenceDebug } from './ui/renderers/decision-coherence-debug-renderer.js';
import { renderPreparationSignals } from './ui/renderers/preparation-signals-renderer.js';
import { resolveSubjectAccuracyTarget } from './domain/analytics/subject-accuracy-target.js';
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
import { buildCalibratedScoreProjection } from './domain/forecasts/calibrated-score-projection.js';
import {
  resolvePerformanceRange,
  updatePerformanceViewState,
} from './application/performance/performance-view-state.js';
import { buildPerformanceOverview } from './application/performance/build-performance-overview.js';
import { countStudyDaysThisWeek } from './application/performance/study-day-count.js';
import { renderProjectionScenarioResult } from './ui/performance/achievement-projection-renderer.js';
import { createDiagnosisController } from './ui/controllers/diagnosis-controller.js';
import { createProjectionController } from './ui/controllers/projection-controller.js';
import { normalizeAdherenceTarget } from './application/adherence/adherence-target.js';
import { renderGoals } from './ui/renderers/goals-renderer.js';
import { createRecoveryController } from './ui/controllers/recovery-controller.js';
import { createRecoveryStateCommitter } from './application/recovery/recovery-state-committer.js';
import { renderNextBestAction } from './ui/renderers/next-best-action-renderer.js';
import {
  createAnalysisContext,
  analysisContextInScope,
} from './application/navigation/analysis-context.js';
import { createExamMatrixController } from './ui/tabs/goals/exam-matrix-controller.js';
import { createSubjectTargetEditorController } from './ui/tabs/goals/subject-target-editor-controller.js';
import { renderRecoveryReviewDebt } from './ui/renderers/recovery-review-debt-renderer.js';
import { DEFAULT_LIST_VISIBLE_ITEMS, mountProgressiveLists } from './ui/progressive-list.js';
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
  isPlainObject,
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
import { formatDateBR } from './core/format-date.js';
import { formatDecimal } from './core/format-number.js';
import { parseLocalDate } from './core/date-utils.js';
import { bootstrapApplication } from './bootstrap/bootstrap-application.js';
import { registerApplicationLifecycle } from './bootstrap/register-lifecycle.js';
import { wireAppDependencies } from './bootstrap/wire-dependencies.js';
import { createMasterRenderer } from './bootstrap/master-renderer.js';
import { registerMobileInputVisibility } from './ui/mobile-input-visibility.js';
import {
  REVIEW_RATINGS,
  calculateAdaptiveInterval,
  createAdaptiveReviewState,
  applyAdaptiveReviewRating,
} from './domain/reviews.js';
import { createDefaultState } from './state/defaults.js';
import { EXAM_INTELLIGENCE_VERSION } from './domain/exam-intelligence/config.js';
import { createHistoricalExamImportController } from './features/exam-intelligence-import/exam-import-controller.js';
import { labelDynamicControls, trapModalTab } from './ui/accessibility.js';
import { renderCollectionFooter, renderGroupHeader } from './ui/list-components.js';
import { calculateReadinessScore, READINESS_WEIGHTS } from './domain/analytics/readiness-score.js';
import { calculateTopicCoverage } from './domain/analytics/coverage.js';
import { calculateGoalConsistency } from './domain/analytics/consistency.js';
import {
  calculateCoverageRhythm,
  calculateOverdueReviewsCount,
} from './domain/planning/rhythm-estimator.js';
import {
  classifyApprovalScore,
  calculateApprovalSimuladosMetric,
  calculateApprovalAcertosMetric,
  calculateApprovalEditalMetric,
  calculateApprovalDominioMetric,
  calculateApprovalRevisoesMetric,
  calculateApprovalTendenciaMetric,
  calculateApprovalPrazoMetric,
  calculateApprovalConhecimentoMetric,
  calculateApprovalRetencaoMetric,
  calculateApprovalConsistenciaMetric,
  extractReadinessFactors,
} from './domain/analytics/approval-metrics.js';
import {
  calculateDailyStudySummary,
  collectActivityDates,
  collectGoalDates,
  computeActivityStreak,
} from './domain/analytics/study-streak.js';
import {
  calculateSubjectErrorRate,
  findSubjectLatestActivityDate,
  calculateDaysSinceSubjectStudy,
} from './domain/analytics/subject-error-metrics.js';
import {
  normalizeTopicStrategy,
  normalizeExamBlueprint,
  normalizeAlgorithmVersions,
  EXAM_PRIORITIES,
} from './state/strategic.js';
import {
  buildTimerMiniView,
  createPipTimerController,
  shouldMarkHidden,
} from './ui/controllers/pip-timer-controller.js';
import { buildExecutiveSummary } from './application/build-executive-summary.js';
import { analyzeErrors } from './domain/diagnostics/error-analysis.js';
import { buildErrorAnalysisViewModel } from './application/analytics/build-error-analysis-view-model.js';
import { renderErrorAnalysis } from './ui/renderers/error-analysis-renderer.js';
import { heatmapMetricLevel } from './domain/analytics/heatmap.js';
import { calculateSubjectRadar } from './domain/analytics/multidimensional-radar.js';
import { generateDiagnosis } from './application/generate-diagnosis.js';
import { recommendStudy } from './application/recommend-study.js';
import { buildStudyCandidates } from './application/build-study-candidates.js';
import {
  calculateTopicMastery,
  calculateTopicRetention,
} from './domain/analytics/topic-metrics.js';
import { PRIORITY_ALGORITHM_VERSION } from './domain/analytics/priority-score.js';
import { calculateReviewHealth } from './domain/analytics/review-health.js';
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
  sameStudyActionTarget,
  STUDY_ACTION_SOURCES,
} from './application/recommendations/recommendation-action.js';
import {
  buildApprovalSignals,
} from './application/analytics/build-analytics-view-model.js';
import { buildStudyPlan } from './application/build-study-plan.js';
import { buildReplanProposal, applyReplan, undoReplan } from './application/replan-study.js';
import {
  buildDailyPlanProposal,
  applyDailyPlanProposal,
  undoDailyPlanGeneration,
} from './application/planning/distribute-study-plan.js';
import { watchDailyExecutionDate } from './ui/controllers/daily-execution-controller.js';
import {
  ADAPTIVE_PLANNING_VERSION,
  resolveExamPhase,
} from './domain/planning/adaptive-planning.js';
import {
  renderExamPhaseCompact,
} from './ui/renderers/adaptive-planning-renderer.js';
import { createAchievementsController } from './ui/controllers/achievements-controller.js';
import { buildSessionResultViewModel } from './application/sessions/build-session-result-view-model.js';
import { renderSessionResult } from './ui/renderers/session-result-renderer.js';
import { normalizeStudySession } from './domain/sessions/study-session.js';
import { createExamImportService } from './application/subjects/exam-import-service.js';
import { EXAM_TAGS, CATALOG_VERSION, EXAM_SOURCES } from './domain/exams/exam-constants.js';
import { EXAM_PRESET_OPTIONS } from './domain/exams/exam-preset-options.js';
import {
  isTopicInExamScope,
  isSimulationInExamScope,
  isCommonTopic,
  topicExamScopeLabel,
  normalizeExamTags,
} from './domain/exams/exam-scope.js';
import {
  classifyEvidenceScope,
  indexExamTopics,
  resolveExamEvidenceScope,
} from './domain/exams/exam-evidence-scope.js';
import { setActiveExamTags } from './application/exams/exam-scope-transition.js';
import { createUiState, pickPersistentState } from './state/state-boundaries.js';
import { createTabRouter } from './ui/navigation/tab-router.js';
import { createAppStateStore } from './state/app-state-store.js';
import type {
  ActiveTimerState,
  AppState,
  Metas,
  StudySession,
} from './core/types.js';
import { createModalController } from './ui/controllers/modal-controller.js';
import { createDialogFeedback } from './ui/primitives/modal-dialogs.js';
import { createPreferencesController } from './ui/controllers/preferences-controller.js';
import {
  validateBackupData as validateBackupDataValidator,
  validateNormalizedBackup,
  backupSummary,
} from './storage/backup-validator.js';
import { createBackupModalController } from './ui/controllers/backup-modal-controller.js';
import { createRemoteSyncProvider } from './storage/remote-sync-provider.js';
import { createRemoteSyncController } from './ui/controllers/remote-sync-controller.js';
import { createDelegatedEventsController } from './ui/controllers/delegated-events-controller.js';
import {
  createDelegatedArgumentResolver,
  createSpecialActionResolver,
  composeDelegatedActionHandlers,
} from './ui/events/delegated-actions.js';
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
import { buildHeaderViewModel } from './application/analytics/build-header-view-model.js';
import { renderHeroHeader, renderCompactHeader } from './ui/renderers/header-renderer.js';
import {
  createReadinessSnapshot,
  upsertReadinessSnapshot,
} from './application/analytics/readiness-history.js';
import { renderReadinessHistory } from './ui/renderers/readiness-history-renderer.js';
import { dismissAlert, reconcileAlerts } from './application/alert-lifecycle.js';
import { buildIntelligentAlerts } from './domain/diagnostics/alerts.js';
import { buildPerformanceForecast } from './domain/forecasts/performance-forecast.js';
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
import {
  applyOnboardingDateShortcut,
  AVAILABILITY_PRESETS,
} from './application/onboarding/build-onboarding-view-model.js';
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

const THEME_STORAGE_KEY = 'bb-premium-theme';
const MODE_FLASH_KEY = 'bb-premium-mode-message';
const TEST_MODE = new URLSearchParams(location.search).get('test') === '1';
const APP_MODE = TEST_MODE ? APP_MODES.REAL : readAppMode(globalThis.sessionStorage);
const IS_DEMO_MODE = APP_MODE === APP_MODES.DEMO;
let suppressBeforeUnloadSave = false;
const appClock = createClock();
function nowISO() {
  return appClock.nowISO();
}
const preferencesController = createPreferencesController({
  document,
  storage: localStorage,
  key: THEME_STORAGE_KEY,
});
function toggleTheme() {
  return preferencesController.toggle();
}
document.getElementById('themeToggleBtn')!.addEventListener('click', toggleTheme);
preferencesController.sync();
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
document
  .getElementById('periodComparisonPreset')
  ?.addEventListener('change', renderSelectedPeriodComparison);
document
  .getElementById('periodComparisonStart')
  ?.addEventListener('change', renderSelectedPeriodComparison);
document
  .getElementById('periodComparisonEnd')
  ?.addEventListener('change', renderSelectedPeriodComparison);

const ERROR_CATEGORIES: Record<string, any> = {
  naoSabia: { label: 'Não sabia', icon: '📚' },
  esqueci: { label: 'Esqueci', icon: '🧠' },
  interpretacao: { label: 'Interpretação', icon: '📖' },
  calculo: { label: 'Cálculo', icon: '➗' },
  desatencao: { label: 'Desatenção', icon: '⚠️' },
  chute: { label: 'Chute', icon: '🎲' },
};
const MIN_TOPIC_TREND_WINDOW_QUESTIONS = 20;
const MIN_ERROR_RECOMMENDATION_COUNT = 10;
const MIN_ERROR_RECOMMENDATION_COVERAGE = 60;
const ERROR_RECOMMENDATIONS: Record<string, any> = {
  naoSabia: {
    action: 'Revisar a teoria e os conceitos-base',
    studyType: 'study',
    estimatedMinutes: 35,
    questions: 10,
  },
  esqueci: {
    action: 'Fazer uma revisão curta e recuperar de memória',
    studyType: 'review',
    estimatedMinutes: 25,
    questions: 15,
  },
  interpretacao: {
    action: 'Resolver questões comentadas de interpretação',
    studyType: 'questions',
    estimatedMinutes: 40,
    questions: 15,
  },
  calculo: {
    action: 'Treinar exercícios de cálculo passo a passo',
    studyType: 'questions',
    estimatedMinutes: 45,
    questions: 15,
  },
  desatencao: {
    action: 'Resolver questões com conferência obrigatória',
    studyType: 'questions',
    estimatedMinutes: 35,
    questions: 20,
  },
  chute: {
    action: 'Reforçar conceitos antes de voltar às questões',
    studyType: 'study',
    estimatedMinutes: 30,
    questions: 10,
  },
};
const DIAGNOSIS_STATUS_ICON: Record<string, any> = {
  Crítico: '🔴',
  Atenção: '🟠',
  Acompanhamento: '🟡',
  'Em dia': '🟢',
};

let state: AppState = createDefaultState();
const uiState = createUiState();
const EXAM_PRESETS = EXAM_PRESET_OPTIONS.map(option => ({
  ...option,
  version: CATALOG_VERSION,
  examTags: [] as any[],
  sources: [] as any[],
  description: '',
  subjects: [] as any[],
}));
let examCatalogLoadPromise: any = null;
let examCatalogLoaded = false;
async function ensureExamCatalog() {
  if (examCatalogLoaded) return EXAM_PRESETS;
  if (!examCatalogLoadPromise) {
    examCatalogLoadPromise = new Promise((resolve, reject) => {
      const accept = () => {
        const catalog = window.StudyTrackExamCatalog;
        if (!Array.isArray(catalog?.EXAM_PRESETS)) {
          reject(new Error('O catálogo de editais não carregou corretamente.'));
          return;
        }
        EXAM_PRESETS.splice(0, EXAM_PRESETS.length, ...catalog.EXAM_PRESETS);
        examCatalogLoaded = true;
        resolve(EXAM_PRESETS);
      };
      if (window.StudyTrackExamCatalog) {
        accept();
        return;
      }
      const script = document.createElement('script');
      script.src = new URL(
        `src/exam-catalog.bundle.js?v=${__STUDYTRACK_BUILD_VERSION__}`,
        document.baseURI
      ).href;
      script.async = true;
      script.onload = accept;
      script.onerror = () =>
        reject(
          new Error(
            'Não foi possível carregar o catálogo. Conecte-se à internet e tente novamente.'
          )
        );
      document.head.appendChild(script);
    }).catch(error => {
      examCatalogLoadPromise = null;
      throw error;
    });
  }
  return examCatalogLoadPromise;
}
uiState.onboarding.presetId = EXAM_PRESETS[0]?.id || null;

function getSubjectById(subjectId: string) {
  return state.subjects.find(s => s.id === subjectId) || null;
}
function getTopicById(topicId: string | null | undefined) {
  for (const subject of state.subjects) {
    const topic = subject.topics.find(t => t.id === topicId);
    if (topic) return { subject, topic };
  }
  return null;
}
function evidenceScopeForTopic(topicId: string | null) {
  const found = getTopicById(topicId);
  return found ? normalizeExamTags(found.topic.examTags) : null;
}
function getSubjectName(subjectId: string) {
  return getSubjectById(subjectId)?.name || 'Disciplina removida';
}
function getTopicName(topicId: string) {
  return getTopicById(topicId)?.topic?.name || 'Tópico removido';
}
function entitySubjectId(item: Record<string, any>) {
  if (item?.subjectId) return item.subjectId;
  return state.subjects.find(s => s.name === item?.subject)?.id || null;
}
function entitySubjectName(item: Record<string, any>) {
  const id = entitySubjectId(item);
  return id ? getSubjectName(id) : item?.subject || '—';
}

const { migrateState, normalizeHistoryEvent } = createStateMigrator({
  nowISO,
  todayISO,
  toLocalDate: timestampToLocalDateISO,
  errorCategoryKeys: Object.keys(ERROR_CATEGORIES),
});

function ensureStateDefaults() {
  if (!state || typeof state !== 'object') state = {} as AppState;
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
  evidenceScopeForTopic,
  applyAdaptiveReviewRating: (current: any, rating: any, options: Record<string, any>) =>
    applyAdaptiveReviewRating(current, rating, options),
  addHistoryEvent,
  entitySubjectId,
  refreshTopicReviewStats,
  buildStudyPlan,
  buildDailyPlanProposal,
  applyDailyPlanProposal,
  undoDailyPlanGeneration,
  buildReplanProposal,
  applyReplan,
  undoReplan,
  normalizeErrorBreakdown,
  completeRecommendationFeedback,
  measureRecommendationResults,
  currentStudyRecommendations: () => currentStudyRecommendations,
  parseLocalDate,
  allTopics,
  normalizeTopicStrategy,
  captureReadinessBeforeStrategy: (reason: string) => captureReadinessBeforeStrategy(reason),
  invalidatePlanPreview: () => {
    studyPlanPreview = null;
  },
  persistAndRender: () => persistAndRender(),
  renderSubjects: () => renderSubjects(),
  showToast: (message: string) => showToast(message),
  timestampToLocalDateISO,
});
const INSTANCE_ID = uid('instance');
const STATE_CHANNEL =
  !IS_DEMO_MODE && typeof BroadcastChannel === 'function'
    ? new BroadcastChannel('extrato-estudos-state')
    : null;
let applyingRemoteState = false;
// Ligado quando os dados salvos não puderam ser lidos: gravar agora os substituiria.
let persistenceBlocked = false;
function readLocalState(key = STORAGE_KEY) {
  return appContext.storage.readLocal(key);
}
function writeLocalState(value: any, key = STORAGE_KEY) {
  return appContext.storage.writeLocal(key, value);
}

function normalizeAndValidateState(raw: any) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : structuredCloneSafe(raw);
  const validation = validateBackupData(parsed);
  if (!validation.valid) throw new Error((validation as { message: string }).message);
  return validation.normalized;
}

async function loadState() {
  let loadWarning = '';
  try {
    const result = await loadPersistedState({
      storage: StorageManager,
      storageKey: STORAGE_KEY,
      backupIndexKey: BACKUP_INDEX_KEY,
      currentSchemaVersion: CURRENT_SCHEMA_VERSION,
      normalize: normalizeAndValidateState,
      serialize: value => JSON.stringify(pickPersistentState(value)),
      sha256,
    });
    appStateStore.markPersisted(result.persisted);
    if (result.state) state = result.state;
    persistenceBlocked = result.blocked;
    loadWarning = result.warning;
  } catch (e) {
    console.error('Erro ao carregar estado salvo', e);
    loadWarning =
      'Não foi possível carregar os dados salvos. O aplicativo iniciou com os dados padrão; importe um backup se necessário.';
  }
  ensureStateDefaults();
  observePlanningCapacity();
  restoreTimerFromState();
  render();
  let modeMessage = '';
  try {
    modeMessage = sessionStorage.getItem(MODE_FLASH_KEY) || '';
    sessionStorage.removeItem(MODE_FLASH_KEY);
  } catch (error) {}
  if (loadWarning) showToast(loadWarning);
  else if (modeMessage) showToast(modeMessage);
}

/* ===== DIÁLOGOS, AVISOS E NOTIFICAÇÕES ===== */
const modalController = createModalController({ document, window });
const dialogFeedback = createDialogFeedback({ document, modalController });
function flashSaved(durationMs?: number) {
  dialogFeedback.flashSaved(durationMs);
}
function showToast(message: string, durationMs?: number) {
  dialogFeedback.showToast(message, durationMs);
}
function showConfirm(
  message: string,
  onConfirm: (value?: any) => void,
  onCancel?: () => void,
  options: any = {}
) {
  dialogFeedback.showConfirm(message, onConfirm, onCancel, options);
}
function showPrompt(
  message: string,
  options: Record<string, any>,
  onConfirm: (value?: any) => void,
  onCancel?: () => void
) {
  dialogFeedback.showPrompt(message, options, onConfirm, onCancel);
}

async function sha256(value: any) {
  if (!window.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function rotateAutomaticBackup(previousRaw: string | null, options: any = {}) {
  if (!previousRaw) return true;
  const backupKey = options.backupKey || BACKUP_KEY;
  const indexKey = options.indexKey || BACKUP_INDEX_KEY;
  const slotCount = Math.max(1, Number(options.slotCount) || AUTOMATIC_BACKUP_SLOTS);
  let previous;
  try {
    previous = JSON.parse(previousRaw);
  } catch (e) {
    return false;
  }
  if (!previous || !Array.isArray(previous.subjects)) return false;
  let index: { nextSlot: number; snapshots: any[]; version?: number; updatedAt?: string } = {
    nextSlot: 0,
    snapshots: [],
  };
  try {
    const rawIndex = await StorageManager.get(indexKey);
    if (rawIndex) {
      const parsed = JSON.parse(rawIndex);
      if (isPlainObject(parsed) && Array.isArray(parsed.snapshots)) index = parsed as typeof index;
    }
  } catch (e) {
    console.warn('Índice de backups inválido; iniciando um novo.', e);
  }
  const slot = Math.max(0, Number(index.nextSlot) || 0) % slotCount;
  const key = `${backupKey}-${slot}`;
  const checksum = await sha256(previousRaw);
  const saved = await (StorageManager.setDurable || StorageManager.set)(key, previousRaw);
  if (!saved) return false;
  const verification = await StorageManager.get(key);
  if (verification !== previousRaw || (checksum && (await sha256(verification)) !== checksum))
    return false;
  const snapshot = {
    slot,
    key,
    createdAt: nowISO(),
    stateUpdatedAt: previous.updatedAt || null,
    checksum,
    bytes: new Blob([previousRaw]).size,
  };
  index.snapshots = index.snapshots
    .filter(item => item && item.slot !== slot)
    .concat(snapshot)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  index.nextSlot = (slot + 1) % slotCount;
  index.version = 1;
  index.updatedAt = nowISO();
  return StorageManager.set(indexKey, JSON.stringify(index));
}

/* ===== STORE DE ESTADO PERSISTENTE ===== */
const appStateStore = createAppStateStore({
  getState: () => state,
  pickPersistentState,
  writeLocalState,
  readLocalState,
  STORAGE_KEY,
  nowISO,
  isDemoMode: () => IS_DEMO_MODE,
  isPersistenceBlocked: () => persistenceBlocked,
  rotateAutomaticBackup,
  writePersistentState: serialized => StorageManager.set(STORAGE_KEY, serialized),
  notifyRemoteState: serialized => {
    if (!applyingRemoteState) {
      STATE_CHANNEL?.postMessage({
        source: INSTANCE_ID,
        serialized,
        updatedAt: JSON.parse(serialized).updatedAt || null,
      });
    }
  },
  onSaved: () => flashSaved(),
  showToast,
});

function scheduleSave() {
  appStateStore.scheduleSave();
}
function enqueueStateTransaction(task: () => any) {
  return appStateStore.enqueueStateTransaction(task);
}

STATE_CHANNEL?.addEventListener('message', event => {
  const message = event.data;
  if (!message || message.source === INSTANCE_ID || typeof message.serialized !== 'string') return;
  const remoteTime = Date.parse(message.updatedAt || 0) || 0;
  const localTime = Date.parse(String(state.updatedAt || 0)) || 0;
  if (remoteTime <= localTime) return;
  try {
    applyingRemoteState = true;
    state = normalizeAndValidateState(message.serialized);
    writeLocalState(message.serialized);
    appStateStore.markPersisted(message.serialized);
    persistenceBlocked = false;
    render();
    showToast('Dados atualizados por outra aba.');
  } catch (error) {
    console.warn('Atualizacao de outra aba ignorada', error);
  } finally {
    applyingRemoteState = false;
  }
});

/* ===== TABS & ROUTER ===== */
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
  onCancelReview: closeReviewRating,
});
function activateTab(tabName: string, updateHash = true) {
  return tabRouter.activateTab(tabName, updateHash);
}
createHelpController({ document, window, activateTab }).mount();

/* ===== HELPERS ===== */
function allTopics() {
  return state.subjects.flatMap(s =>
    s.topics.map(t => ({
      ...t,
      subjectName: s.name,
      subjectId: s.id,
      subjectArchived: Boolean(s.archived),
      topicArchived: Boolean(t.archived),
    }))
  );
}
function activeSubjects() {
  return state.subjects.filter(subject => !subject.archived);
}
function topicsForSelection(subjectOrId: any, selectedTopicId: string | null) {
  const subject =
    subjectOrId && typeof subjectOrId === 'object' ? subjectOrId : getSubjectById(subjectOrId);
  if (!subject || !Array.isArray(subject.topics)) return [];
  return subject.topics.filter((topic: any) => !topic.archived || topic.id === selectedTopicId);
}
function isActiveSubjectId(subjectId: string) {
  const subject = getSubjectById(subjectId);
  return Boolean(subject && !subject.archived);
}
function isActiveTopicId(topicId: string) {
  const found = getTopicById(topicId);
  return Boolean(found && !found.subject.archived && !found.topic.archived);
}
function isActiveStudyReference(subjectId: string, topicId: string | null = null) {
  if (!isActiveSubjectId(subjectId)) return false;
  return !topicId || isActiveTopicId(topicId);
}
function subjectsForSelection(selectedId: string | null = null) {
  return state.subjects.filter(subject => !subject.archived || subject.id === selectedId);
}
function activeTopics() {
  return allTopics().filter(topic => !topic.subjectArchived && !topic.topicArchived);
}
function topicInActiveExamScope(topic: Record<string, any>) {
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
  return resolveExamEvidenceScope({
    subjects: state.subjects,
    activeExamTags: state.examBlueprint?.activeExamTags || [],
    sessions: state.studySessions,
    questions: state.questoes,
    reviews: state.reviewAgenda,
  });
}
function examScopedRecords(records: any[] = []) {
  const tags = state.examBlueprint?.activeExamTags || [],
    index = indexExamTopics(state.subjects);
  return records.filter(
    record => classifyEvidenceScope(record, state.subjects, tags, index).includedInExamMetrics
  );
}
function examScopedSimulations() {
  const active = state.examBlueprint?.activeExamTags || [];
  return state.simulados.filter(item => isSimulationInExamScope(item, active));
}
function subjectProgress(subject: Record<string, any>) {
  return calculateTopicCoverage(subject.topics).value;
}
function localDateISO(value: any) {
  if (arguments.length === 0) value = new Date();
  if (value === null || value === undefined || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function localDateFromTimestamp(value: any) {
  return localDateISO(value);
}
function timestampToLocalDateISO(value: any) {
  return localDateISO(value);
}
function todayISO() {
  return appContext.clock.today();
}
function addDays(iso: string, days: number) {
  const d = parseLocalDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + Number(days || 0));
  return localDateISO(d);
}
// Empty dates read as "—" here; the DD/MM/AAAA rule lives in core/format-date (handles timestamps too).
function formatDatePt(iso: string) {
  return iso ? formatDateBR(iso) : '—';
}
const MESES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
function monthKey(iso: string) {
  if (!iso) return null;
  return iso.slice(0, 7); // "AAAA-MM"
}
function monthLabel(key: string) {
  if (!key) return '';
  const [y, m] = key.split('-');
  return `${MESES_PT[parseInt(m, 10) - 1]} de ${y}`;
}
function collectMonthKeys(...arrays: any[][]) {
  const set = new Set<string>();
  arrays.forEach(arr =>
    arr.forEach((item: any) => {
      const k = monthKey(item.date);
      if (k) set.add(k);
    })
  );
  return [...set].sort();
}
function startOfWeek(d: any) {
  const date = parseLocalDate(d);
  if (!date) return '';
  const day = date.getDay(); // 0 = domingo
  const diff = (day === 0 ? -6 : 1) - day; // volta pra segunda-feira
  date.setDate(date.getDate() + diff);
  return localDateISO(date);
}
function isSameWeek(iso: string) {
  if (!iso) return false;
  return startOfWeek(iso) === startOfWeek(todayISO());
}
function isSameMonth(iso: string) {
  if (!iso) return false;
  return monthKey(iso) === monthKey(todayISO());
}

/* ===== "=A2-HOJE()" — Dias para Revisão ===== */
function diasParaRevisao(iso: string) {
  const alvo = parseLocalDate(iso);
  const hoje = parseLocalDate(todayISO());
  if (!alvo || !hoje) return null;
  return Math.round((Number(alvo) - Number(hoje)) / 86400000);
}
function diasParaRevisaoPill(iso: string, status: string) {
  const dias = diasParaRevisao(iso);
  if (dias === null) return `<span class="dias-pill dias-futura">—</span>`;
  if (status === 'Concluído') {
    return `<span class="dias-pill dias-futura">—</span>`;
  }
  if (dias < 0) return `<span class="dias-pill dias-atrasada">${dias}d</span>`;
  if (dias === 0) return `<span class="dias-pill dias-hoje">hoje</span>`;
  if (dias <= 7) return `<span class="dias-pill dias-proxima">em ${dias}d</span>`;
  return `<span class="dias-pill dias-futura">em ${dias}d</span>`;
}

document
  .getElementById('examDateInput')!
  .addEventListener('change', function (this: HTMLInputElement) {
    updateExamBlueprint('examDate', this.value);
  });

/* ===== SEQUÊNCIA DE DIAS ESTUDANDO (STREAK) ===== */
function getDailyStudySummary(date: string, options: any = {}) {
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
  return collectActivityDates({
    studySessions: state.studySessions,
    questoes: state.questoes,
    simulados: state.simulados,
    isDateMeaningful: date => getDailyStudySummary(date).meaningful,
  });
}
function getGoalDates() {
  return collectGoalDates({
    studySessions: state.studySessions,
    isGoalAchievedForDate: date => getDailyStudySummary(date).goalAchieved,
  });
}
function computeStreak(activityDates: Set<string>) {
  return computeActivityStreak(activityDates, { today: todayISO(), addDays });
}

function toggleStreakExpanded() {
  dashboardTabController.toggleStreakExpanded();
}
function toggleStreakActiveDays() {
  dashboardTabController.toggleStreakActiveDays();
}
const timerUiController = createTimerUiController({
  document,
  activeTabName,
  activateTab,
  renderTimerFocusContext,
  isTimerRunning: () => timerRunning,
  getTopicById,
  subjectService,
});
timerUiController.bindKeyboardShortcuts();

function focusStudyTimer() {
  timerUiController.focusStudyTimer();
}
function openStudyTimerFocus() {
  timerUiController.openStudyTimerFocus();
}
function toggleTimerFocus(force: boolean | null = null) {
  return timerUiController.toggleTimerFocus(force);
}

/* ===== GRÁFICO DE EVOLUÇÃO DO PROGRESSO ===== */
function recordProgressSnapshot(pct: number) {
  performanceTabController.recordProgressSnapshot(pct);
}
function renderProgressChart() {
  performanceTabController.renderProgressChart();
}

/* ===== BACKUP: EXPORTAR / IMPORTAR / ZONA DE PERIGO ===== */
function validateBackupData(data: Record<string, any>) {
  return validateBackupDataValidator(data, {
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
}

const backupModalController = createBackupModalController({
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
  onApplyBackup: applyImportedBackup,
  onResetComplete: () => {
    state = createDefaultState();
    ensureStateDefaults();
    suppressBeforeUnloadSave = true;
    location.reload();
  },
});

function applyImportedBackup(importedState: AppState) {
  const previousState = state;
  const previousBlocked = persistenceBlocked;
  try {
    state = importedState;
    ensureStateDefaults();
    restoreTimerFromState();
    persistenceBlocked = false;
    persistAndRender();
    showToast('Backup importado com sucesso.');
    return true;
  } catch (error: any) {
    state = previousState;
    persistenceBlocked = previousBlocked;
    restoreTimerFromState();
    render();
    console.error('Erro ao importar backup', error);
    showToast(
      'O backup passou pela validação inicial, mas não pôde ser convertido. Seus dados atuais foram preservados.'
    );
    return false;
  }
}
backupModalController.mount();
const remoteSyncProvider = createRemoteSyncProvider({
  fetch: window.fetch.bind(window),
  origin: location.origin,
});
const remoteSyncController = createRemoteSyncController({
  document,
  window,
  provider: remoteSyncProvider,
  getState: () => pickPersistentState(state),
  validate: validateBackupData,
  describe: ({ normalized, version }: any) => backupSummary(normalized, version),
  confirm: showConfirm,
  createSnapshot: () => rotateAutomaticBackup(JSON.stringify(pickPersistentState(state))),
  onImported: applyImportedBackup,
  notify: showToast,
  isDisabled: () => IS_DEMO_MODE,
});
remoteSyncController.mount();
function reloadWithModeChange() {
  suppressBeforeUnloadSave = true;
  appStateStore.cancelPendingSave();
  location.reload();
}
const demoController = createDemoController({
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
  reload: reloadWithModeChange,
  activateTab,
});
demoController.mount();

/* ===== CRONÔMETRO DE SESSÃO DE ESTUDO ===== */
let timerSeconds = 0;
let timerRunning = false;
const pipTimer = createPipTimerController({
  getView: () => {
    const active = (state.activeTimer || {}) as Partial<ActiveTimerState>,
      steps = active.strategy?.steps || [],
      index = Math.min(active.strategyStep || 0, Math.max(0, steps.length - 1)),
      step = steps[index];
    return buildTimerMiniView({
      running: timerRunning,
      seconds: currentTimerSeconds(),
      targetMinutes: active.targetMinutes,
      subjectName: active.subjectId ? getSubjectName(active.subjectId) : '',
      topicName: active.topicId ? getTopicName(active.topicId) : '',
      bookmarkLabel: topicResumeLabel(active.topicId!),
      stepLabel: step
        ? `Etapa ${index + 1}/${steps.length}: ${step.label} · ${step.minutes} min`
        : '',
      formatTime: formatTimer,
      formatMinutes: formatPlanMinutes,
    });
  },
  onToggle: () => (timerRunning ? pauseTimer() : startTimer()),
  onFinish: () => {
    finishStudyTimer();
    window.focus();
  },
  copyStyles: doc => {
    for (const node of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"],style')) {
      const copy = doc.importNode(node, true);
      if (node.href) copy.href = node.href;
      doc.head.append(copy);
    }
    doc.documentElement.setAttribute(
      'data-theme',
      document.documentElement.getAttribute('data-theme') || 'light'
    );
    doc.body.classList.add('pip-timer-window');
    doc.title = 'StudyTrack';
  },
});
let timerIntervalId: any = null;
let timerStartedAt: any = null;

function findDailyPlanItem(itemId: string) {
  return findDailyPlanItemCoordinator(state.dailyPlans, itemId);
}
function releaseActivePlanItem() {
  return releaseActivePlanItemCoordinator(state.dailyPlans, state.activeTimer?.planItemId, nowISO);
}
function startPlannedActivity(itemId: string) {
  const found = findDailyPlanItem(itemId);
  if (!found) {
    showToast('Esta atividade não está mais disponível no plano.');
    return;
  }
  const execution = dailyExecutionController.build().items!.find(item => item.id === itemId);
  if (!execution || execution.remainingSeconds <= 0) {
    showToast('Esta atividade não está disponível para iniciar.');
    return;
  }
  if (timerSeconds > 0) {
    showToast('Finalize ou zere a sessão atual antes de iniciar outra atividade.');
    return;
  }
  const { plan, item } = found;
  if (item.topicId) {
    const candidate = intelligenceCandidates().find(
      (candidate: any) => candidate.topicId === item.topicId
    );
    if (!candidate || candidate.archived || candidate.blockedPrerequisites.length) {
      showToast(
        'Esta atividade aguarda pré-requisitos ou possui um tópico arquivado. Recalcule o plano.'
      );
      return;
    }
  }
  Object.assign(state.activeTimer, {
    subjectId: item.subjectId || null,
    topicId: item.topicId || null,
    type: item.type || 'study',
    planItemId: item.id,
    targetMinutes: Math.ceil(execution.remainingSeconds / 60),
  });
  item.executedSeconds = execution.executedSeconds;
  item.status = 'in_progress';
  item.startedAt = item.startedAt || nowISO();
  plan.updatedAt = nowISO();
  populateTimerContextControls();
  startTimer();
  renderPlanoHoje();
  // From another tab, focus mode keeps the running timer, its target and Pause in view; on Visão Geral the timer is already on the page.
  if (activeTabName() !== 'dashboard') openStudyTimerFocus();
  else {
    document
      .querySelector('#panel-dashboard .timer-block')
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    requestAnimationFrame(() => document.getElementById('timerPauseBtn')?.focus());
  }
}
function currentTimerSeconds() {
  return computeTimerSeconds(state.activeTimer);
}
function hasStartedStudyTimer() {
  return hasActiveTimer(state.activeTimer);
}
function activeTimerMatchesRecommendation(recommendation: Record<string, any>) {
  return activeTimerMatchesRecommendationModule(
    state.activeTimer,
    recommendation,
    recommendationActionKind
  );
}
function renderActiveStudyTimerNotice(recommendation: Record<string, any> | null) {
  const active = (state.activeTimer || {}) as Partial<ActiveTimerState>;
  return renderActiveStudyTimerNoticeHtml({
    active,
    recommendation,
    subjectName: active.subjectId ? getSubjectName(active.subjectId) : 'Disciplina não selecionada',
    topicName: active.topicId ? getTopicName(active.topicId) : 'Tópico não selecionado',
    elapsed: formatDuration(currentTimerSeconds()),
    targetMinutes: active.targetMinutes,
    formatTargetFn: formatPlanMinutes,
    escapeFn: escapeHtml,
    getActionKind: recommendationActionKind,
  });
}
const studyTimerViewController = createStudyTimerViewController({
  document,
  formatTimer,
  escapeHtml,
  escapeAttr,
  getSubjectName,
  getTopicName,
  getSubjectById,
  subjectsForSelection,
  topicsForSelection,
  topicResumeLabel,
  findDailyPlanItem,
  getActiveTimer: () => (state.activeTimer || {}) as Partial<ActiveTimerState>,
  onPipRender: () => pipTimer.render(),
});

function updateTimerDisplay() {
  studyTimerViewController.updateTimerDisplay(timerSeconds, timerRunning);
}
function renderTimerFocusContext() {
  studyTimerViewController.renderTimerFocusContext();
}
function renderGuidedStrategy() {
  studyTimerViewController.renderGuidedStrategy();
}
function advanceGuidedStrategy() {
  if (state.activeTimer?.strategy) {
    advanceGuidedStrategyStep(state.activeTimer);
    renderGuidedStrategy();
    scheduleSave();
  }
}
function updateTimerControls() {
  studyTimerViewController.updateTimerControls(timerSeconds, timerRunning);
}
function refreshStudyActionViews() {
  if (document.getElementById('studyRecommendation')) renderStudyRecommendation();
}
function populateTimerTopicSelect(subjectId: string, selectedTopicId: string | null) {
  studyTimerViewController.populateTimerTopicSelect(subjectId, selectedTopicId);
}
function populateTimerContextControls() {
  studyTimerViewController.populateTimerContextControls();
  updateTimerControls();
}
function timerTick() {
  timerSeconds = currentTimerSeconds();
  updateTimerDisplay();
}
function startTimer() {
  if (timerRunning) return;
  if (timerSeconds === 0) {
    const result = document.getElementById('sessionResult');
    if (result) result.hidden = true;
  }
  const active = state.activeTimer;
  if (timerSeconds === 0) {
    active.startedAt = nowISO();
    active.accumulatedSeconds = 0;
  }
  active.subjectId =
    (document.getElementById('timerSubjectSelect') as HTMLSelectElement).value || null;
  active.topicId = (document.getElementById('timerTopicSelect') as HTMLSelectElement).value || null;
  active.type = (document.getElementById('timerTypeSelect') as HTMLSelectElement).value || 'study';
  active.runStartedAt = nowISO();
  active.isRunning = true;
  active.hiddenAt = null;
  timerStartedAt = active.startedAt;
  timerRunning = true;
  if (guidedStudyService.current()) guidedStudyService.resume();
  clearInterval(timerIntervalId);
  timerIntervalId = setInterval(timerTick, 1000);
  timerTick();
  updateTimerControls();
  announceTimerEvent('start');
  scheduleSave();
  refreshStudyActionViews();
}
function pauseTimer(shouldSave = true) {
  timerSeconds = currentTimerSeconds();
  state.activeTimer.accumulatedSeconds = timerSeconds;
  state.activeTimer.runStartedAt = null;
  state.activeTimer.isRunning = false;
  state.activeTimer.hiddenAt = null;
  timerRunning = false;
  if (guidedStudyService.current()) guidedStudyService.pause();
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  updateTimerDisplay();
  updateTimerControls();
  announceTimerEvent('pause');
  if (shouldSave) {
    scheduleSave();
    refreshStudyActionViews();
  }
}
function resetTimer() {
  pauseTimer(false);
  releaseActivePlanItem();
  timerSeconds = 0;
  timerStartedAt = null;
  Object.assign(state.activeTimer, {
    startedAt: null,
    runStartedAt: null,
    accumulatedSeconds: 0,
    isRunning: false,
    hiddenAt: null,
    planItemId: null,
    targetMinutes: null,
    strategy: null,
    strategyStep: 0,
    recommendationId: null,
    recommendationSource: null,
    recommendationType: null,
    prioritySnapshot: null,
  });
  guidedStudyService.reset();
  pipTimer.close();
  updateTimerDisplay();
  updateTimerControls();
  announceTimerEvent('reset');
  scheduleSave();
  refreshStudyActionViews();
}
function restoreTimerFromState() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  timerSeconds = currentTimerSeconds();
  timerStartedAt = state.activeTimer.startedAt || null;
  timerRunning = Boolean(state.activeTimer.isRunning);
  const runStart = state.activeTimer.runStartedAt ? Date.parse(state.activeTimer.runStartedAt) : 0;
  const recoveredLongRun = timerRunning && runStart && Date.now() - runStart > 4 * 60 * 60 * 1000;
  if (recoveredLongRun) {
    pauseTimer(false);
    scheduleSave();
    setTimeout(
      () =>
        showConfirm(
          `Uma sessão longa foi recuperada com ${formatDuration(timerSeconds)}. Manter esse tempo e continuar com o cronômetro pausado?`,
          () => showToast('Tempo recuperado. Você pode continuar ou finalizar a sessão.'),
          () => {
            resetTimer();
            showToast('Intervalo recuperado descartado.');
          }
        ),
      0
    );
  } else if (timerRunning) {
    timerIntervalId = setInterval(timerTick, 1000);
  }
  updateTimerDisplay();
  populateTimerContextControls();
  updateTimerControls();
}
const sessionModalController = createSessionModalController({
  document,
  formatTimer,
  escapeHtml,
  escapeAttr,
  getSubjectById,
  getTopicById,
  subjectsForSelection,
  topicsForSelection,
});
function showSessionModal() {
  sessionModalController.show(timerSeconds, state.activeTimer);
}
function topicResumeLabel(topicId: string) {
  return timerUiController.topicResumeLabel(topicId);
}
function saveSessionBookmark(topicId: string, endedAt: string) {
  timerUiController.saveSessionBookmark(topicId, endedAt);
}
function closeSessionModal() {
  sessionModalController.hide();
  resetTimer();
}
// Esc keeps the paused session; only an explicit, confirmed discard loses the time.
function dismissSessionModal() {
  sessionModalController.hide();
  document.getElementById('timerFinishBtn')?.focus();
}
function discardSessionFromModal() {
  const overlay = document.getElementById('sessionModalOverlay');
  overlay!.classList.remove('show');
  showConfirm(
    `Descartar esta sessão de ${formatDuration(timerSeconds)}? O tempo não será registrado.`,
    closeSessionModal,
    () => {
      overlay!.classList.add('show');
      document.getElementById('sessionModalSkipBtn')?.focus();
    },
    { confirmLabel: 'Descartar sessão' }
  );
}
document.getElementById('timerStartBtn')!.addEventListener('click', startTimer);
document.getElementById('timerPauseBtn')!.addEventListener('click', () => pauseTimer());
document
  .getElementById('timerSubjectSelect')!
  .addEventListener('change', function (this: HTMLSelectElement) {
    state.activeTimer.subjectId = this.value || null;
    state.activeTimer.topicId = null;
    populateTimerTopicSelect(state.activeTimer.subjectId!, null);
    renderTimerFocusContext();
    scheduleSave();
  });
document
  .getElementById('timerTopicSelect')!
  .addEventListener('change', function (this: HTMLSelectElement) {
    state.activeTimer.topicId = this.value || null;
    renderTimerFocusContext();
    scheduleSave();
  });
document
  .getElementById('timerTypeSelect')!
  .addEventListener('change', function (this: HTMLSelectElement) {
    state.activeTimer.type = this.value || 'study';
    renderTimerFocusContext();
    scheduleSave();
  });
document.getElementById('timerResetBtn')!.addEventListener('click', () => {
  if (timerSeconds === 0) {
    return;
  }
  showConfirm('Zerar o cronômetro? O tempo desta sessão será perdido.', resetTimer);
});
function finishStudyTimer() {
  if (timerSeconds === 0) {
    showToast('O cronômetro ainda não começou.');
    return;
  }
  pauseTimer();
  announceTimerEvent('finish');
  showSessionModal();
}
document.getElementById('timerFinishBtn')!.addEventListener('click', finishStudyTimer);
const timerPipBtn = document.getElementById('timerPipBtn');
timerPipBtn!.hidden = !pipTimer.supported;
timerPipBtn!.addEventListener('click', () =>
  pipTimer.open().catch(error => {
    console.warn('Janela flutuante indisponível', error);
    showToast('Não foi possível abrir a janela flutuante.');
  })
);
function showSessionResult(
  session: Record<string, any>,
  nextPriority: Record<string, any> | null,
  priorityChanged: boolean,
  day: any = null,
  planNext: Record<string, any> | null = null
) {
  const result = document.getElementById('sessionResult');
  if (!result) return;
  result.innerHTML = renderSessionResult(
    buildSessionResultViewModel(session, nextPriority, priorityChanged, {
      subjectName: getSubjectName,
      topicName: getTopicName,
      formatMinutes: formatPlanMinutes,
      day,
      planNext,
    }),
    { escapeHtml }
  );
  if (document.body.classList.contains('timer-focus-active')) {
    timerUiController.clearTimerFocusReturnTab();
    toggleTimerFocus(false);
  }
  result.hidden = false;
  activateTab('dashboard');
  result.scrollIntoView({ block: 'center', behavior: 'smooth' });
  result.focus({ preventScroll: true });
}
function openWeeklyClose() {
  weeklyCloseModalController.openWeeklyClose();
}
function openNextSessionAction() {
  activateTab('dashboard');
  document
    .getElementById('overviewNextAction')
    ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

sessionModalController.bindEvents({
  onSkip: discardSessionFromModal,
  onDismiss: dismissSessionModal,
  onSave: formValues => {
    const previousPriority = currentStudyRecommendations[0]
      ? { ...currentStudyRecommendations[0] }
      : null;
    const session = buildCompletedSessionRecord({
      timerSeconds,
      timerStartedAt,
      activeTimer: state.activeTimer,
      formValues,
      nowISO,
      localDateFromTimestamp,
      uid,
    });
    saveSessionBookmark(formValues.topicId!, session.endedAt);
    const dayBefore = session.date === todayISO() ? dailyExecutionController.build() : null;
    if (guidedStudyService.current()) guidedStudyService.complete(session);
    else sessionService.complete(session);
    persistAndRender();
    const dayAfter = dayBefore ? dailyExecutionController.build() : null;
    renderStudyRecommendation();
    renderDiagnosisCenter();
    const nextPriority = currentStudyRecommendations[0] || null;
    const priorityChanged =
      previousPriority && nextPriority && !sameStudyActionTarget(previousPriority, nextPriority);
    const openSimulationFlow = formValues.type === 'simulation';
    closeSessionModal();
    showSessionResult(
      session,
      nextPriority,
      priorityChanged,
      dayBefore?.progress && dayAfter?.progress
        ? { before: dayBefore.progress, after: dayAfter.progress, total: dayAfter.items.length }
        : null,
      (dayAfter || dailyExecutionController.build()).priority?.nextItem || null
    );
    if (openSimulationFlow) {
      activateTab('questoes');
      addSimuladoRow();
      showToast('Complete agora os resultados do simulado.');
    }
  },
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (shouldMarkHidden({ isRunning: state.activeTimer.isRunning, pipOpen: pipTimer.isOpen() })) {
      state.activeTimer.hiddenAt = nowISO();
      scheduleSave();
    }
    return;
  }
  const hiddenAt = state.activeTimer.hiddenAt ? Date.parse(state.activeTimer.hiddenAt) : 0;
  if (!state.activeTimer.isRunning || !hiddenAt) return;
  const awaySeconds = Math.max(0, Math.floor((Date.now() - hiddenAt) / 1000));
  if (awaySeconds >= 2 * 60 * 60) {
    pauseTimer();
    showConfirm(
      `O cronômetro ficou em segundo plano por ${formatDuration(awaySeconds)}. Manter o intervalo no tempo da sessão?`,
      () => showToast('Intervalo mantido. O cronômetro ficou pausado.'),
      () => {
        resetTimer();
        showToast('Intervalo descartado.');
      }
    );
  } else {
    state.activeTimer.hiddenAt = null;
    scheduleSave();
  }
});

/* ===== CONQUISTAS / BADGES ===== */
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
function renderBadges() {
  achievementsController.render();
}

/* ===== HEATMAP DE HORAS E META DIÁRIA ===== */
function renderHeatmap() {
  dashboardTabController.renderHeatmap();
}
function setHeatmapFilter(field: string, value: any) {
  dashboardTabController.setHeatmapFilter(field, value);
}
function selectHeatmapDay(date: string) {
  dashboardTabController.selectHeatmapDay(date);
}
function viewSelectedHeatmapSessions() {
  dashboardTabController.viewSelectedHeatmapSessions();
}

function getMetricDataState(metric: Record<string, any>, minimumConfidence = 0.35) {
  if (!metric?.available || metric.raw === null) return 'empty';
  if ((Number(metric.confidence) || 0) < minimumConfidence) return 'insufficient';
  return 'ready';
}
function metricStateLabel(metric: Record<string, any>, minimumConfidence = 0.35) {
  const status = getMetricDataState(metric, minimumConfidence);
  if (status === 'empty') return 'Aguardando dados';
  if (status === 'insufficient') return 'Estimativa inicial';
  return 'Resultado calculado';
}

/* ===== GRÁFICO: EVOLUÇÃO DOS SIMULADOS ===== */

/* ===== BUSCA GLOBAL ===== */
function jumpToTopic(subjectId: string, topicId: string) {
  const s = state.subjects.find(x => x.id === subjectId);
  if (s) s.collapsed = false;
  const input = document.getElementById('globalSearchInput') as HTMLInputElement | null;
  if (input) {
    input.value = '';
    input.setAttribute('aria-expanded', 'false');
  }
  document.getElementById('globalSearchResults')?.classList.remove('show');
  (document.querySelector('.tab-btn[data-tab="disciplinas"]') as HTMLElement | null)?.click();
  persistAndRender();
  setTimeout(() => {
    const row = document.getElementById('topic-row-' + topicId);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('highlight-flash');
      setTimeout(() => row.classList.remove('highlight-flash'), 1700);
    }
  }, 150);
}

const searchController = createSearchController({
  document,
  window,
  getState: () => state,
  activateTab,
  showToast,
  openExamImport,
  getRecommendations: () => currentStudyRecommendations,
  onExecuteRecommendation: id => executeStudyRecommendation(id),
  jumpToTopic,
  escapeHtml,
  escapeAttr,
});
searchController.mount();
const guidedTourController = createGuidedTourController({
  document,
  window,
  activateTab,
  showToast,
});
const headerObserver = new IntersectionObserver(
  entries => {
    const hero = entries[0],
      shell = document.querySelector('.sticky-shell');
    shell?.classList.toggle(
      'is-compact',
      !hero.isIntersecting && hero.boundingClientRect.bottom < 0
    );
    syncStickyMetrics();
  },
  { threshold: 0 }
);
headerObserver.observe(document.querySelector('.statement')!);
const stickyShell = document.querySelector('.sticky-shell');
const overviewNav = document.querySelector('.overview-nav');
document.querySelectorAll('.overview-nav-mobile select').forEach(select =>
  select.addEventListener('change', event => {
    const target = document.getElementById((event.target as HTMLInputElement).value);
    if (!target) return;
    target.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    window.history.replaceState(null, '', `#${target.id}`);
  })
);
document
  .getElementById('overviewAttentionViewAll')
  ?.addEventListener('click', () => activateTab('hoje'));
const syncStickyMetrics = () => {
  // A sticky demo banner sits above the shell, so the shell and everything stacked under it shift down by its height.
  const banner = document.getElementById('demoBanner'),
    bannerHeight =
      banner && !banner.hidden && getComputedStyle(banner).position === 'sticky'
        ? Math.ceil(banner.getBoundingClientRect().height)
        : 0;
  document.documentElement.style.setProperty('--demo-banner-height', `${bannerHeight}px`);
  document.documentElement.style.setProperty(
    '--sticky-stack-height',
    `${Math.ceil(stickyShell?.getBoundingClientRect().height || 0) + bannerHeight}px`
  );
  document.documentElement.style.setProperty(
    '--overview-nav-height',
    `${Math.ceil(overviewNav?.getBoundingClientRect().height || 0)}px`
  );
};
if ('ResizeObserver' in window) {
  const stickyMetricsObserver = new ResizeObserver(syncStickyMetrics);
  if (stickyShell) stickyMetricsObserver.observe(stickyShell);
  const demoBanner = document.getElementById('demoBanner');
  if (demoBanner) stickyMetricsObserver.observe(demoBanner);
  if (overviewNav) stickyMetricsObserver.observe(overviewNav);
}
window.addEventListener('resize', syncStickyMetrics, { passive: true });
window.requestAnimationFrame(syncStickyMetrics);

/* ===== RENDER: HEADER STATS ===== */
function renderHeader() {
  const topics = activeTopics();
  const total = topics.length;
  const done = topics.filter(t => t.status === 'Concluído').length;
  const andamento = topics.filter(t => t.status === 'Em andamento').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const readiness = readinessResult(computeApprovalMetrics());
  document.getElementById('statAndamento')!.textContent = String(andamento);
  document.getElementById('statConcluido')!.textContent = String(done);

  const revisoesPrevistas =
    state.calendar.filter(c => c.date >= todayISO()).length +
    state.reviewAgenda.filter(a => a.date >= todayISO() && a.status !== 'Concluído').length;
  const model = buildHeaderViewModel({
    readiness,
    subjects: state.subjects,
    topics,
    upcomingReviews: revisoesPrevistas,
    streak: computeStreak(getActivityDates()),
    examDate: state.examDate,
    planNumber: document.getElementById('planNumber')!.textContent,
    today: todayISO(),
  });
  renderHeroHeader(model, { document });
  renderCompactHeader(model, { document, formatDate: formatDatePt });

  recordProgressSnapshot(pct);
  renderExamCountdown();
}

/* ===== RENDER: DASHBOARD ===== */
let upcomingVisible = DEFAULT_LIST_VISIBLE_ITEMS;
function changeUpcomingLimit(_delta: number) {
  upcomingVisible = Number.MAX_SAFE_INTEGER;
  renderDashboard();
}
function showAllUpcoming() {
  upcomingVisible = Number.MAX_SAFE_INTEGER;
  renderDashboard();
}
function resetUpcomingLimit() {
  upcomingVisible = 5;
  renderDashboard();
}
function renderDashboard() {
  const phaseDays = state.examDate ? diasParaRevisao(state.examDate) : null;
  const phaseContainer = document.getElementById('overviewExamPhase');
  if (phaseContainer)
    phaseContainer.innerHTML = renderExamPhaseCompact(resolveExamPhase(phaseDays), { escapeHtml });
  const topics = activeTopics();
  const total = topics.length;
  const done = topics.filter(t => t.status === 'Concluído').length;
  const andamento = topics.filter(t => t.status === 'Em andamento').length;
  const naoIniciado = topics.filter(t => t.status === 'Não iniciado').length;

  const controller = createDashboardTabController();

  const qs = document.getElementById('quickStats');
  if (qs) {
    controller.mountQuickStats(qs, {
      total,
      naoIniciado,
      emAndamento: andamento,
      concluido: done,
    });
  }

  const bars = document.getElementById('progressBars');
  if (bars) {
    controller.mountProgressBars(
      bars,
      activeSubjects().map(s => ({
        id: s.id,
        name: s.name,
        percentage: subjectProgress(s),
      }))
    );
  }

  const calItems = state.calendar
    .filter(c => c.date >= todayISO())
    .map(c => ({
      id: c.id,
      date: c.date,
      dateFormatted: formatDatePt(c.date),
      subject: entitySubjectName(c),
      label: c.reviewType && c.reviewType !== '—' ? c.reviewType : 'Revisão',
      status: c.status,
      origem: 'Calendário',
    }));
  const agendaItems = state.reviewAgenda
    .filter(a => a.date >= todayISO())
    .map(a => ({
      id: a.id,
      date: a.date,
      dateFormatted: formatDatePt(a.date),
      subject: entitySubjectName(a),
      label: `${a.topicId ? getTopicName(a.topicId) : a.topic || 'Tópico'} · ${a.tipo}`,
      status: a.status,
      origem: 'Agenda de Revisões',
    }));

  const allUpcoming = [...calItems, ...agendaItems].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = allUpcoming.slice(0, upcomingVisible);

  const ul = document.getElementById('upcomingList');
  const title = document.getElementById('upcomingTitle'),
    footer = document.getElementById('upcomingFooter');
  if (title) title.textContent = `Próximas revisões · ${allUpcoming.length}`;
  if (ul) {
    controller.mountUpcomingList(ul, upcoming);
  }
  if (footer) {
    if (upcoming.length === 0) {
      footer.innerHTML = '';
    } else {
      footer.innerHTML =
        renderCollectionFooter({
          variant: 'block',
          total: allUpcoming.length,
          visible: upcoming.length,
          step: 5,
          label: 'revisões',
          showMoreAction: 'changeUpcomingLimit(5)',
          showAllAction: 'showAllUpcoming()',
          showLessAction: upcomingVisible > 5 ? 'resetUpcomingLimit()' : '',
        }) +
        `<button class="btn ghost small upcoming-calendar-link" data-delegated-click="navigateKpi('calendario')">Ver todas no calendário</button>`;
    }
  }
}

/* ===== RENDER: DISCIPLINAS ===== */
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
  persistAndRender,
  renderAll,
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
  startTimer,
  populateTimerContextControls,
  openStudyTimerFocus,
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

function renderVerticalizedSyllabus() {
  subjectsTabController.renderVerticalizedSyllabus();
}

function renderSubjects() {
  subjectsTabController.renderSubjects();
}

function toggleNotes(topicId: string) {
  subjectsTabController.toggleNotes(topicId);
}
function changeSubjectTopicLimit(subjectId: string, delta: number) {
  subjectsTabController.changeSubjectTopicLimit(subjectId, delta);
}
function showAllSubjectTopics(subjectId: string) {
  subjectsTabController.showAllSubjectTopics(subjectId);
}
function resetSubjectTopicLimit(subjectId: string) {
  subjectsTabController.resetSubjectTopicLimit(subjectId);
}
function setSubjectTopicFilter(subjectId: string, field: string, value: any) {
  subjectsTabController.setSubjectTopicFilter(subjectId, field, value);
}
function setSubjectExamFilter(value: any) {
  subjectsTabController.setSubjectExamFilter(value);
}
function examBadges(topic: Record<string, any>) {
  return subjectsTabController.examBadges(topic);
}
function updateTopicTags(subjectId: string, topicId: string, value: any) {
  subjectsTabController.updateTopicTags(subjectId, topicId, value);
}
function updateTopicStrategy(subjectId: string, topicId: string, field: string, value: any) {
  subjectsTabController.updateTopicStrategy(subjectId, topicId, field, value);
}
function toggleTopicPrerequisite(
  subjectId: string,
  topicId: string,
  prerequisiteId: string,
  checked: boolean
) {
  subjectsTabController.toggleTopicPrerequisite(subjectId, topicId, prerequisiteId, checked);
}
function moveSubject(id: string, direction: number) {
  subjectsTabController.moveSubject(id, direction);
}
function duplicateSubject(id: string) {
  subjectsTabController.duplicateSubject(id);
}
function toggleSubject(id: string) {
  subjectsTabController.toggleSubject(id);
}
function renameSubject(id: string, name: string) {
  subjectsTabController.renameSubject(id, name);
}
function addSubject() {
  subjectsTabController.addSubject();
}
function carregarDisciplinasPadrao() {
  openExamImport();
}
document
  .getElementById('loadDefaultSubjectsBtn')!
  .addEventListener('click', carregarDisciplinasPadrao);
document.getElementById('verticalizedSyllabusToggleBtn')?.addEventListener('click', () => {
  subjectsTabController.setVerticalizedSyllabusActive(!subjectsTabController.isVerticalizedSyllabusActive());
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
    if (structuredImportOrigin === 'onboarding') suspendGuidedOnboarding();
  },
  onCancel: ({ completed }: any) => {
    if (structuredImportOrigin === 'onboarding') {
      resumeGuidedOnboarding(completed ? 'plan' : 'content');
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
const historicalExamImportController = createHistoricalExamImportController({
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
});
historicalExamImportController.mount();
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
  suspendGuidedOnboarding,
  resumeGuidedOnboarding,
  activateTab,
  persistAndRender,
  showToast,
  pluralize,
  nowISO,
  escapeHtml,
  escapeAttr,
  examBadges,
});
examImportModalController.mount();

async function openExamImport(
  initialPreset: string | Record<string, any> | null = null,
  origin: string | null = null
) {
  return examImportModalController.openExamImport(initialPreset, origin);
}

function archiveSubject(id: string) {
  subjectsTabController.archiveSubject(id);
}
function restoreSubject(id: string) {
  subjectsTabController.restoreSubject(id);
}
function getSubjectDependencies(subjectId: string) {
  return subjectsTabController.getSubjectDependencies(subjectId);
}
function requestPermanentSubjectDelete(id: string) {
  subjectsTabController.requestPermanentSubjectDelete(id);
}
function addTopic(subjectId: string) {
  subjectsTabController.addTopic(subjectId);
}
function archiveTopic(subjectId: string, topicId: string) {
  subjectsTabController.archiveTopic(subjectId, topicId);
}
function restoreTopic(subjectId: string, topicId: string) {
  subjectsTabController.restoreTopic(subjectId, topicId);
}
function getTopicDependencies(topicId: string) {
  return subjectsTabController.getTopicDependencies(topicId);
}
function requestPermanentTopicDelete(subjectId: string, topicId: string) {
  subjectsTabController.requestPermanentTopicDelete(subjectId, topicId);
}
function updateTopic(subjectId: string, topicId: string, field: string, value: any) {
  subjectsTabController.updateTopic(subjectId, topicId, field, value);
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
function refreshTopicReviewStats(topicId: string) {
  subjectsTabController.refreshTopicReviewStats(topicId);
}
function refreshAllTopicReviewStats() {
  subjectsTabController.refreshAllTopicReviewStats();
}
function updateTopicStatus(subjectId: string, topicId: string, selectEl: HTMLSelectElement) {
  subjectsTabController.updateTopicStatus(subjectId, topicId, selectEl);
}

/* ===== RENDER: CALENDÁRIO & REVISÕES UNIFICADAS ===== */
function toggleFilterPanel(scope: any) {
  const id =
    scope === 'agenda'
      ? 'agendaFilters'
      : scope === 'sessions'
        ? 'studySessionsFilters'
        : 'calendarFilters';
  const panel = document.getElementById(id),
    button = document.querySelector(`[aria-controls="${id}"]`);
  if (!panel) return;
  const expanded = !panel.classList.contains('show');
  panel.classList.toggle('show', expanded);
  button?.setAttribute('aria-expanded', String(expanded));
  if (scope === 'sessions') renderSessionHistoryFilterControls();
}

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
  persistAndRender,
  onCompleteAgendaReview: (id: string) => completeAgendaReview(id),
  isMobileHistoryLayout,
  renderCollectionFooter,
  escapeHtml,
  escapeAttr,
  pluralize,
  document,
});
calendarTabController.bindEvents();

const calendarUiState = calendarTabController.calendarUiState;

function getRevisoesUnificadas() {
  return calendarTabController.getRevisoesUnificadas();
}
function changeOverdueGroupLimit(elId: string, delta: number) {
  calendarTabController.changeOverdueGroupLimit(elId, delta);
}
function showAllOverdueGroups(elId: string) {
  calendarTabController.showAllOverdueGroups(elId);
}
function resetOverdueGroupLimit(elId: string) {
  calendarTabController.resetOverdueGroupLimit(elId);
}
function toggleOverdueDate(elId: string, date: string) {
  calendarTabController.toggleOverdueDate(elId, date);
}
function renderCalIndicadores() {
  calendarTabController.renderCalIndicadores();
}
function renderMonthCalendar() {
  calendarTabController.renderMonthCalendar();
}
function renderCalendarFilters() {
  calendarTabController.renderCalendarFilters();
}
function setCalendarMobileView(view: string) {
  calendarTabController.setCalendarMobileView(view);
}
function changeCalendarLimit(delta: number) {
  calendarTabController.changeCalendarLimit(delta);
}
function resetCalendarLimit() {
  calendarTabController.resetCalendarLimit();
}
function editCalendarItem(id: string) {
  calendarTabController.editCalendarItem(id);
}
function cancelCalendarEdit() {
  calendarTabController.cancelCalendarEdit();
}
function updateCalendarDraft(field: string, value: any) {
  calendarTabController.updateCalendarDraft(field, value);
}
function saveCalendarEdit() {
  calendarTabController.saveCalendarEdit();
}
function completeCalendarItem(id: string) {
  calendarTabController.completeCalendarItem(id);
}
function renderCalendar() {
  calendarTabController.renderCalendar();
}
function addCalRow() {
  calendarTabController.addCalRow();
}
function deleteCalRow(id: string) {
  calendarTabController.deleteCalRow(id);
}
function updateCal(id: string, field: string, value: any) {
  calendarTabController.updateCal(id, field, value);
}

document.getElementById('addSubjectBtn')!.addEventListener('click', addSubject);

/* ===== AGENDA DE REVISÕES ===== */
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
  refreshTopicReviewStats,
  showToast,
  showConfirm,
  persistAndRender,
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

const agendaUiState = reviewsTabController.agendaUiState;

function resetAdaptiveReviewDate(id: string) {
  reviewsTabController.resetAdaptiveReviewDate(id);
}
function gerarAgendaAutomatica() {
  reviewsTabController.gerarAgendaAutomatica();
}
function toggleCompletedReviews() {
  reviewsTabController.toggleCompletedReviews();
}
function changeAgendaLimit(group: string, delta: number) {
  reviewsTabController.changeAgendaLimit(group, delta);
}
function resetAgendaLimit(group: string) {
  reviewsTabController.resetAgendaLimit(group);
}
function editAgenda(id: string) {
  reviewsTabController.editAgenda(id);
}
function cancelAgendaEdit() {
  reviewsTabController.cancelAgendaEdit();
}
function updateAgendaDraft(field: string, value: any) {
  reviewsTabController.updateAgendaDraft(field, value);
}
function saveAgendaEdit() {
  reviewsTabController.saveAgendaEdit();
}
function closeReviewRating() {
  reviewsTabController.closeReviewRating();
}
function completeAgendaReview(id: string) {
  reviewsTabController.completeAgendaReview(id);
}
function rateCompletedReview(rating: any) {
  reviewsTabController.rateCompletedReview(rating);
}
function getTopicDifficulty(topicId?: string | null) {
  return reviewsTabController.getTopicDifficulty(topicId);
}
function adaptiveReviewSuggestion(topicId: string, baseDays: number, baseDate: string) {
  return reviewsTabController.adaptiveReviewSuggestion(topicId, baseDays, baseDate);
}
function renderAgenda() {
  reviewsTabController.renderAgenda();
}
function renderAgendaFilters() {
  reviewsTabController.renderAgendaFilters();
}
function addAgendaRow() {
  reviewsTabController.addAgendaRow();
}
function deleteAgendaRow(id: string) {
  reviewsTabController.deleteAgendaRow(id);
}
function updateAgenda(id: string, field: string, value: any) {
  reviewsTabController.updateAgenda(id, field, value);
}

/* ===== QUESTÕES & SIMULADOS ===== */
let performanceSubjectId: any = null;
let performanceViewMode = 'with-data';
const errorAnalysisView = { days: 30, topicId: '' };
let performanceVisible = DEFAULT_LIST_VISIBLE_ITEMS;
let retentionShowAll = false;
const retentionView: Record<string, any> = { subjectId: '', order: 'asc', confidence: 'all' };
function setPerformanceViewMode(mode: string) {
  performanceViewMode = ['with-data', 'insufficient', 'without-data', 'all'].includes(mode)
    ? mode
    : 'with-data';
  performanceVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  renderQuestionAnalytics();
}
function setErrorAnalysisFilter(field: string, value: any) {
  if (field === 'days' && [7, 30, 60, 90].includes(Number(value)))
    errorAnalysisView.days = Number(value);
  if (field === 'topicId') errorAnalysisView.topicId = value || '';
  renderQuestionAnalytics();
}
function changePerformanceLimit(_delta: number) {
  performanceVisible = Number.MAX_SAFE_INTEGER;
  renderQuestionAnalytics();
}
function showAllPerformance() {
  performanceVisible = Number.MAX_SAFE_INTEGER;
  renderQuestionAnalytics();
}
function resetPerformanceLimit() {
  performanceVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  renderQuestionAnalytics();
}
function showAllRetention() {
  retentionShowAll = true;
  renderTopicRetentionDashboard();
}
function resetRetentionLimit() {
  retentionShowAll = false;
  renderTopicRetentionDashboard();
}
function setRetentionFilter(field: string, value: any) {
  if (field in retentionView) retentionView[field] = value;
  retentionShowAll = false;
  renderTopicRetentionDashboard();
}
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
function isMobileHistoryLayout() {
  return window.matchMedia('(max-width:850px)').matches;
}

function renderListViewFooter(
  total: number,
  visible: number,
  step: number,
  showMoreAction: string,
  showLessAction: string,
  colspan: number,
  label: string
) {
  return renderCollectionFooter({
    total,
    visible,
    step,
    showMoreAction,
    showLessAction: visible > step ? showLessAction : '',
    colspan,
    label,
  });
}
function changeListLimit(key: string, delta: number, renderFn: () => void) {
  (listViewState as Record<string, any>)[`${key}Visible`] =
    delta > 0 ? Number.MAX_SAFE_INTEGER : DEFAULT_LIST_VISIBLE_ITEMS;
  renderFn();
}
function resetRecordListLimits() {
  Object.keys(LIST_VIEW_STEPS).forEach(key => {
    (listViewState as Record<string, any>)[`${key}Visible`] = DEFAULT_LIST_VISIBLE_ITEMS;
  });
  agendaUiState.upcomingVisible = agendaUiState.completedVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  upcomingVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  calendarUiState.visible = DEFAULT_LIST_VISIBLE_ITEMS;
  performanceVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  retentionShowAll = false;
}

function validQuestionRecords() {
  return state.questoes.filter(q => q.date && (Number(q.resolved) || 0) > 0);
}

let simulationsTabController: any = null;

const errorNotebookController = createErrorNotebookController({
  getState: () => state,
  getMount: () => document.getElementById('errorNotebookMount'),
  getMainContainer: () => document.getElementById('questionsMainContainer'),
  getToggleBtn: () => document.getElementById('errorNotebookToggleBtn'),
  getDueAgendaMount: () => document.getElementById('errorNotebookDueAgenda'),
  getDueTodayMount: () => document.getElementById('errorNotebookDueToday'),
  todayISO,
  nowISO,
  persistAndRender,
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
  renderQuestionAnalytics,
  simulationEditController: {
    get state() {
      return simulationsTabController?.simulationEditController?.state || { editingId: null, draft: null };
    },
  },
  openBreakdownIds: new Set<string>(),
  persistAndRender,
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

function normalizeErrorBreakdown(question: Record<string, any>) {
  return questionsTabController.normalizeErrorBreakdown(question);
}
function toggleQuestionErrors(id: string) {
  questionsTabController.toggleQuestionErrors(id);
}
function editQuestion(id: string) {
  questionsTabController.editQuestion(id);
}
function cancelQuestionEdit() {
  questionsTabController.cancelQuestionEdit();
}
function updateQuestionDraft(field: string, value: any) {
  questionsTabController.updateQuestionDraft(field, value);
}
function saveQuestionEdit() {
  questionsTabController.saveQuestionEdit();
}
function renderQuestoes() {
  questionsTabController.renderQuestoes();
}
function addQuestaoRow(initial: any = {}) {
  return questionsTabController.addQuestaoRow(initial);
}
function deleteQuestaoRow(id: string) {
  questionsTabController.deleteQuestaoRow(id);
}
function updateQuestionError(id: string, key: string, value: any) {
  questionsTabController.updateQuestionError(id, key, value);
}

function subjectAccuracyTarget(subjectId: string) {
  return resolveSubjectAccuracyTarget(subjectId, state.examBlueprint, state.metas.metaAprovacao);
}
function classifyAccuracy(accuracy: number | null, subjectId: string) {
  return classifyAccuracyTarget(accuracy, subjectAccuracyTarget(subjectId));
}
function getTopicPerformance(topicId: string) {
  return calculateTopicPerformance(validQuestionRecords(), topicId);
}
function getSubjectTopicPerformance(subjectId: string) {
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
  let last: any = null;
  const bump = (date: string) => {
    if (date && (!last || date > last)) last = date;
  };
  topicHistoryService
    .list({ topicId, includeLifecycle: false })
    .forEach(event => bump(eventLocalDate(event)!));
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

function renderQuestionAnalytics() {
  questionAnalyticsController.renderQuestionAnalytics();
}

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
  persistAndRender,
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

function simuladoEffectiveCounts(sim: Record<string, any>) {
  return simulationsTabController.simuladoEffectiveCounts(sim);
}
function simuladoNota(sim: Record<string, any>) {
  return simulationsTabController.simuladoNota(sim);
}
function toggleBreakdown(simuladoId: string) {
  simulationsTabController.toggleBreakdown(simuladoId);
}
function addBreakdownRow(simuladoId: string) {
  simulationsTabController.addBreakdownRow(simuladoId);
}
function updateBreakdownRow(simuladoId: string, breakdownId: string, field: string, value: any) {
  simulationsTabController.updateBreakdownRow(simuladoId, breakdownId, field, value);
}
function deleteBreakdownRow(simuladoId: string, breakdownId: string) {
  simulationsTabController.deleteBreakdownRow(simuladoId, breakdownId);
}
function editSimulation(id: string) {
  simulationsTabController.editSimulation(id);
}
function cancelSimulationEdit() {
  simulationsTabController.cancelSimulationEdit();
}
function updateSimulationDraft(field: string, value: any) {
  simulationsTabController.updateSimulationDraft(field, value);
}
function saveSimulationEdit() {
  simulationsTabController.saveSimulationEdit();
}
function renderSimulados() {
  simulationsTabController.renderSimulados();
}
function addSimuladoRow() {
  return simulationsTabController.addSimuladoRow();
}
function deleteSimuladoRow(id: string) {
  simulationsTabController.deleteSimuladoRow(id);
}

document.getElementById('addQuestaoRowBtn')!.addEventListener('click', addQuestaoRow);
document.getElementById('errorNotebookToggleBtn')?.addEventListener('click', () => {
  errorNotebookController.toggle();
  renderQuestoes();
});
document.getElementById('addSimuladoRowBtn')!.addEventListener('click', addSimuladoRow);

const questionImportService = createQuestionImportService({
  subjectService,
  questionService,
  getSubjects: () => state.subjects,
  getQuestions: () => state.questoes,
  errorCategoryKeys: Object.keys(ERROR_CATEGORIES),
  today: todayISO,
  // Repositórios leem state a cada chamada, então restaurar as chaves desfaz disciplinas, tópicos e questões criados.
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

/* ===== METAS ===== */
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function metaHoursForDate(date = todayISO()) {
  return goalsService.hoursForDate(date);
}
function metaHoursToday() {
  return metaHoursForDate(todayISO());
}
function updateMetaHoursDay(day: any, value: any, { refresh = true }: any = {}) {
  if (
    Number(day) >= 0 &&
    Number(day) <= 6 &&
    goalsService.hoursForDay(day) !== Math.max(0, Math.min(24, Number(value) || 0))
  )
    captureReadinessBeforeStrategy('Antes de alterar a disponibilidade semanal');
  studyPlanPreview = null;
  goalsService.updateDailyHours(day, value, {
    isToday: Number(day) === parseLocalDate(todayISO())!.getDay(),
  });
  if (refresh) persistAndRender();
  else scheduleSave();
}
function applyTodayGoalToAllDays() {
  const value = metaHoursToday();
  if (
    Array.from({ length: 7 }, (_, day) => goalsService.hoursForDay(day)).some(
      hours => hours !== value
    )
  )
    captureReadinessBeforeStrategy('Antes de redistribuir a disponibilidade semanal');
  goalsService.applyHoursToEveryDay(value);
  persistAndRender();
  showToast(`Meta de ${value}h aplicada a todos os dias.`);
}
function clearWeekendGoals() {
  if (goalsService.hoursForDay(0) || goalsService.hoursForDay(6))
    captureReadinessBeforeStrategy('Antes de remover a disponibilidade do fim de semana');
  goalsService.clearWeekend();
  persistAndRender();
  showToast('Metas do fim de semana removidas.');
}
function getGoalsTabController() {
  return createGoalsTabController({
    state,
    parseLocalDate,
    todayISO,
    buildWeeklyAvailability,
    formatPlanMinutes,
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
  });
}

function renderWeeklyHoursGoals() {
  const container = document.getElementById('weeklyHoursGoals');
  if (!container) return;
  getGoalsTabController().mountWeeklyAvailability(container);
}

function contarTopicosConcluidosNoPeriodo(pred: (event: any) => boolean) {
  const ids = new Set();
  topicCompletionEvents().forEach(event => {
    const date = eventLocalDate(event);
    if (date && pred(date) && event.topicId) ids.add(event.topicId);
  });
  return ids.size;
}
function somarQuestoesNaSemana() {
  return state.questoes
    .filter(q => isSameWeek(q.date))
    .reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
}
function contarSimuladosNaSemana() {
  return state.simulados.filter(s => isSameWeek(s.date)).length;
}

function renderMetas() {
  const container = document.getElementById('metasContainer');
  if (container) {
    const hasAccuracyEvidence =
      state.questoes.some(item => Number(item.resolved) > 0) ||
      state.simulados.some(item => Number(item.total) > 0);
    getGoalsTabController().renderMetas(container, {
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

function renderPlanExecution() {
  const container = document.getElementById('planExecutionResults');
  if (!container) return;
  getGoalsTabController().mountPlanExecution(container);
}

function updateMeta(key: string, value: any) {
  if (
    key === 'metaAprovacao' &&
    (state.metas as Record<string, any>)[key] !== Math.max(0, Math.min(100, Number(value) || 0))
  )
    captureReadinessBeforeStrategy('Antes de alterar a meta de nota');
  if (goalsService.update(key, value) === false) {
    showToast('Informe uma meta de aderência entre 50 e 100%.');
    return;
  }
  persistAndRender();
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
  persistAndRender,
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

function renderExamIntelligenceSection() {
  examMatrixController.renderExamIntelligenceSection();
}
function renderExamBlueprintConfig() {
  examMatrixController.renderExamBlueprintConfig();
}
let studyPlanPreview: any = null,
  dailyPlanPreview: any = null;
function studyPlanCandidates(options?: any) {
  return studyPlanBuilderController.studyPlanCandidates(options);
}
function buildCurrentStudyPlanProposal(options?: any) {
  return studyPlanBuilderController.buildCurrentStudyPlanProposal(options);
}
function calculateStudyPlanPreview() {
  studyPlanBuilderController.calculateStudyPlanPreview();
  studyPlanPreview = studyPlanBuilderController.getStudyPlanPreview();
}
function useAdaptivePlanAdvice() {
  studyPlanBuilderController.useAdaptivePlanAdvice();
  studyPlanPreview = studyPlanBuilderController.getStudyPlanPreview();
}
function rejectAdaptivePlanAdvice() {
  studyPlanBuilderController.rejectAdaptivePlanAdvice();
  studyPlanPreview = studyPlanBuilderController.getStudyPlanPreview();
}
function clearStudyPlanPreview() {
  studyPlanBuilderController.clearStudyPlanPreview();
  studyPlanPreview = null;
}
function confirmStudyPlan() {
  studyPlanBuilderController.confirmStudyPlan();
  studyPlanPreview = null;
  dailyPlanPreview = null;
}
async function revertAdaptivePlanningDecision(id: string) {
  return studyPlanBuilderController.revertAdaptivePlanningDecision(id);
}
function latestStudyPlan() {
  return studyPlanBuilderController.latestStudyPlan();
}
function calculateDailyPlanPreview() {
  studyPlanBuilderController.calculateDailyPlanPreview();
  dailyPlanPreview = studyPlanBuilderController.getDailyPlanPreview();
}
function clearDailyPlanPreview() {
  studyPlanBuilderController.clearDailyPlanPreview();
  dailyPlanPreview = null;
}
function confirmDailyPlanPreview() {
  studyPlanBuilderController.confirmDailyPlanPreview();
  dailyPlanPreview = null;
}
function undoLatestDailyPlanGeneration() {
  studyPlanBuilderController.undoLatestDailyPlanGeneration();
}
function weeklyStrategyCapacity() {
  return Object.values(state.metas.horasPorDia || {}).reduce<number>(
    (sum, hours) => sum + Math.max(0, Number(hours) || 0) * 60,
    0
  );
}
function previewPhaseStrategy() {
  studyPlanBuilderController.previewPhaseStrategy();
}
function cancelPhaseStrategy() {
  studyPlanBuilderController.cancelPhaseStrategy();
}
function confirmPhaseStrategy() {
  studyPlanBuilderController.confirmPhaseStrategy();
}
function revertPhaseStrategy() {
  studyPlanBuilderController.revertPhaseStrategy();
}
function renderStudyPlanBuilder() {
  studyPlanBuilderController.renderStudyPlanBuilder();
}
function updateExamBlueprint(field: string, value: any, { refresh = true }: any = {}) {
  const nextValue =
    field === 'examDate'
      ? value || null
      : field === 'targetScore'
        ? Math.max(0, Math.min(100, Number(value) || 0))
        : field === 'masteryTarget'
          ? Math.max(0, Math.min(100, Number(value) || 80))
          : undefined;
  if (nextValue !== undefined && (state.examBlueprint as Record<string, any>)[field] !== nextValue)
    captureReadinessBeforeStrategy(
      'Antes de alterar ' +
        (
          {
            examDate: 'a data da prova',
            targetScore: 'a meta de nota',
            masteryTarget: 'a meta de domínio',
          } as Record<string, any>
        )[field]
    );
  studyPlanPreview = null;
  const previousPhase =
    field === 'examDate'
      ? resolveExamPhase(state.examDate ? diasParaRevisao(state.examDate) : null)
      : null;
  if (field === 'examDate') {
    state.examBlueprint.examDate = value || null;
    state.examDate = value || '';
  }
  if (field === 'targetScore') {
    const target = Math.max(0, Math.min(100, Number(value) || 0));
    state.examBlueprint.targetScore = target;
    goalsService.update('metaAprovacao', target);
  }
  if (field === 'masteryTarget')
    state.examBlueprint.masteryTarget = Math.max(0, Math.min(100, Number(value) || 80));
  state.examBlueprint.configuredAt = nowISO();
  if (refresh) persistAndRender();
  else scheduleSave();
  if (field === 'examDate' && previousPhase?.state && previousPhase.state !== 'undated') {
    const nextPhase = resolveExamPhase(state.examDate ? diasParaRevisao(state.examDate) : null);
    if (nextPhase.state !== previousPhase.state && nextPhase.state !== 'undated')
      showToast(`Você entrou na fase de ${nextPhase.label}. ${nextPhase.strategy}`);
  }
}
function updateExamSubject(subjectId: string, field: string, value: any) {
  studyPlanPreview = null;
  let config = state.examBlueprint.subjects.find(item => item.subjectId === subjectId);
  const nextValue =
    field === 'expectedQuestions'
      ? Math.max(0, Math.round(Number(value) || 0))
      : field === 'questionWeight'
        ? Math.max(0.1, Number(value) || 1)
        : field === 'masteryTarget'
          ? value === ''
            ? null
            : Math.max(0, Math.min(100, Number(value) || 0))
          : field === 'priority' && EXAM_PRIORITIES.includes(value)
            ? value
            : undefined;
  if (
    nextValue !== undefined &&
    (!config ||
      (config as Record<string, any>)[field] !== nextValue ||
      (['expectedQuestions', 'questionWeight'].includes(field) && config.official))
  )
    captureReadinessBeforeStrategy('Antes de alterar a configuração estratégica da disciplina');
  if (!config) {
    config = {
      subjectId,
      expectedQuestions: 0,
      questionWeight: 1,
      priority: 'normal',
      masteryTarget: null,
    };
    state.examBlueprint.subjects.push(config);
  }
  if (field === 'expectedQuestions')
    config.expectedQuestions = Math.max(0, Math.round(Number(value) || 0));
  if (field === 'questionWeight') config.questionWeight = Math.max(0.1, Number(value) || 1);
  if (field === 'expectedQuestions' || field === 'questionWeight') {
    config.sourceRef = null;
    config.official = false;
    config.mappingType = null;
  }
  if (field === 'priority' && EXAM_PRIORITIES.includes(value)) config.priority = value;
  if (field === 'masteryTarget')
    config.masteryTarget = value === '' ? null : Math.max(0, Math.min(100, Number(value) || 0));
  state.examBlueprint.configuredAt = nowISO();
  persistAndRender();
}
function saveExamSubjectConfig(subjectId: string) {
  examMatrixController.saveExamSubjectConfig(subjectId);
}
function cancelExamSubjectConfig() {
  examMatrixController.cancelExamSubjectConfig();
}
function toggleActiveExamTag(tag: string, checked: boolean) {
  examMatrixController.toggleActiveExamTag(tag, checked);
}

/* ===== METAS POR DISCIPLINA ===== */
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
  persistAndRender,
  captureReadinessBeforeStrategy,
  invalidatePlanPreview: () => {
    studyPlanPreview = null;
  },
});
subjectTargetEditorController.bindEvents();

function renderSubjectTargetEditor() {
  subjectTargetEditorController.renderSubjectTargetEditor();
}
function somarQuestoesDisciplinaNaSemana(subjectId: string) {
  return state.questoes
    .filter(q => entitySubjectId(q) === subjectId && isSameWeek(q.date))
    .reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
}
function renderMetasPorDisciplina() {
  const container = document.getElementById('metasPorDisciplinaContainer');
  if (!container) return;
  const sel = document.getElementById('novaMetaDisciplinaSelect') as HTMLSelectElement | null;
  getGoalsTabController().renderMetasPorDisciplina(container, sel);
}
function addMetaDisciplina() {
  const subjectId = (document.getElementById('novaMetaDisciplinaSelect') as HTMLSelectElement)
    .value;
  const meta =
    Number((document.getElementById('novaMetaDisciplinaValor') as HTMLInputElement).value) || 20;
  if (!subjectId) {
    showToast('Cadastre uma disciplina primeiro.');
    return;
  }
  if (state.metasPorDisciplina.some(md => entitySubjectId(md) === subjectId)) {
    showToast('Já existe uma meta pra essa disciplina.');
    return;
  }
  subjectGoalService.create({ subjectId, meta });
  persistAndRender();
}
function updateMetaDisciplina(id: string, value: any) {
  subjectGoalService.update(id, { meta: Number(value) || 1 });
  persistAndRender();
}
function deleteMetaDisciplina(id: string) {
  subjectGoalService.remove(id);
  persistAndRender();
}
document.getElementById('addMetaDisciplinaBtn')!.addEventListener('click', addMetaDisciplina);

/* ===== HISTÓRICO DE METAS (retroativo, últimas 8 semanas) ===== */
function getWeekStartMinus(weeksAgo: number) {
  const currentWeekStart = startOfWeek(todayISO());
  return addDays(currentWeekStart, -7 * weeksAgo);
}
function computeWeeklyHistory(numWeeks: number) {
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
function renderHistoricoMetas() {
  const container = document.getElementById('historicoMetasContainer');
  if (!container) return;
  getGoalsTabController().renderHistoricoMetas(container, computeWeeklyHistory(8));
}

function renderSelectedPeriodComparison() {
  const container = document.getElementById('periodComparisonResults');
  const preset = document.getElementById('periodComparisonPreset') as HTMLSelectElement | null;
  if (!container || !preset) return;
  const startWrap = document.getElementById('periodComparisonStartWrap');
  const endWrap = document.getElementById('periodComparisonEndWrap');
  const startInput = document.getElementById('periodComparisonStart') as HTMLInputElement | null;
  const endInput = document.getElementById('periodComparisonEnd') as HTMLInputElement | null;
  getGoalsTabController().renderSelectedPeriodComparison(
    container,
    preset,
    startInput,
    endInput,
    startWrap,
    endWrap
  );
}

/* ===== ESTIMATIVA DE RITMO ===== */
function computeRitmo() {
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
function renderRitmo() {
  const r = computeRitmo();
  const container = document.getElementById('ritmoContainer');

  if (r.status === 'sem-topicos') {
    container!.innerHTML = `<div class="upcoming-empty">Adicione disciplinas e tópicos para ver a estimativa de ritmo aqui.</div>`;
    return;
  }
  if (r.status === 'completo') {
    container!.innerHTML = `<div class="pace-block"><div class="pace-status ok">🎉 Todos os tópicos cadastrados já foram concluídos!</div></div>`;
    return;
  }
  if (r.status === 'sem-dados') {
    container!.innerHTML = `<div class="pace-block">
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining === 1 ? '' : 's'} pra concluir o plano.</div>
      <div class="pace-status neutral">Ainda sem tópicos concluídos nos últimos 14 dias — sem dados suficientes pra estimar o ritmo ainda.</div>
    </div>`;
    return;
  }

  const ritmoTxt =
    r.ratePerDay! >= 1
      ? `${r.ratePerDay!.toFixed(1)} tópicos por dia`
      : `${formatDecimal(r.ratePerDay! * 7)} tópicos por semana`;

  let statusHtml = '';
  if (r.comparativo === 'no-prazo') {
    const folga = r.daysToExam! - r.daysNeeded!;
    statusHtml = `<div class="pace-status ok">🟢 No ritmo atual, você termina com ${folga} dia${folga === 1 ? '' : 's'} de folga antes da prova.</div>`;
  } else if (r.comparativo === 'atrasado') {
    const atraso = r.daysNeeded! - r.daysToExam!;
    statusHtml = `<div class="pace-status warn">🔴 No ritmo atual, você terminaria ${atraso} dia${atraso === 1 ? '' : 's'} depois da prova. Considere acelerar ou rever o plano.</div>`;
  } else {
    statusHtml = `<div class="pace-status neutral">Defina a data da prova na Visão Geral pra comparar com o prazo.</div>`;
  }

  container!.innerHTML = `
    <div class="pace-block">
      <div class="pace-line">Nos últimos 14 dias você concluiu em média <strong>${ritmoTxt}</strong>.</div>
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining === 1 ? '' : 's'} — no ritmo atual, você termina em <strong>${r.daysNeeded} dia${r.daysNeeded === 1 ? '' : 's'}</strong> (${formatDatePt(r.finishDate!)}).</div>
      ${statusHtml}
    </div>
  `;
}

function revisoesAtrasadas() {
  const isCurrent = (item: Record<string, any>) =>
    isActiveStudyReference(entitySubjectId(item), item.topicId || item.topicRef || null);
  return calculateOverdueReviewsCount({
    calendarItems: state.calendar,
    reviewAgendaItems: state.reviewAgenda,
    today: todayISO(),
    isCurrentReference: isCurrent,
  });
}

/* ===== TAXA DE ERRO / ÚLTIMA ATIVIDADE POR DISCIPLINA ===== */
function taxaErroDisciplina(subjectId: string) {
  return calculateSubjectErrorRate(subjectId, state.questoes, state.simulados, entitySubjectId);
}
function ultimaAtividadeDisciplina(subjectId: string) {
  return findSubjectLatestActivityDate({
    subjectId,
    topicHistoryDates: topicHistoryService
      .list({ subjectId, includeLifecycle: false })
      .map(event => eventLocalDate(event)),
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

/* ===== PRIORIDADE INTELIGENTE DE ESTUDOS (Score 0-100) ===== */
/* Prioridade compartilhada com recomendações e planejamento semanal. */

function proximidadeProvaScore() {
  if (!state.examDate) return 0;
  const dias = diasParaRevisao(state.examDate);
  if (dias === null) return 0;
  return Math.max(0, Math.min(100, 100 - dias));
}
function collectStudyCandidates() {
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
        (!topicId || topicInActiveExamScope((getTopicById(topicId)?.topic)!))
      );
    })
    .forEach(review => {
      const subjectId = entitySubjectId(review);
      const topicId = review.topicId || review.topicRef || null;
      const diagnosis = topicId ? diagnoseTopic(subjectId, topicId) : null;
      addCandidate(topicId || 'review:' + review.id, {
        id: 'review-' + review.id,
        subjectId,
        topicId,
        subjectName: entitySubjectName(review),
        topicName: topicId ? getTopicName(topicId) : review.topic || review.tipo || 'Revisão',
        tipo: 'revisão',
        dificuldade: getTopicDifficulty(topicId!),
        diasAtrasado: Math.max(0, -(diasParaRevisao(review.date) ?? 0)),
        erroQuestoes: diagnosis?.effectiveErrorRate ?? taxaErroDisciplina(subjectId),
        diasSemEstudar: diagnosis?.daysSinceStudy ?? diasSemEstudarDisciplina(subjectId),
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
    return 'Tendência em queda (' + diagnosis.trend.delta.toFixed(1) + ' p.p.)';
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

/* ===== RADAR DE DISCIPLINAS ===== */
function subjectRadarModel(subject: Record<string, any>) {
  const topics = subject.topics.filter((topic: any) => !topic.archived),
    coverage = topics.length ? subjectProgress(subject) : null;
  const masteryValues = topics
    .map((topic: any) => topicMasteryIndex(subject.id, topic.id))
    .filter((item: any) => item.confidence > 0);
  const retentionValues = topics
    .map((topic: any) => topicRetentionScore(subject.id, topic.id))
    .filter((item: any) => item.available);
  const mastery = masteryValues.length
    ? masteryValues.reduce((sum: any, item: any) => sum + item.score, 0) / masteryValues.length
    : null;
  const retention = retentionValues.length
    ? retentionValues.reduce((sum: any, item: any) => sum + item.score, 0) / retentionValues.length
    : null;
  const last = ultimaAtividadeDisciplina(subject.id),
    distance = last ? diasParaRevisao(last) : null,
    daysSinceContact = distance === null ? null : Math.max(0, -distance);
  const cutoff = addDays(todayISO(), -27),
    activeDates = new Set();
  state.studySessions
    .filter(item => entitySubjectId(item) === subject.id && item.date >= cutoff)
    .forEach(item => activeDates.add(item.date));
  state.questoes
    .filter(item => entitySubjectId(item) === subject.id && item.date >= cutoff)
    .forEach(item => activeDates.add(item.date));
  const result = calculateSubjectRadar({
    coverage,
    mastery,
    retention,
    daysSinceContact,
    activeDays: activeDates.size || null,
  });
  return { ...result, id: subject.id, name: subject.name };
}

function setRadarSubject(slot: string, value: any) {
  performanceTabController.setRadarSubject(slot, value);
}

function renderRadarDisciplinas() {
  performanceTabController.renderRadarDisciplinas();
}

/* ===== SIMULADOS PLANEJADOS ===== */
function renderSimuladosPlanejados() {
  const ul = document.getElementById('hojeSimuladosPlanejados');
  if (!ul) return;
  const today = todayISO();
  const planejados = state.simulados
    .filter(
      s =>
        s.date >= today &&
        (Number(s.correct) || 0) === 0 &&
        (Number(s.total) || 0) === 0 &&
        (!s.breakdown || s.breakdown.length === 0)
    )
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  if (planejados.length === 0) {
    ul.innerHTML = `<li class="upcoming-empty">Nenhum simulado planejado. Registre um com data futura na aba Questões &amp; Simulados pra ele aparecer aqui.</li>`;
  } else {
    ul.innerHTML = planejados
      .map(
        s => `
      <li>
        <span class="upcoming-date">${formatDatePt(s.date)}</span>
        <span style="flex:1;">${escapeHtml(s.nome || 'Simulado sem nome')}</span>
        <span class="subject-progress-pill">${s.date === today ? 'hoje' : 'planejado'}</span>
      </li>
    `
      )
      .join('');
  }
}

/* ===== METAS DE HOJE ===== */
function formatHoras(decimalHoras: number) {
  const totalMin = Math.round(decimalHoras * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}
function totalStudySeconds(filterFn: (session: any) => boolean) {
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

function studySecondsByDate(sessions = state.studySessions) {
  const map: Record<string, any> = {};
  sessions.forEach(s => {
    if (!s.date) return;
    map[s.date] = (map[s.date] || 0) + (Number(s.durationSeconds) || 0);
  });
  return map;
}

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
  persistAndRender,
  renderHeatmap,
  escapeHtml,
  escapeAttr,
  pluralize,
  document,
});

function renderSessionHistoryFilterControls() {
  sessionHistoryController.renderSessionHistoryFilterControls();
}
function updateStudySessionDraft(field: string, value: any) {
  sessionHistoryController.updateStudySessionDraft(field, value);
}
function syncQuestionFromStudySession(session: Record<string, any>) {
  return sessionHistoryController.syncQuestionFromStudySession(session);
}
function updateSessionHistoryFilter(field: string, value: any) {
  sessionHistoryController.updateSessionHistoryFilter(field, value);
}
function clearSessionHistoryFilters() {
  sessionHistoryController.clearSessionHistoryFilters();
}
function selectSessionHistoryDate(date: string) {
  sessionHistoryController.selectSessionHistoryDate(date);
}
function toggleSessionDay(date: string) {
  sessionHistoryController.toggleSessionDay(date);
}
function toggleSessionDetails(id: string) {
  sessionHistoryController.toggleSessionDetails(id);
}
function renderStudySessionsHistory() {
  sessionHistoryController.renderStudySessionsHistory();
}
function editStudySession(id: string) {
  sessionHistoryController.editStudySession(id);
}
function saveStudySessionEdit() {
  sessionHistoryController.saveStudySessionEdit();
}
function deleteStudySession(id: string) {
  sessionHistoryController.deleteStudySession(id);
}
function cancelStudySessionEdit() {
  sessionHistoryController.cancelStudySessionEdit();
}

/* ===== ALERTAS INTELIGENTES ===== */
function computeAlertasInteligentes() {
  const today = todayISO(),
    scope = examEvidenceContext(),
    scopedQuestions = scope.questions.included;
  const eligibleSubjectIds = new Set(examScopedTopics().map(topic => topic.subjectId));
  const subjects = activeSubjects()
    .filter(subject => eligibleSubjectIds.has(subject.id))
    .map(subject => {
      const trend = calculateWeightedTrend(getSubjectWeeklyTrend(subject.id, 8, scopedQuestions));
      const lastSession = scope.sessions.included
        .filter(session => entitySubjectId(session) === subject.id && session.date)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
      const lastStudyDay = parseLocalDate(lastSession?.date);
      const daysSinceStudy = lastStudyDay
        ? Math.max(0, Math.floor((Number(parseLocalDate(today)) - Number(lastStudyDay)) / 86400000))
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
    topics: studyPlanCandidates(),
    weeklyAvailableMinutes,
    weeksUntilExam: days === null ? 0 : Math.max(0, days / 7),
  });
  const dayOfWeek = parseLocalDate(today)!.getDay(),
    elapsed = dayOfWeek === 0 ? 7 : dayOfWeek,
    expectedFrac = elapsed / 7;
  const weekStart = startOfWeek(today),
    achieved = uniqueTopicsCompletedBetween(weekStart, addDays(weekStart, 6));
  const actualFrac = state.metas.semanal > 0 ? achieved / state.metas.semanal : 1;
  const weeklyGoalGap =
    expectedFrac >= 0.5 && actualFrac < expectedFrac - 0.15
      ? Math.round((expectedFrac - actualFrac) * 100)
      : null;
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

let currentStudyRecommendations: any[] = [];
let currentConsolidatedDiagnosis: any = null;

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
  analysisContextBanner,
  renderNextBestAction,
  getDailyPriority: (action: any) => dailyExecutionController.build(action)?.priority,
  renderPreparationSignals,
  buildDecisionCoherenceReport,
  renderDecisionCoherenceDebug,
  buildStudyAction,
  recommendationActionLabel,
  getCurrentStudyRecommendations: () => currentStudyRecommendations,
  setCurrentConsolidatedDiagnosis: diag => {
    currentConsolidatedDiagnosis = diag;
  },
  latestStudyPlan,
  weeklyStrategyCapacity,
  locationSearch: () => location.search,
});

function renderAlertasInteligentes() {
  diagnosticsTabController.renderAlertasInteligentes();
}
function dismissIntelligentAlert(id: string) {
  diagnosticsTabController.dismissIntelligentAlert(id);
}

function renderExecutiveSummary() {
  diagnosticsTabController.renderExecutiveSummary();
}

// One render pass asks for the candidates in ~28 places; computing them once per pass saves
// seconds on long histories. Outside a render every call recomputes, so edits are never stale.
let masterRenderer: ReturnType<typeof createMasterRenderer>;
let renderCandidates: any = null;
function intelligenceCandidates() {
  if (renderCandidates) return renderCandidates;
  const candidates = computeIntelligenceCandidates();
  if (masterRenderer?.isRendering()) renderCandidates = candidates;
  return candidates;
}
function computeIntelligenceCandidates() {
  const priorities = collectStudyCandidates(),
    topics = allTopics();
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
function renderDiagnosisCenter() {
  diagnosticsTabController.renderDiagnosisCenter();
}
createDiagnosisController({
  document,
  refreshRecommendations: refreshStudyRecommendationItems,
  getRecommendations: () => currentStudyRecommendations,
  onStale: () => {
    showToast('A recomendação mudou. Atualize o diagnóstico antes de pré-visualizar.');
    renderDiagnosisCenter();
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
    const allTopics = activeTopics();
    const covered = allTopics.filter(
      t => t.status === 'Concluído' || t.status === 'Em andamento' || (t.completionCount ?? 0) > 0
    );
    return {
      readinessScore: readinessResult(metrics).value,
      weeklyStudyMinutes: weeklyStrategyCapacity(),
      totalTopicsCount: allTopics.length,
      coveredTopicsCount: covered.length,
    };
  },
});

let todayTabController: ReturnType<typeof createTodayTabController>;
let studyRecommendationController: ReturnType<typeof createStudyRecommendationController>;
let onboardingModalController: ReturnType<typeof createOnboardingModalController>;
let dashboardTabController: ReturnType<typeof createDashboardTabController>;
let studyPlanBuilderController: ReturnType<typeof createStudyPlanBuilderController>;
let weeklyCloseModalController: ReturnType<typeof createWeeklyCloseModalController>;
let performanceTabController: ReturnType<typeof createPerformanceTabController>;

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
  hasStartedStudyTimer,
  openStudyTimerFocus,
  startPlannedActivity,
  openGuidedOnboarding: (opts?: any) => onboardingModalController.openGuidedOnboarding(opts),
  guidedTourController,
  whatIfController,
  latestStudyPlan,
  weeklyStrategyCapacity,
  computeStudyPriorities,
  getCurrentStudyRecommendations: () => studyRecommendationController.getCurrentRecommendations(),
  refreshStudyRecommendationItems: (opts?: any) => studyRecommendationController.refreshStudyRecommendationItems(opts),
  renderOverviewDecisionArea: () => studyRecommendationController.renderOverviewDecisionArea(),
  uniqueTopicsCompletedBetween,
  getRevisoesUnificadas,
  segundosEstudadosHoje,
  diasParaRevisao,
  startOfWeek,
});

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
  renderRecommendationHistorySummary,
  getTopicName,
  getSubjectName,
  getTopicById,
  getTopicPerformance,
  needsMaintenance,
  activeTopics,
  dailyExecutionController: { build: (action?: any) => todayTabController.dailyExecutionController.build(action) },
  hasStartedStudyTimer,
  activeTimerMatchesRecommendation,
  renderActiveStudyTimerNotice,
  openStudyTimerFocus,
  topicResumeLabel,
  guidedStudyService,
  todayDailyStudyPlan: () => todayTabController.todayDailyStudyPlan(),
  freezePlanExecution,
  startPlannedActivity,
  addQuestaoRow,
  activateTab,
  reviewService,
  completeAgendaReview,
  validQuestionRecords,
  renderFinalStretchBanner: () => todayTabController.renderFinalStretchBanner(),
  renderAlertasInteligentes,
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
  persistAndRender,
  buildStudyPlanProposal: (opts?: any) => buildCurrentStudyPlanProposal(opts),
  calculateStudyPlanPreview,
  getStudyPlanPreview: () => studyPlanPreview,
  confirmStudyPlan,
  calculateDailyPlanPreview,
  getDailyPlanPreview: () => dailyPlanPreview,
  confirmDailyPlanPreview,
  render,
  activateTab,
  syncModalShell: () => syncModalShell(),
  openExamImport: (presetId: string, source: string) => openExamImport(presetId, source),
  onStructuredImport: () => {
    structuredImportOrigin = 'onboarding';
    structuredImportController.choose();
  },
  updateExamBlueprint: (field: string, val: any, opts?: any) => updateExamBlueprint(field as any, val, opts),
  updateMetaHoursDay: (day: string, hours: string, opts?: any) => updateMetaHoursDay(day, hours, opts),
});

/* ===== RECOMENDAÇÕES E REPLANEJAMENTO ===== */
function refreshStudyRecommendationItems(opts?: any) {
  const result = studyRecommendationController.refreshStudyRecommendationItems(opts);
  currentStudyRecommendations = studyRecommendationController.getCurrentRecommendations();
  return result;
}
function renderOverviewDecisionArea() {
  studyRecommendationController.renderOverviewDecisionArea();
}
function renderStudyRecommendation() {
  studyRecommendationController.renderStudyRecommendation();
}
function dismissStudyRecommendation(id: string) {
  studyRecommendationController.dismissStudyRecommendation(id);
}
function markRecommendationNotUseful(id: string) {
  studyRecommendationController.markRecommendationNotUseful(id);
}
function rateRecommendationOutcome(recommendationId: string, useful: boolean) {
  studyRecommendationController.rateRecommendationOutcome(recommendationId, useful);
}
function startStudyRecommendation(id: string, source = 'today') {
  studyRecommendationController.startStudyRecommendation(id, source);
}
function executeStudyRecommendation(id: string, source = 'today') {
  return studyRecommendationController.executeStudyRecommendation(id, source);
}
function calculateReplanPreview() {
  return studyRecommendationController.calculateReplanPreview();
}
function clearReplanPreview() {
  return studyRecommendationController.clearReplanPreview();
}
function confirmReplan() {
  return studyRecommendationController.confirmReplan();
}
function undoPlanAdjustment(id: string) {
  return studyRecommendationController.undoPlanAdjustment(id);
}
function renderWeeklyReplan() {
  studyRecommendationController.renderWeeklyReplan();
}
function measureRecommendationResults(session: Record<string, any>) {
  studyRecommendationController.measureRecommendationResults(session);
}

/* ===== PLANO DE HOJE & EXECUÇÃO DIÁRIA ===== */
const dailyExecutionController = todayTabController.dailyExecutionController;
function dismissFirstSteps() {
  todayTabController.dismissFirstSteps();
}
function restoreFirstSteps() {
  todayTabController.restoreFirstSteps();
}
function renderFirstStepsMissionCard() {
  todayTabController.renderFirstStepsMissionCard();
}
function renderDailyExecutionCard() {
  todayTabController.renderDailyExecutionCard();
}
document.addEventListener('click', event => {
  const start = (event.target as HTMLElement).closest?.<HTMLElement>('[data-daily-start]');
  if (start) {
    const result = dailyExecutionController.start(start.dataset.dailyStart!);
    if (result.state === 'unavailable') showToast('A atividade mudou. Confira o plano atual.');
    if (result.state === 'blocked') showToast('Finalize a sessão atual antes de iniciar outra.');
    renderDailyExecutionCard();
    renderOverviewDecisionArea();
  }
  if ((event.target as HTMLElement).closest?.('[data-daily-resume]')) openStudyTimerFocus();
  if ((event.target as HTMLElement).closest?.('[data-open-what-if]')) whatIfController.open();
});
function renderPlanoHoje() {
  todayTabController.renderPlanoHoje();
}
function renderMetasHoje() {
  todayTabController.renderMetasHoje();
}

/* ===== ONBOARDING 2.0 ===== */
function renderGuidedOnboarding() {
  onboardingModalController.renderGuidedOnboarding();
}
function onboardingModel() {
  return onboardingModalController.onboardingModel();
}
function moveOnboarding(direction: number) {
  onboardingModalController.moveOnboarding(direction);
}
function openGuidedOnboarding(opts?: any) {
  return onboardingModalController.openGuidedOnboarding(opts);
}
function suspendGuidedOnboarding() {
  onboardingModalController.suspendGuidedOnboarding();
}
function resumeGuidedOnboarding(step = 'content') {
  onboardingModalController.resumeGuidedOnboarding(step);
}
function closeGuidedOnboarding(opts?: any) {
  onboardingModalController.closeGuidedOnboarding(opts);
}
function setGuidedSubjectLevel(subjectId: string, level: string, opts?: any) {
  onboardingModalController.setGuidedSubjectLevel(subjectId, level, opts);
}
function createGuidedInitialPlan() {
  onboardingModalController.createGuidedInitialPlan();
}
function syncGuidedNext(model: Record<string, any>) {
  onboardingModalController.syncGuidedNext(model);
}

/* ===== DASHBOARD DE APROVAÇÃO ===== */
function approvalSimuladosMetric() {
  const completed = examScopedSimulations()
    .filter(sim => simuladoEffectiveCounts(sim).total > 0)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(sim => ({
      nota: simuladoNota(sim),
      totalQuestions: simuladoEffectiveCounts(sim).total,
    }));
  return calculateApprovalSimuladosMetric(completed);
}

function approvalAcertosMetric() {
  return calculateApprovalAcertosMetric(examEvidenceContext().questions.included);
}

function approvalEditalMetric() {
  const topics = examScopedTopics();
  const concluded = topics.filter(t => t.status === 'Concluído').length;
  const subjectsWithTopics = activeSubjects().filter(s => s.topics.some(t => !t.archived)).length;
  return calculateApprovalEditalMetric({
    totalTopicsCount: topics.length,
    concludedTopicsCount: concluded,
    subjectsWithTopicsCount: subjectsWithTopics,
  });
}

function approvalDominioMetric() {
  const topics = examScopedTopics();
  const values = topics.map(topic => topicMasteryIndex(topic.subjectId, topic.id));
  return calculateApprovalDominioMetric({
    topicMasteries: values,
    totalTopicsCount: topics.length,
  });
}

function approvalRevisoesMetric() {
  const today = todayISO();
  const due = examScopedRecords(getRevisoesUnificadas()).filter(r => r.date && r.date <= today);
  const items = due.map(r => ({
    status: r.status,
    daysLate: Math.max(0, -(diasParaRevisao(r.date) || 0)),
  }));
  return calculateApprovalRevisoesMetric(items);
}

function approvalTendenciaMetric() {
  const simulations = examScopedSimulations()
    .filter(sim => simuladoEffectiveCounts(sim).total > 0)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(simuladoNota);
  return calculateApprovalTendenciaMetric(simulations);
}

function approvalPrazoMetric() {
  return calculateApprovalPrazoMetric({
    ritmo: computeRitmo(),
    hasExamDate: Boolean(state.examDate),
  });
}

function readinessFactors(metrics: Record<string, any>) {
  const m = metrics || computeApprovalMetrics();
  return extractReadinessFactors(m as any);
}
function readinessResult(metrics: Record<string, any>) {
  return calculateReadinessScore(readinessFactors(metrics), READINESS_WEIGHTS);
}
function indiceProntidao(metrics: Record<string, any>) {
  return readinessResult(metrics).value ?? 0;
}
function projectPerformance() {
  const calibration = buildCalibratedScoreProjection({
    simulations: examScopedSimulations().map(item => ({
      ...item,
      ...simuladoEffectiveCounts(item),
      breakdown: (item.breakdown || []).map(row => ({ ...row, subjectId: entitySubjectId(row) })),
    })),
    today: todayISO(),
    target: state.examBlueprint?.configuredAt
      ? state.examBlueprint.targetScore
      : state.metas.metaAprovacao,
  });
  if (!calibration.available)
    return {
      available: false,
      low: null as any,
      high: null as any,
      central: null as any,
      confidence: 0,
      confidenceLabel: 'Baixa',
      detail: calibration.reason,
      calibration,
      forecast30: { available: false, reason: calibration.reason },
    };
  const confidence = calibration.confidence === 'moderate' ? 0.5 : 0.2;
  const forecast = buildPerformanceForecast({
    currentValue: calibration.central,
    currentConfidence: confidence,
    targetScore: calibration.target,
    observations: calibration.observations,
  });
  const future = forecast.forecast30 as Record<string, any>;
  if (future.available) {
    const margin = Math.max(
      future.central - future.low,
      calibration.central! - calibration.low!,
      calibration.high! - calibration.central!
    );
    future.low = Math.max(0, future.central - margin);
    future.high = Math.min(100, future.central + margin);
    future.confidence = Math.min(confidence, future.confidence);
    future.confidenceLabel = calibration.confidenceLabel;
  }
  const forecast30 =
    calibration.calibration!.state === 'retrospective'
      ? future
      : {
          available: false,
          reason: 'A projeção futura aguarda checagem retrospectiva suficiente.',
        };
  return {
    available: true,
    low: calibration.low,
    high: calibration.high,
    central: calibration.central,
    confidence,
    confidenceLabel: calibration.confidenceLabel,
    calibration,
    gap: {
      minimum: Math.max(0, calibration.target! - calibration.high!),
      maximum: Math.max(0, calibration.target! - calibration.low!),
      target: calibration.target,
    },
    movingAverage: forecast.movingAverage,
    forecast30,
    evidence: calibration.evidence,
    scenarios: { available: false, scenarios: [] as any[] },
    detail: calibration.reason,
  };
}

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
      ...simuladoEffectiveCounts(item),
      breakdown: (item.breakdown || []).map(row => ({ ...row, subjectId: entitySubjectId(row) })),
    })),
  countStudyDays: countStudyDaysThisWeek,
  getCandidates: intelligenceCandidates,
  getPlan: latestStudyPlan,
  getCapacity: weeklyStrategyCapacity,
  getAdaptiveHistory: () => state.adaptivePlanningHistory,
});
// Same 30-day, exam-scoped window Desempenho opens with, so Visão Geral and Desempenho show one number.
function recentPerformance(scope = examEvidenceContext(), today = todayISO()) {
  return buildPerformanceOverview({
    range: resolvePerformanceRange({ today, period: '30', comparePrevious: false }),
    today,
    questions: scope.questions.included,
    sessions: scope.sessions.included,
    dailyPlans: performanceScopedPlans(scope),
  });
}
function currentAchievementProjection(
  metrics = computeApprovalMetrics(),
  readiness = readinessResult(metrics),
  candidates: any[] | null = null
) {
  return projectionController.current(metrics, readiness, candidates);
}

const recoveryController = createRecoveryController({
  getState: () => state,
  getPlan: latestStudyPlan,
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
        !persistenceBlocked && StorageManager.set(STORAGE_KEY, serialized),
      runExclusive: enqueueStateTransaction,
      clock: appClock,
      onCommitted: (value: any) => {
        flashSaved();
        STATE_CHANNEL?.postMessage({
          source: INSTANCE_ID,
          serialized: JSON.stringify(pickPersistentState(value)),
          updatedAt: value.updatedAt,
        });
      },
    }),
  },
});
async function applyConfirmedRecoveryPlan(signature: string) {
  return feedbackRecoveryResult(await recoveryController.apply(signature));
}
function feedbackRecoveryResult(result: Record<string, any>) {
  if (result.status === 'rejected') {
    showToast(result.reason);
    return false;
  }
  studyPlanPreview = null;
  dailyPlanPreview = null;
  render('desempenho');
  renderStudyTrack32Insights();
  renderStudyPlanBuilder();
  renderApprovalDashboard();
  showToast(
    result.status === 'applied'
      ? 'Plano de recuperação confirmado. A carga semanal foi preservada.'
      : 'A redistribuição foi revertida em uma nova versão do plano semanal. Atividades realizadas foram preservadas.'
  );
  return true;
}

function gerarDiagnosticoAprovacao(metrics: Record<string, any>) {
  const m = metrics || computeApprovalMetrics();
  const icons: Record<string, any> = { positive: '✅', warning: '⚠️', info: 'ℹ️' };
  return buildApprovalSignals(m, { target: state.metas.metaAprovacao }).map(
    item => `${icons[item.level]} ${item.text}`
  );
}
function topicRetentionScore(_subjectId: string, topicId: string) {
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

function approvalRetencaoMetric() {
  const topics = examScopedTopics();
  const values = topics.map(t => topicRetentionScore(t.subjectId, t.id));
  return calculateApprovalRetencaoMetric({
    topicRetentions: values,
    totalTopicsCount: topics.length,
  });
}
function approvalConhecimentoMetric(base: Record<string, any>) {
  return calculateApprovalConhecimentoMetric(base as any);
}
function approvalConsistenciaMetric() {
  const today = todayISO(),
    byDate = studySecondsByDate(examEvidenceContext().sessions.included);
  const days = [];
  for (let n = 27; n >= 0; n--) {
    const date = addDays(today, -n);
    days.push({ targetSeconds: metaHoursForDate(date) * 3600, studiedSeconds: byDate[date] || 0 });
  }
  const result = calculateGoalConsistency(days);
  return calculateApprovalConsistenciaMetric({ consistencyResult: result });
}
function computeApprovalMetrics() {
  const base = {
    simulados: approvalSimuladosMetric(),
    acertos: approvalAcertosMetric(),
    edital: approvalEditalMetric(),
    dominio: approvalDominioMetric(),
    revisoes: approvalRevisoesMetric(),
    tendencia: approvalTendenciaMetric(),
    prazo: approvalPrazoMetric(),
  };
  return {
    ...base,
    conhecimento: approvalConhecimentoMetric(base),
    retencao: approvalRetencaoMetric(),
    questoes: base.acertos,
    consistencia: approvalConsistenciaMetric(),
  };
}
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
  simuladoEffectiveCounts,
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
  onRenderStudyTrack32Insights: () => renderStudyTrack32Insights(),
  getRetentionView: () => retentionView,
  isRetentionShowAll: () => retentionShowAll,
});

function renderApprovalDashboard() {
  approvalTabController.renderApprovalDashboard();
}
function renderRecommendationHistorySummary() {
  approvalTabController.renderRecommendationHistorySummary();
}
function setStrategicTimelineFilter(value: any) {
  weeklyCloseModalController.setStrategicTimelineFilter(value);
}
function setStrategicTimelineGroup(value: any) {
  weeklyCloseModalController.setStrategicTimelineGroup(value);
}
function setPriorityHistorySubject(value: any) {
  weeklyCloseModalController.setPriorityHistorySubject(value);
}
function renderStudyTrack32Insights() {
  weeklyCloseModalController.renderStudyTrack32Insights();
}
function previewWeeklyCloseActions() {
  weeklyCloseModalController.previewWeeklyCloseActions();
}
function toggleWeeklyPriority(id: string, checked: boolean) {
  weeklyCloseModalController.toggleWeeklyPriority(id, checked);
}
function confirmWeeklyCloseActions() {
  weeklyCloseModalController.confirmWeeklyCloseActions();
}
function recordedExamPhase() {
  return resolveExamPhase(state.examDate ? diasParaRevisao(state.examDate) : null);
}
function saveCurrentReadinessSnapshot({
  captureKind = 'weekly-close',
  reason = null,
  eventKey = null,
}: any = {}) {
  const date = todayISO(),
    savedAt = nowISO(),
    snapshot = createReadinessSnapshot({
      id: uid('readiness'),
      date,
      savedAt,
      captureKind,
      reason,
      eventKey,
      examPhase: recordedExamPhase(),
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      metrics: readinessFactors(computeApprovalMetrics()),
    });
  return upsertReadinessSnapshot(state.readinessSnapshots, snapshot!);
}
function buildReadinessBeforeStrategySnapshot(reason: string, timestamp = nowISO()) {
  return createReadinessSnapshot({
    id: uid('readiness'),
    date: todayISO(),
    savedAt: timestamp,
    captureKind: 'before-strategy-change',
    reason,
    eventKey: uid('readiness-event'),
    examPhase: recordedExamPhase(),
    activeExamTags: state.examBlueprint?.activeExamTags || [],
    metrics: readinessFactors(computeApprovalMetrics()),
  });
}
function captureReadinessBeforeStrategy(reason: string) {
  return upsertReadinessSnapshot(
    state.readinessSnapshots,
    buildReadinessBeforeStrategySnapshot(reason)!
  );
}
function saveWeeklyCloseSnapshot() {
  weeklyCloseModalController.saveWeeklyCloseSnapshot();
}
function renderTopicRetentionDashboard() {
  approvalTabController.renderTopicRetentionDashboard();
}

function planStartDate() {
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
  renderAgenda,
  getActivityDates,
  getGoalDates,
  getDailyStudySummary,
  heatmapMetricLevel,
  computeStreak,
  activeSubjects,
  selectSessionHistoryDate,
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
  analysisContextBanner,
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
  simuladoEffectiveCounts,
  localDateFromTimestamp,
  topicMasteryIndex,
  topicRetentionScore,
  buildTopicExamProfile,
  topicHistoryService,
  analysisContextBanner,
  renderExamIntelligenceSection,
  projectionController,
  renderProjectionScenarioResult,
  applyConfirmedRecoveryPlan,
  render: tab => render(tab),
  activateTab,
  activeSubjects,
  subjectRadarModel,
});
performanceTabController.registerController();

function renderExamCountdown() {
  dashboardTabController.renderExamCountdown();
}
function navigateKpi(tab: string, filter?: string) {
  dashboardTabController.navigateKpi(tab, filter);
}
function completeUnifiedReview(id: string, origin: string) {
  calendarTabController.completeUnifiedReview(id, origin);
}
function renderCalTarefasHoje(elId = 'calTarefasHoje') {
  calendarTabController.renderCalTarefasHoje(elId);
}
function renderCalAtrasadas(elId = 'calAtrasadas') {
  calendarTabController.renderCalAtrasadas(elId);
}
function renderKPIs() {
  dashboardTabController.renderKPIs();
}

/* ===== EVENTOS DELEGADOS: ações declarativas, sem JavaScript inline ===== */
const DELEGATED_ACTION_HANDLERS = composeDelegatedActionHandlers({
  openWeeklyAdherencePlanning: () => activateTab('metas'),
  openWeeklyClose,
  reviewPlanningCapacity: () => weeklyCloseModalController.sustainabilityController.review(),
  setStrategicTimelineFilter,
  setStrategicTimelineGroup,
  setPriorityHistorySubject,
  addAgendaRow,
  addBreakdownRow,
  addCalRow,
  addQuestaoRow,
  addSimuladoRow,
  addSubject,
  addTopic,
  applyTodayGoalToAllDays,
  archiveSubject,
  archiveTopic,
  clearWeekendGoals,
  previewPhaseStrategy,
  cancelPhaseStrategy,
  confirmPhaseStrategy,
  revertPhaseStrategy,
  calculateStudyPlanPreview,
  clearStudyPlanPreview,
  confirmStudyPlan,
  useAdaptivePlanAdvice,
  rejectAdaptivePlanAdvice,
  revertAdaptivePlanningDecision,
  calculateDailyPlanPreview,
  clearDailyPlanPreview,
  confirmDailyPlanPreview,
  undoLatestDailyPlanGeneration,
  openNextSessionAction,
  calculateReplanPreview,
  clearReplanPreview,
  confirmReplan,
  undoPlanAdjustment,
  saveWeeklyCloseSnapshot,
  previewWeeklyCloseActions,
  confirmWeeklyCloseActions,
  toggleWeeklyPriority,
  executeStudyRecommendation,
  cancelAgendaEdit,
  cancelCalendarEdit,
  cancelQuestionEdit,
  cancelSimulationEdit,
  cancelStudySessionEdit,
  changeAgendaLimit,
  changeCalendarLimit,
  changeOverdueGroupLimit,
  changePerformanceLimit,
  changeSubjectTopicLimit,
  changeUpcomingLimit,
  clearSessionHistoryFilters,
  completeAgendaReview,
  completeCalendarItem,
  completeUnifiedReview,
  rateCompletedReview,
  deleteAgendaRow,
  deleteBreakdownRow,
  deleteCalRow,
  deleteMetaDisciplina,
  deleteQuestaoRow,
  deleteSimuladoRow,
  deleteStudySession,
  duplicateSubject,
  editAgenda,
  editCalendarItem,
  editQuestion,
  editSimulation,
  editStudySession,
  focusStudyTimer,
  openStudyTimerFocus,
  toggleTimerFocus,
  gerarAgendaAutomatica,
  moveSubject,
  navigateKpi,
  renameSubject,
  selectHeatmapDay,
  setHeatmapFilter,
  viewSelectedHeatmapSessions,
  advanceGuidedStrategy,
  dismissIntelligentAlert,
  dismissStudyRecommendation,
  markRecommendationNotUseful,
  rateRecommendationOutcome,
  startStudyRecommendation,
  requestPermanentSubjectDelete,
  requestPermanentTopicDelete,
  resetAdaptiveReviewDate,
  resetAgendaLimit,
  resetCalendarLimit,
  resetOverdueGroupLimit,
  resetPerformanceLimit,
  resetRetentionLimit,
  resetSubjectTopicLimit,
  resetUpcomingLimit,
  restoreSubject,
  restoreTopic,
  saveAgendaEdit,
  saveCalendarEdit,
  saveQuestionEdit,
  setPerformanceViewMode,
  setRadarSubject,
  setRetentionFilter,
  setSubjectExamFilter,
  setSubjectTopicFilter,
  toggleActiveExamTag,
  saveSimulationEdit,
  saveStudySessionEdit,
  selectSessionHistoryDate,
  showAllOverdueGroups,
  showAllPerformance,
  showAllRetention,
  showAllSubjectTopics,
  showAllUpcoming,
  startPlannedActivity,
  toggleBreakdown,
  toggleNotes,
  toggleCompletedReviews,
  toggleFilterPanel,
  toggleOverdueDate,
  toggleQuestionErrors,
  toggleSessionDay,
  toggleSessionDetails,
  toggleStreakActiveDays,
  toggleStreakExpanded,
  toggleSubject,
  updateAgenda,
  updateAgendaDraft,
  updateBreakdownRow,
  updateCal,
  updateCalendarDraft,
  updateMeta,
  updateMetaDisciplina,
  updateMetaHoursDay,
  updateQuestionDraft,
  updateQuestionError,
  updateSessionHistoryFilter,
  setErrorAnalysisFilter,
  updateSimulationDraft,
  updateStudySessionDraft,
  updateTopic,
  updateTopicStatus,
  updateTopicTags,
  updateTopicStrategy,
  toggleTopicPrerequisite,
  updateExamBlueprint,
  updateExamSubject,
  saveExamSubjectConfig,
  cancelExamSubjectConfig,
});
const delegatedArgument = createDelegatedArgumentResolver({
  getTodayDayOfWeek: () => parseLocalDate(todayISO())!.getDay(),
});
const resolveDelegatedSpecial = createSpecialActionResolver({
  onSetPerformanceSubject: value => {
    performanceSubjectId = value;
  },
  renderQuestionAnalytics,
  getListViewSteps: () => LIST_VIEW_STEPS,
  getListViewState: () => listViewState,
  changeListLimit,
  getRenderers: () => ({
    renderQuestoes,
    renderSimulados,
    renderStudySessionsHistory,
  }),
});
createDelegatedEventsController({
  document,
  handlers: DELEGATED_ACTION_HANDLERS,
  parseArgument: delegatedArgument,
  resolveSpecial: resolveDelegatedSpecial,
  onError: (error: unknown) => {
    console.error('Evento delegado bloqueado', error);
    showToast('Uma ação inválida foi bloqueada por segurança.');
  },
}).register();
/* ===== MASTER RENDER ===== */
let analysisNavigationContext: any = null;
function analysisContextBanner(destination: string) {
  if (
    !analysisContextInScope(analysisNavigationContext, state.examBlueprint?.activeExamTags || []) ||
    analysisNavigationContext.origin === destination
  )
    return '';
  const label = analysisNavigationContext.topicId
    ? getTopicName(analysisNavigationContext.topicId)
    : analysisNavigationContext.subjectId
      ? getSubjectName(analysisNavigationContext.subjectId)
      : 'análise';
  return `<div class="analysis-context-banner"><span>Contexto: ${escapeHtml(label || 'análise')} · ${analysisNavigationContext.period === 'all' ? 'todo o histórico' : `período de ${escapeHtml(analysisNavigationContext.period)} dias`}</span><button type="button" class="btn ghost small" data-analysis-return>Voltar à origem</button></div>`;
}
function performanceScopedPlans(scope: any) {
  return performanceTabController.performanceScopedPlans(scope);
}
function renderPerformance() {
  performanceTabController.renderPerformance();
}
document.addEventListener('click', event => {
  const back = (event.target as HTMLElement).closest('[data-analysis-return]');
  if (back) {
    const previous = analysisNavigationContext;
    if (!analysisContextInScope(previous, state.examBlueprint?.activeExamTags || [])) return;
    analysisNavigationContext = null;
    if (previous.origin === 'desempenho')
      performanceTabController.setViewState(
        updatePerformanceViewState(performanceTabController.getViewState(), {
          section: 'subjects',
          period: previous.period,
          subjectId: previous.subjectId,
          topicId: previous.topicId,
        })
      );
    activateTab(previous.origin);
    return;
  }
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-analysis-nav]');
  if (!button) return;
  const destination = button.dataset.analysisNav,
    subjectId = button.dataset.subjectId || null,
    topicId = button.dataset.topicId || null;
  if (!['hoje', 'desempenho', 'metas'].includes(destination!)) return;
  analysisNavigationContext = createAnalysisContext({
    origin: activeTabName(),
    subjectId,
    topicId,
    period: performanceTabController.getViewState().period,
    activeExamTags: state.examBlueprint?.activeExamTags || [],
  });
  const topicDialog = document.getElementById('performanceTopicDialog') as HTMLDialogElement;
  if (topicDialog?.open) topicDialog.close();
  if (destination === 'desempenho')
    performanceTabController.setViewState(
      updatePerformanceViewState(performanceTabController.getViewState(), {
        section: 'subjects',
        subjectId,
        topicId,
      })
    );
  if (destination === 'metas') calculateStudyPlanPreview();
  activateTab(destination!);
  requestAnimationFrame(() => {
    if (destination === 'hoje')
      document.querySelector('.today-analysis-details')?.setAttribute('open', '');
    if (destination === 'metas')
      document.querySelector('#examStudyPlan .study-plan-details')?.setAttribute('open', '');
    const targets: HTMLElement[] | NodeListOf<HTMLElement> =
      destination === 'hoje'
        ? document.querySelectorAll<HTMLElement>('#diagnosisCenter [data-diagnosis-subject-id]')
        : destination === 'metas'
          ? document.querySelectorAll<HTMLElement>('#examStudyPlan [data-plan-topic-id]')
          : [];
    const selected = [...targets].find(
      node =>
        (destination === 'hoje' &&
          node.dataset.diagnosisTopicId === topicId &&
          node.dataset.diagnosisSubjectId === subjectId) ||
        (destination === 'metas' && node.dataset.planTopicId === topicId)
    );
    const fallback =
      destination === 'desempenho'
        ? document.getElementById('performancePage')
        : destination === 'metas'
          ? document.getElementById('examStudyPlan')
          : document.getElementById('diagnosisCenter');
    (selected || fallback)?.scrollIntoView({ block: 'start' });
    selected?.focus({ preventScroll: true });
  });
});
const RENDER_SCOPE_SECTIONS = {
  desempenho: new Set(['desempenho']),
  dashboard: new Set([
    'primeiro uso',
    'ação e atenção',
    'dashboard de aprovação',
    'controles do cronômetro',
    'evolução do progresso',
    'conquistas',
    'radar',
    'visão geral',
    'histórico de sessões',
  ]),
  disciplinas: new Set(['disciplinas', 'primeiro uso']),
  calendario: new Set([
    'indicadores do calendário',
    'tarefas de hoje',
    'tarefas atrasadas',
    'filtros do calendário',
    'calendário',
    'calendário mensal',
  ]),
  agenda: new Set(['filtros da agenda', 'agenda', 'avisos do caderno de erros']),
  questoes: new Set(['questões', 'análise de questões', 'simulados']),
  metas: new Set([
    'metas',
    'execução do plano',
    'configuração estratégica',
    'plano até a prova',
    'metas de horas por dia',
    'metas de acerto por disciplina',
    'metas por disciplina',
    'histórico de metas',
    'ritmo',
  ]),
  hoje: new Set([
    'resumo executivo',
    'central de diagnóstico',
    'recomendação de estudo',
    'replanejamento',
    'tarefas da aba hoje',
    'atrasos da aba hoje',
    'simulados planejados',
    'metas de hoje',
    'alertas',
    'plano de hoje',
    'avisos do caderno de erros',
  ]),
};
function activeTabName() {
  return tabRouter.activeTabName();
}
let applicationRenderer: ReturnType<typeof createApplicationRenderer>;
const errorBoundary = createErrorBoundaryController({ document, onRetry: () => render('active') });
applicationRenderer = createApplicationRenderer({
  sections: [
    ['desempenho', renderPerformance],
    ['indicadores', renderKPIs],
    ['primeiro uso', renderGuidedOnboarding],
    ['ação e atenção', renderOverviewDecisionArea],
    ['dashboard de aprovação', renderApprovalDashboard],
    ['controles do cronômetro', populateTimerContextControls],
    ['cabeçalho', renderHeader],
    ['evolução do progresso', renderProgressChart],
    ['conquistas', renderBadges],
    ['radar', renderRadarDisciplinas],
    ['visão geral', renderDashboard],
    ['histórico de sessões', renderStudySessionsHistory],
    ['disciplinas', renderSubjects],
    ['indicadores do calendário', renderCalIndicadores],
    ['tarefas de hoje', renderCalTarefasHoje],
    ['tarefas atrasadas', renderCalAtrasadas],
    ['filtros do calendário', renderCalendarFilters],
    ['calendário', renderCalendar],
    ['calendário mensal', renderMonthCalendar],
    ['filtros da agenda', renderAgendaFilters],
    ['agenda', renderAgenda],
    ['avisos do caderno de erros', () => errorNotebookController.renderDueNotices()],
    ['questões', renderQuestoes],
    ['análise de questões', renderQuestionAnalytics],
    ['simulados', renderSimulados],
    ['metas', renderMetas],
    ['execução do plano', renderPlanExecution],
    ['configuração estratégica', renderExamBlueprintConfig],
    ['plano até a prova', renderStudyPlanBuilder],
    ['metas de horas por dia', renderWeeklyHoursGoals],
    ['metas de acerto por disciplina', renderSubjectTargetEditor],
    ['metas por disciplina', renderMetasPorDisciplina],
    ['histórico de metas', renderHistoricoMetas],
    ['ritmo', renderRitmo],
    ['resumo executivo', renderExecutiveSummary],
    ['central de diagnóstico', renderDiagnosisCenter],
    ['recomendação de estudo', renderStudyRecommendation],
    ['replanejamento', renderWeeklyReplan],
    ['tarefas da aba hoje', () => renderCalTarefasHoje('hojeTarefasHoje')],
    ['atrasos da aba hoje', () => renderCalAtrasadas('hojeAtrasadas')],
    ['simulados planejados', renderSimuladosPlanejados],
    ['metas de hoje', renderMetasHoje],
    ['alertas', renderAlertasInteligentes],
    ['plano de hoje', renderPlanoHoje],
    ['execução diária', renderDailyExecutionCard],
  ],
  scopes: RENDER_SCOPE_SECTIONS,
  globalSections: ['indicadores', 'cabeçalho', 'execução diária'],
  getActiveScope: activeTabName,
  afterRender: labelDynamicControls,
  onError: (error: unknown, name: string) => errorBoundary.report(error, name),
});
masterRenderer = createMasterRenderer({
  applicationRenderer,
  getActiveTabName: activeTabName,
  renderStudyTrack32Insights,
  errorBoundary,
  scheduleSave,
  onRenderFinish: () => {
    renderCandidates = null;
  },
});
function render(scope = 'all') {
  return masterRenderer.render(scope);
}
function persistAndRender() {
  masterRenderer.persistAndRender();
}
function renderAll() {
  return masterRenderer.renderAll();
}
watchDailyExecutionDate({ document, window, getToday: todayISO, onChange: () => render('active') });

/* ===== ATALHOS DE TECLADO ===== */
tabRouter.registerShortcuts();
const modalLayers = [
  ...document.querySelectorAll('.modal-overlay'),
  document.getElementById('guidedOnboardingOverlay'),
].filter(Boolean) as HTMLElement[];
const syncModalShell = () => {
  const active = modalLayers.some(layer => layer.classList.contains('show') && !layer.hidden);
  document.getElementById('mainContent')!.inert = active;
  document.body.classList.toggle('modal-open', active);
};
const modalObserver = new MutationObserver(syncModalShell);
modalLayers.forEach(layer =>
  modalObserver.observe(layer, { attributes: true, attributeFilter: ['class', 'hidden'] })
);
syncModalShell();

document.querySelectorAll('[data-go-home]').forEach(button =>
  button.addEventListener('click', () => {
    activateTab('dashboard');
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    // The compact brand that was clicked may hide at the top; keep focus on the visible hero brand.
    document
      .querySelector<HTMLElement>('.statement [data-go-home]')
      ?.focus({ preventScroll: true });
  })
);
document.getElementById('guidedOnboardingOverlay')?.addEventListener('change', event => {
  if ((event.target as HTMLElement).id === 'guidedExamPreset') {
    uiState.onboarding.presetId = (event.target as HTMLInputElement).value;
    return;
  }
  if ((event.target as HTMLElement).id === 'guidedExamDate') {
    updateExamBlueprint('examDate', (event.target as HTMLInputElement).value, { refresh: false });
    syncGuidedNext(onboardingModel());
    return;
  }
  if ((event.target as HTMLElement).dataset.guidedDay !== undefined) {
    updateMetaHoursDay(
      (event.target as HTMLElement).dataset.guidedDay,
      (event.target as HTMLInputElement).value,
      { refresh: false }
    );
    const model = onboardingModel();
    syncGuidedNext(model);
    document.querySelector('#guidedOnboardingContent .guided-capacity strong')!.textContent =
      formatPlanMinutes(model.availableMinutes);
    return;
  }
  if ((event.target as HTMLElement).dataset.guidedLevel)
    setGuidedSubjectLevel(
      (event.target as HTMLElement).dataset.guidedLevel!,
      (event.target as HTMLInputElement).value,
      { refresh: false }
    );
});
document.getElementById('guidedOnboarding')?.addEventListener('click', event => {
  if ((event.target as HTMLElement).closest('[data-guided-action="open"]')) openGuidedOnboarding();
});
document.getElementById('guidedOnboardingOverlay')?.addEventListener('click', event => {
  const dateOffsetBtn = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-guided-date-offset]'
  );
  if (dateOffsetBtn) {
    const offset = Number(dateOffsetBtn.dataset.guidedDateOffset) || 0;
    const input = document.getElementById('guidedExamDate') as HTMLInputElement | null;
    if (input) {
      const today = input.min || todayISO();
      input.value = applyOnboardingDateShortcut(today, offset);
      updateExamBlueprint('examDate', input.value, { refresh: false });
      const buttons = document.querySelectorAll('[data-guided-date-offset]');
      buttons.forEach(b => {
        const active = (b as HTMLElement).dataset.guidedDateOffset === String(offset);
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      syncGuidedNext(onboardingModel());
    }
    return;
  }
  const routinePresetBtn = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-guided-availability-preset]'
  );
  if (routinePresetBtn) {
    const presetId = routinePresetBtn.dataset.guidedAvailabilityPreset;
    const preset = AVAILABILITY_PRESETS.find(p => p.id === presetId);
    if (preset) {
      for (let day = 0; day <= 6; day++) {
        const hours = preset.hoursByDay[String(day)] ?? 0;
        updateMetaHoursDay(String(day), String(hours), { refresh: false });
        const input = document.querySelector<HTMLInputElement>(`[data-guided-day="${day}"]`);
        if (input) input.value = String(hours);
      }
      const buttons = document.querySelectorAll('[data-guided-availability-preset]');
      buttons.forEach(b => {
        const active = (b as HTMLElement).dataset.guidedAvailabilityPreset === presetId;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      const model = onboardingModel();
      syncGuidedNext(model);
      const cap = document.querySelector('#guidedOnboardingContent .guided-capacity strong');
      if (cap) cap.textContent = formatPlanMinutes(model.availableMinutes);
    }
    return;
  }
  const bulkLevelBtn = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-guided-bulk-level]'
  );
  if (bulkLevelBtn) {
    const level = bulkLevelBtn.dataset.guidedBulkLevel;
    if (level) {
      const selects = document.querySelectorAll<HTMLSelectElement>('[data-guided-level]');
      selects.forEach(select => {
        select.value = level;
        const subjectId = select.dataset.guidedLevel;
        if (subjectId) {
          setGuidedSubjectLevel(subjectId, level, { refresh: false });
        }
      });
      showToast(`Todas as disciplinas definidas como ${level}.`);
    }
    return;
  }
  const action = (event.target as HTMLElement).closest<HTMLElement>('[data-guided-action]')?.dataset
    .guidedAction;
  if (!action) return;
  if (action === 'cancel') closeGuidedOnboarding();
  if (action === 'back') moveOnboarding(-1);
  if (action === 'next') moveOnboarding(1);
  if (action === 'import') openExamImport(uiState.onboarding.presetId, 'onboarding');
  if (action === 'structured') {
    structuredImportOrigin = 'onboarding';
    structuredImportController.choose();
  }
  if (action === 'manual') {
    closeGuidedOnboarding({ manual: true });
    activateTab('disciplinas');
    document.getElementById('addSubjectBtn')?.focus();
  }
  if (action === 'availability') {
    uiState.onboarding.currentStep = 'availability';
    renderGuidedOnboarding();
  }
  if (action === 'create-plan') createGuidedInitialPlan();
  if (['back', 'next', 'availability'].includes(action))
    document.getElementById('guidedOnboardingClose')?.focus();
});
document.getElementById('guidedOnboardingClose')?.addEventListener('click', closeGuidedOnboarding);
document.addEventListener('click', event => {
  if ((event.target as HTMLElement).closest('[data-guided-tour-start]')) {
    guidedTourController.start();
  }
  if ((event.target as HTMLElement).closest('[data-first-steps-dismiss]')) {
    dismissFirstSteps();
    renderFirstStepsMissionCard();
  }
  if ((event.target as HTMLElement).closest('[data-first-steps-restore]')) {
    restoreFirstSteps();
    activateTab('hoje');
    renderFirstStepsMissionCard();
    showToast('Guia de primeiros passos reativado.');
  }
});
document.querySelector('[data-guided-manual-return]')?.addEventListener('click', () => {
  activateTab('dashboard');
  openGuidedOnboarding({ step: 'content' });
});
document.getElementById('guidedOnboardingOverlay')?.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeGuidedOnboarding();
  }
});
document.getElementById('executionAgendaBtn')?.addEventListener('click', () => {
  state.executionMode = 'agenda';
  scheduleSave();
  renderPlanoHoje();
});
document.getElementById('executionSequenceBtn')?.addEventListener('click', () => {
  state.executionMode = 'sequence';
  scheduleSave();
  renderPlanoHoje();
});

/* ===== VOLTAR AO TOPO ===== */
const backToTopBtn = document.getElementById('backToTopBtn');
if (backToTopBtn) {
  const syncBackToTop = () => {
    backToTopBtn.hidden = window.scrollY < 600;
  };
  window.addEventListener('scroll', syncBackToTop, { passive: true });
  backToTopBtn.addEventListener('click', () => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    document.getElementById('mainContent')?.focus({ preventScroll: true });
  });
  syncBackToTop();
}
registerApplicationLifecycle({
  window,
  onBeforeUnload: () => {
    if (
      !TEST_MODE &&
      !suppressBeforeUnloadSave &&
      !persistenceBlocked &&
      !appStateStore.isTransactionActive()
    )
      writeLocalState(JSON.stringify(pickPersistentState(state)));
  },
  onResponsiveChange: () => {
    renderQuestoes();
    renderSimulados();
    renderStudySessionsHistory();
    renderAgenda();
    renderCalendar();
  },
});
registerMobileInputVisibility({ window, document });

setCalendarMobileView('month');
// Activating a tab renders and saves; before loadState that save stamps the default state as newest and it wins the load.
const activateInitialTab = () => {
  tabRouter.activateInitialTab();
};

if (TEST_MODE) {
  const pristineTestState = structuredCloneSafe(state);
  window.__EXTRATO_TEST__ = {
    CURRENT_SCHEMA_VERSION,
    STATUS_OPTIONS,
    DIFFICULTY_OPTIONS,
    APP_MODE,
    IS_DEMO_MODE,
    getState: () => state,
    getConsolidatedDiagnosis: () => structuredCloneSafe(currentConsolidatedDiagnosis),
    settleSaves: () => appStateStore.settleSaves(),
    setState: (value: any) => {
      state = migrateState(structuredCloneSafe(value));
      ensureStateDefaults();
      return state;
    },
    refreshTimerDisplay: () => {
      timerSeconds = currentTimerSeconds();
      updateTimerDisplay();
    },
    resetState: () => {
      state = structuredCloneSafe(pristineTestState);
      ensureStateDefaults();
      return state;
    },
    migrateState: (value: any) => migrateState(structuredCloneSafe(value)),
    validateBackupData,
    validateNormalizedBackup,
    startOfWeek,
    isSameWeek,
    addDays,
    diasParaRevisao,
    parseLocalDate,
    todayISO,
    localDateFromTimestamp,
    calculateAdaptiveInterval,
    adaptiveReviewSuggestion,
    syncQuestionFromStudySession,
    getSubjectDependencies,
    getTopicDependencies,
    computeApprovalMetrics,
    indiceProntidao,
    readinessResult,
    calculateReadinessScore,
    computeStudyPriorities,
    topicRetentionScore,
    topicMasteryIndex,
    intelligenceCandidates,
    studyPlanCandidates,
    buildStudyPlan,
    renderAll,
    sha256,
    rotateAutomaticBackup,
    StorageManager,
    structuredCloneSafe,
    whatIfController,
    simulateWhatIfScenario,
    buildFinalStretchBanner,
    identifyVolatileTopics,
    parseRawSyllabusText,
    buildStudyCycleQueue,
    getCurrentCycleBlock,
    advanceStudyCycleQueue,
    peekUpcomingCycleBlocks,
    analyzeFocusAndEnergy,
    renderVerticalizedSyllabus,
    errorNotebookController,
    resolveEntitlements,
    createCloudSaaSProvider,
  };
  activateInitialTab();
  ensureStateDefaults();
  restoreTimerFromState();
  render();
  const testScript = document.createElement('script');
  testScript.src = 'tests/tests.js';
  document.body.appendChild(testScript);
} else {
  bootstrapApplication({
    context: appContext,
    start: async () => {
      await loadState();
      activateInitialTab();
    },
    onError: (error: unknown) => console.error('Falha na inicialização do aplicativo', error),
  });
}

(globalThis as Record<string, any>).studytrackProgressiveLists = mountProgressiveLists({
  document,
  window,
});

document.addEventListener('studytrack:navigate', () => {
  (globalThis as Record<string, any>).studytrackProgressiveLists?.reset();
  resetRecordListLimits();
});
