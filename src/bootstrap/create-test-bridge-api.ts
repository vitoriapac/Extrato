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
import {
  CURRENT_SCHEMA_VERSION,
  DIFFICULTY_OPTIONS,
  STATUS_OPTIONS,
} from '../state/schema.js';
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
  restoreTimerFromState: () => void;
  refreshTimerDisplay: () => void;
  getConsolidatedDiagnosis: () => any;
  settleSaves: () => Promise<any>;
  validateBackupData: (raw: any) => any;
  startOfWeek: (iso: any) => string;
  isSameWeek: (iso: any) => boolean;
  addDays: (iso: any, days: number) => string;
  diasParaRevisao: (iso: any) => number | null;
  todayISO: () => string;
  localDateFromTimestamp: (value: any) => string;
  adaptiveReviewSuggestion: (topicId: string, baseDays: number, baseDate: string) => any;
  syncQuestionFromStudySession: (session: any) => any;
  getSubjectDependencies: (subjectId: string) => any;
  getTopicDependencies: (topicId: string) => any;
  computeApprovalMetrics: () => any;
  indiceProntidao: (metrics?: any) => number;
  readinessResult: (metrics?: any) => any;
  computeStudyPriorities: () => any[];
  topicRetentionScore: (subjectId: string, topicId: string) => any;
  topicMasteryIndex: (subjectId: string, topicId: string) => any;
  intelligenceCandidates: () => any[];
  studyPlanCandidates: (options?: any) => any[];
  renderAll: () => any;
  render: (scope?: string) => any;
  activateInitialTab: () => void;
  sha256: (value: any) => Promise<string | null>;
  rotateAutomaticBackup: (previousRaw: string | null, options?: any) => any;
  StorageManager: any;
  whatIfController: any;
  renderVerticalizedSyllabus: () => void;
  errorNotebookController: any;
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
    restoreTimerFromState,
    refreshTimerDisplay,
    getConsolidatedDiagnosis,
    settleSaves,
    validateBackupData,
    startOfWeek,
    isSameWeek,
    addDays,
    diasParaRevisao,
    todayISO,
    localDateFromTimestamp,
    adaptiveReviewSuggestion,
    syncQuestionFromStudySession,
    getSubjectDependencies,
    getTopicDependencies,
    computeApprovalMetrics,
    indiceProntidao,
    readinessResult,
    computeStudyPriorities,
    topicRetentionScore,
    topicMasteryIndex,
    intelligenceCandidates,
    studyPlanCandidates,
    renderAll,
    render,
    activateInitialTab,
    sha256,
    rotateAutomaticBackup,
    StorageManager,
    whatIfController,
    renderVerticalizedSyllabus,
    errorNotebookController,
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
      getConsolidatedDiagnosis: () => structuredCloneSafe(getConsolidatedDiagnosis()),
      settleSaves,
      setState: (value: any) => {
        const next = migrateState(structuredCloneSafe(value));
        setState(next);
        ensureStateDefaults();
        return getState();
      },
      refreshTimerDisplay,
      resetState: () => {
        const next = structuredCloneSafe(pristineTestState);
        setState(next);
        ensureStateDefaults();
        return getState();
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
    },
    activateInitialTab,
    ensureStateDefaults,
    restoreTimerFromState,
    render,
  };
}
