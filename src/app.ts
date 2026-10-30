declare const __STUDYTRACK_BUILD_VERSION__: string;
declare global {
  interface Window {
    StudyTrackExamCatalog?: any;
    appState?: any;
    __EXTRATO_TEST__?: Record<string, unknown>;
  }
}

import type { AppState } from './core/types.js';
import { STORAGE_KEY } from './state/schema.js';
import { uid, structuredCloneSafe, pluralize, escapeHtml, escapeAttr } from './core/utils.js';
import { createClock } from './core/clock.js';
import { createDefaultState } from './state/defaults.js';
import { ensureStateDefaultsWithDeps } from './state/ensure-state-defaults.js';
import { createUiState, pickPersistentState } from './state/state-boundaries.js';
import { createStateMigrator } from './state/migrations.js';
import {
  ERROR_CATEGORIES,
  normalizeErrorBreakdown,
} from './domain/diagnostics/error-categories.js';
import { createAppSelectors } from './application/selectors/app-selectors.js';
import { createExamCatalogLoader } from './application/exams/exam-catalog-loader.js';
import { APP_MODES, readAppMode } from './application/demo/demo-mode.js';
import { createPreferencesController } from './ui/controllers/preferences-controller.js';
import { createModalController } from './ui/controllers/modal-controller.js';
import { createDialogFeedback } from './ui/primitives/modal-dialogs.js';
import { createErrorBoundaryController } from './ui/controllers/error-boundary-controller.js';
import { watchDailyExecutionDate } from './ui/controllers/daily-execution-controller.js';
import { createApplicationRenderer } from './ui/renderers/application-renderer.js';
import { labelDynamicControls } from './ui/accessibility.js';
import { wireAppDependencies } from './bootstrap/wire-dependencies.js';
import { wireStorageAndSync } from './bootstrap/wire-storage-and-sync.js';
import { wireDomainAnalytics } from './bootstrap/wire-domain-analytics.js';
import { wireImportControllers } from './bootstrap/wire-import-controllers.js';
import { wireUiControllers } from './bootstrap/wire-ui-controllers.js';
import { createMasterRenderer } from './bootstrap/master-renderer.js';
import { RENDER_SCOPE_SECTIONS, buildRenderSections } from './bootstrap/render-sections-config.js';
import { createTestBridgeConfig } from './bootstrap/create-test-bridge-api.js';
import {
  setupApplicationLifecycle,
  bootstrapAppRuntime,
  setupProgressiveNavigation,
} from './bootstrap/application-bootstrap.js';

const THEME_STORAGE_KEY = 'bb-premium-theme';
const MODE_FLASH_KEY = 'bb-premium-mode-message';
const TEST_MODE = new URLSearchParams(location.search).get('test') === '1';
const APP_MODE = TEST_MODE ? APP_MODES.REAL : readAppMode(globalThis.sessionStorage);
const IS_DEMO_MODE = APP_MODE === APP_MODES.DEMO;
const INSTANCE_ID = uid('instance');

const appClock = createClock();
const nowISO = () => appClock.nowISO();
const todayISO = () => appClock.today();

const preferencesController = createPreferencesController({
  document,
  storage: localStorage,
  key: THEME_STORAGE_KEY,
});
document
  .getElementById('themeToggleBtn')!
  .addEventListener('click', () => preferencesController.toggle());
preferencesController.sync();

let state: AppState = createDefaultState();
const uiState = createUiState();

const { EXAM_PRESETS, ensureExamCatalog } = createExamCatalogLoader({
  document,
  window,
  buildVersion: __STUDYTRACK_BUILD_VERSION__,
});
uiState.onboarding.presetId = EXAM_PRESETS[0]?.id || null;

const appSelectors = createAppSelectors({ getState: () => state, getToday: todayISO });
const localDateFromTimestamp = (v: any) => appSelectors.localDateISO(v);

const { migrateState, normalizeHistoryEvent } = createStateMigrator({
  nowISO,
  todayISO,
  toLocalDate: localDateFromTimestamp,
  errorCategoryKeys: Object.keys(ERROR_CATEGORIES),
});

