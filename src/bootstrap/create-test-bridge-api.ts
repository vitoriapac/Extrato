import { buildStudyPlan } from '../application/build-study-plan.js';
import { parseRawSyllabusText } from '../application/subjects/raw-syllabus-parser.js';
import { parseLocalDate } from '../core/date-utils.js';
import { structuredCloneSafe } from '../core/utils.js';
import { analyzeFocusAndEnergy } from '../domain/analytics/focus-energy-analytics.js';
import { calculateReadinessScore } from '../domain/analytics/readiness-score.js';
import { identifyVolatileTopics } from '../domain/analytics/volatile-mastery.js';
import { resolveEntitlements } from '../domain/billing/entitlements.js';
import { simulateWhatIfScenario } from '../domain/forecasts/what-if-simulator.js';
import { buildFinalStretchBanner } from '../domain/planning/final-stretch-policy.js';
import {
  advanceStudyCycleQueue,
  buildStudyCycleQueue,
  getCurrentCycleBlock,
  peekUpcomingCycleBlocks,
} from '../domain/planning/study-cycle-engine.js';
import { calculateAdaptiveInterval } from '../domain/reviews.js';
import { CURRENT_SCHEMA_VERSION, DIFFICULTY_OPTIONS, STATUS_OPTIONS } from '../state/schema.js';
import { validateNormalizedBackup } from '../storage/backup-validator.js';
import { createCloudSaaSProvider } from '../storage/cloud-saas-provider.js';

export interface CreateTestBridgeConfigOptions {
  window: Window;
  document: Document;
  appMode: string;
  isDemoMode: boolean;
  pristineTestState: any;
  getState: () => any;
  setState: (next: any) => void;
  migrateState: (raw: any) => any;
  ensureStateDefaults: () => void;
  todayISO: () => string;
  localDateFromTimestamp: (value: any) => string;
  renderAll: () => any;
  render: (scope?: string) => any;
  activateInitialTab: () => void;
  appSelectors: any;
  coreServices: any;
  storageAndSync: any;
  domainAnalytics: any;
  uiControllers: any;
}

export function createTestBridgeConfig(options: CreateTestBridgeConfigOptions) {
  const {
    window,
    document,
    appMode,
    isDemoMode,
    pristineTestState,
    getState,
    setState,
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
  } = options;

  return {
    window,
    document,
    api: {
      CURRENT_SCHEMA_VERSION,
      STATUS_OPTIONS,
      DIFFICULTY_OPTIONS,
      APP_MODE: appMode,
      IS_DEMO_MODE: isDemoMode,
      getState,
      getConsolidatedDiagnosis: () =>
        structuredCloneSafe(uiControllers.diagnosticsTabController.getConsolidatedDiagnosis()),
      settleSaves: () => storageAndSync.appStateStore.settleSaves(),
      setState: (value: any) => {
        const next = migrateState(structuredCloneSafe(value));
        setState(next);
        ensureStateDefaults();
        return getState();
      },
      refreshTimerDisplay: () => uiControllers.studyTimerRuntime.refreshTimerDisplay(),
      resetState: () => {
        const next = structuredCloneSafe(pristineTestState);
        setState(next);
        ensureStateDefaults();
        return getState();
      },
      migrateState: (value: any) => migrateState(structuredCloneSafe(value)),
      validateBackupData: storageAndSync.validateBackupData,
      validateNormalizedBackup,
      startOfWeek: appSelectors.startOfWeek,
      isSameWeek: appSelectors.isSameWeek,
      addDays: appSelectors.addDays,
      diasParaRevisao: appSelectors.diasParaRevisao,
      parseLocalDate,
      todayISO,
      localDateFromTimestamp,
      calculateAdaptiveInterval,
      adaptiveReviewSuggestion: (topicId: string, baseDays: number, baseDate: string) =>
        uiControllers.reviewsTabController.adaptiveReviewSuggestion(topicId, baseDays, baseDate),
      syncQuestionFromStudySession: (session: any) =>
        uiControllers.sessionHistoryController.syncQuestionFromStudySession(session),
      getSubjectDependencies: (sId: string) =>
        uiControllers.subjectsTabController.getSubjectDependencies(sId),
      getTopicDependencies: (tId: string) =>
        uiControllers.subjectsTabController.getTopicDependencies(tId),
      computeApprovalMetrics: domainAnalytics.approvalReadinessService.computeApprovalMetrics,
      indiceProntidao: domainAnalytics.approvalReadinessService.indiceProntidao,
      readinessResult: domainAnalytics.approvalReadinessService.readinessResult,
      calculateReadinessScore,
      computeStudyPriorities: domainAnalytics.studyCandidateService.computeStudyPriorities,
      topicRetentionScore: domainAnalytics.topicDiagnosisService.topicRetentionScore,
      topicMasteryIndex: domainAnalytics.topicDiagnosisService.topicMasteryIndex,
      intelligenceCandidates: domainAnalytics.studyCandidateService.intelligenceCandidates,
      studyPlanCandidates: (opts?: any) =>
        domainAnalytics.studyCandidateService.studyPlanCandidates(opts),
      buildStudyPlan,
      renderAll,
      sha256: storageAndSync.sha256,
      rotateAutomaticBackup: storageAndSync.rotateAutomaticBackup,
      StorageManager: coreServices.storageManager,
      structuredCloneSafe,
      whatIfController: uiControllers.whatIfController,
      simulateWhatIfScenario,
      buildFinalStretchBanner,
      identifyVolatileTopics,
      parseRawSyllabusText,
      buildStudyCycleQueue,
      getCurrentCycleBlock,
      advanceStudyCycleQueue,
      peekUpcomingCycleBlocks,
      analyzeFocusAndEnergy,
      renderVerticalizedSyllabus: () =>
        uiControllers.subjectsTabController.renderVerticalizedSyllabus(),
      errorNotebookController: uiControllers.errorNotebookController,
      resolveEntitlements,
      createCloudSaaSProvider,
    },
    activateInitialTab,
    ensureStateDefaults,
    restoreTimerFromState: () => uiControllers.studyTimerRuntime.restoreTimerFromState(),
    render,
  };
}
