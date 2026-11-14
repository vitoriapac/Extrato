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
import {
  createDensityController,
  createEssentialController,
  createPreferencesController,
} from './ui/controllers/preferences-controller.js';
import { decorateAdvancedReveals, decorateTermHints } from './ui/essential-mode.js';
import { createModalController } from './ui/controllers/modal-controller.js';
import { createDialogFeedback } from './ui/primitives/modal-dialogs.js';
import { configureUndo } from './ui/undoable.js';
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
import { createAchievementNotifier } from './ui/controllers/achievement-notifier.js';
import { buildAchievementNotice } from './application/achievements/achievement-notice.js';
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
const densityController = createDensityController({ document, storage: localStorage });
document
  .getElementById('densityToggleBtn')
  ?.addEventListener('click', () => densityController.toggle());
densityController.sync();
const essentialController = createEssentialController({ document, storage: localStorage });
document
  .getElementById('essentialToggleBtn')
  ?.addEventListener('click', () => essentialController.toggle());
decorateAdvancedReveals(document);
decorateTermHints(document);

let state: AppState = createDefaultState();
const uiState = createUiState();

const { EXAM_PRESETS, ensureExamCatalog } = createExamCatalogLoader({
  document,
  window,
  buildVersion: __STUDYTRACK_BUILD_VERSION__,
});

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
configureUndo({
  getState: () => state,
  persistAndRender: () => persistAndRender(),
  showToast: message => dialogFeedback.showToast(message),
  showUndoToast: (message, onUndo) => dialogFeedback.showUndoToast(message, onUndo),
});
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
  onStateChanged: () => scheduleAchievementCheck(),
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
  isTestMode: TEST_MODE,
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

// Confere as conquistas depois de salvar. Adiado para não pesar na interação; primeira leitura não avisa.
const achievementNotifier = createAchievementNotifier({
  document,
  onView: () => {
    window.location.hash = '#hoje/conquistas';
  },
});
let achievementCheckQueued = false;
function checkAchievementUnlocks() {
  achievementCheckQueued = false;
  const controller = uiControllers.achievementsController;
  const { newlyUnlocked, changed, persist } = controller.syncUnlocks(todayISO());
  if (!changed) return;
  // A primeira leitura só ajusta a memória: abrir o app não deve reescrever o que está salvo.
  if (persist) storageAndSync.stateSyncCoordinator.scheduleSave();
  achievementNotifier.notify(
    buildAchievementNotice(newlyUnlocked, controller.getBadgesDefinitions())
  );
}
function scheduleAchievementCheck() {
  if (achievementCheckQueued) return;
  achievementCheckQueued = true;
  setTimeout(() => {
    try {
      checkAchievementUnlocks();
    } catch (error) {
      errorBoundary.report(error, 'conquistas');
    }
  }, 0);
}

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

const activateInitialTab = () => {
  // The essential-mode default is decided once, from the data present at the first load (F10).
  essentialController.decide({
    hasData: Boolean(
      state.subjects?.length || state.studySessions?.length || state.questoes?.length
    ),
    demo: IS_DEMO_MODE,
    testMode: TEST_MODE,
  });
  uiControllers.tabRouter.activateInitialTab();
  uiControllers.firstAccessModalController?.checkAndTrigger();
  scheduleAchievementCheck();
};
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