let uiControllers: ReturnType<typeof wireUiControllers>;
let domainAnalytics: ReturnType<typeof wireDomainAnalytics>;
let importControllers: ReturnType<typeof wireImportControllers>;
let masterRenderer: ReturnType<typeof createMasterRenderer>;

function ensureStateDefaults() {
  ensureStateDefaultsWithDeps({
    getState: () => state,
    setState: next => {
      state = next;
    },
    nowISO,
    todayISO,
    normalizeHistoryEvent,
    normalizeErrorBreakdown: q => normalizeErrorBreakdown(q),
    refreshAllTopicReviewStats: () =>
      domainAnalytics.studyMetricsSelectors.refreshAllTopicReviewStats(),
  });
}

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

const coreServices = wireAppDependencies({
  isDemoMode: IS_DEMO_MODE,
  getState: () => state,
  clock: appClock,
  idGenerator: uid,
  getTopicById: appSelectors.getTopicById,
  evidenceScopeForTopic: topicId =>
    domainAnalytics.studyMetricsSelectors.evidenceScopeForTopic(topicId),
  addHistoryEvent: (type, sId, tId, meta) =>
    domainAnalytics.studyMetricsSelectors.addHistoryEvent(type, sId, tId, meta),
  entitySubjectId: appSelectors.entitySubjectId,
  refreshTopicReviewStats: topicId =>
    domainAnalytics.studyMetricsSelectors.refreshTopicReviewStats(topicId),
  measureRecommendationResults: session =>
    uiControllers.studyRecommendationController.measureRecommendationResults(session),
  currentStudyRecommendations: () =>
    uiControllers?.studyRecommendationController?.getCurrentRecommendations() || [],
  allTopics: appSelectors.allTopics,
  captureReadinessBeforeStrategy: reason =>
    domainAnalytics.approvalReadinessService.captureReadinessBeforeStrategy(reason),
  invalidatePlanPreview: () =>
    uiControllers?.studyPlanBuilderController?.clearStudyPlanPreviewState(),
  persistAndRender: () => persistAndRender(),
  renderSubjects: () => uiControllers.subjectsTabController.renderSubjects(),
  showToast: message => showToast(message),
  timestampToLocalDateISO: localDateFromTimestamp,
});

const storageAndSync = wireStorageAndSync({
  document,
  window,
  instanceId: INSTANCE_ID,
  isDemoMode: IS_DEMO_MODE,
  modeFlashKey: MODE_FLASH_KEY,
  storageManager: coreServices.storageManager,
  appContext: coreServices.appContext,
  migrateState,
  nowISO,
  todayISO,
  getState: () => state,
  setState: next => {
    state = next;
  },
  ensureStateDefaults,
  observePlanningCapacity: coreServices.observePlanningCapacity,
  restoreTimerFromState: () => uiControllers.studyTimerRuntime.restoreTimerFromState(),
  render: (scope?: string) => render(scope),
  persistAndRender: () => persistAndRender(),
  activateTab: (tabName, updateHash) => uiControllers.activateTab(tabName, updateHash),
  flashSaved,
  showToast,
  showConfirm,
  showPrompt,
});

domainAnalytics = wireDomainAnalytics({
  getState: () => state,
  appClock,
  todayISO,
  nowISO,
  uid,
  isDemoMode: IS_DEMO_MODE,
  appSelectors,
  goalsService: coreServices.goalsService,
  subjectGoalService: coreServices.subjectGoalService,
  topicHistoryService: coreServices.topicHistoryService,
  storageManager: coreServices.storageManager,
  stateSyncCoordinator: storageAndSync.stateSyncCoordinator,
  scheduleSave: storageAndSync.scheduleSave,
  enqueueStateTransaction: storageAndSync.enqueueStateTransaction,
  persistAndRender: () => persistAndRender(),
  flashSaved: () => flashSaved(),
  showToast,
  getLatestStudyPlan: () => uiControllers?.studyPlanBuilderController?.latestStudyPlan(),
  invalidatePlanPreviews: () =>
    uiControllers?.studyPlanBuilderController?.clearStudyPlanPreviewState(),
  isRendering: () => Boolean(masterRenderer?.isRendering()),
});

uiControllers = wireUiControllers({
  document,
  window,
  getState: () => state,
  uiState,
  isDemoMode: IS_DEMO_MODE,
  appClock,
  todayISO,
  nowISO,
  uid,
  escapeHtml,
  escapeAttr,
  pluralize,
  appSelectors,
  appContext: coreServices.appContext,
  services: coreServices,
  analytics: domainAnalytics,
  examPresets: EXAM_PRESETS,
  ensureExamCatalog,
  openExamImport: (presetId?: string, source?: string) =>
    importControllers.examImportModalController.openExamImport(presetId, source),
  openStructuredImportFromOnboarding: () => importControllers.openStructuredImportFromOnboarding(),
  scheduleSave: storageAndSync.scheduleSave,
  render: (scope?: string) => render(scope),
  persistAndRender: () => persistAndRender(),
  renderAll: () => renderAll(),
  showToast,
  showConfirm,
  showPrompt,
});

importControllers = wireImportControllers({
  document,
  window,
  getState: () => state,
  uiState,
  subjectService: coreServices.subjectService,
  questionService: coreServices.questionService,
  examPresets: EXAM_PRESETS,
  ensureExamCatalog,
  suspendGuidedOnboarding: () => uiControllers.onboardingModalController.suspendGuidedOnboarding(),
  resumeGuidedOnboarding: (step?: string) =>
    uiControllers.onboardingModalController.resumeGuidedOnboarding(step),
  examBadges: topic => uiControllers.subjectsTabController.examBadges(topic),
  invalidatePlanPreviews: () =>
    uiControllers.studyPlanBuilderController.clearStudyPlanPreviewState(),
  persistAndRender: () => persistAndRender(),
  activateTab: uiControllers.activateTab,
  showToast,
  pluralize,
  nowISO,
  todayISO,
  escapeHtml,
  escapeAttr,
});

const errorBoundary = createErrorBoundaryController({ document, onRetry: () => render('active') });
const applicationRenderer = createApplicationRenderer({
  sections: buildRenderSections(uiControllers.renderHandlers),
  scopes: RENDER_SCOPE_SECTIONS,
  globalSections: ['indicadores', 'cabeçalho', 'execução diária'],
  getActiveScope: uiControllers.activeTabName,
  afterRender: labelDynamicControls,
  onError: (error: unknown, name: string) => errorBoundary.report(error, name),
});

masterRenderer = createMasterRenderer({
  applicationRenderer,
  getActiveTabName: uiControllers.activeTabName,
  renderStudyTrack32Insights: () =>
    uiControllers.weeklyCloseModalController.renderStudyTrack32Insights(),
  errorBoundary,
  scheduleSave: storageAndSync.scheduleSave,
  onRenderFinish: domainAnalytics.studyCandidateService.clearRenderCandidatesCache,
});

const render = (scope = 'all') => masterRenderer.render(scope);
const persistAndRender = () => masterRenderer.persistAndRender();
const renderAll = () => masterRenderer.renderAll();

watchDailyExecutionDate({ document, window, getToday: todayISO, onChange: () => render('active') });

setupApplicationLifecycle({
  window,
  document,
  isTestMode: TEST_MODE,
  canSaveBeforeUnload: storageAndSync.canSaveBeforeUnload,
  onPersistLocal: () =>
    coreServices.appContext.storage.writeLocal(
      STORAGE_KEY,
      JSON.stringify(pickPersistentState(state))
    ),
  onResponsiveChange: uiControllers.onResponsiveChange,
});

const activateInitialTab = () => uiControllers.tabRouter.activateInitialTab();
const pristineTestState = TEST_MODE ? structuredCloneSafe(state) : null;

bootstrapAppRuntime({
  isTestMode: TEST_MODE,
  context: coreServices.appContext,
  loadState: storageAndSync.loadState,
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
        todayISO,
        localDateFromTimestamp,
        renderAll,
        render,
        activateInitialTab,
        appSelectors,
        coreServices,
        storageAndSync,
        domainAnalytics,
        uiControllers,
      })
    : undefined,
});

setupProgressiveNavigation({
  document,
  window,
  onNavigateReset: () => uiControllers.resetRecordListLimits(),
});
