import { DIFFICULTY_OPTIONS } from '../../state/schema.js';
import { formatDuration, formatPlanMinutes } from '../../core/format-duration.js';
import { needsMaintenance } from '../../domain/study-eligibility.js';
import { recommendationActionKind } from '../../application/recommendations/recommendation-action.js';
import { freezePlanExecution } from '../../domain/planning/plan-execution-snapshot.js';
import { createTimerUiController } from '../../ui/controllers/timer-ui-controller.js';
import { createStudyTimerRuntimeController } from '../../ui/controllers/study-timer-runtime-controller.js';
import { createWhatIfController } from '../../ui/controllers/what-if-controller.js';
import { createTodayTabController } from '../../ui/tabs/today/today-tab-controller.js';
import { createStudyRecommendationController } from '../../ui/tabs/today/study-recommendation-controller.js';
import { createOnboardingModalController } from '../../features/onboarding/onboarding-modal-controller.js';
import { createSessionHistoryController } from '../../ui/tabs/today/session-history-controller.js';

export function wireExecutionAndOnboardingUi(deps: Record<string, any>) {
  const {
    document,
    window,
    getState,
    uiState,
    isDemoMode,
    todayISO,
    nowISO,
    uid,
    escapeHtml,
    escapeAttr,
    pluralize,
    appSelectors,
    services,
    analytics,
    examPresets,
    ensureExamCatalog,
    openExamImport,
    openStructuredImportFromOnboarding,
    isMobileHistoryLayout,
    activeTabName,
    activateTab,
    scheduleSave,
    render,
    persistAndRender,
    showToast,
    showConfirm,
    showPrompt,
    guidedTourController,
    syncModalShell,
    renderHeatmap,
    renderDiagnosisCenter,
    renderAlertasInteligentes,
    renderRecommendationHistorySummary,
    addQuestaoRow,
    addSimuladoRow,
    completeAgendaReview,
    getLatestStudyPlan,
    buildCurrentStudyPlanProposal,
    calculateStudyPlanPreview,
    getStudyPlanPreview,
    confirmStudyPlan,
    calculateDailyPlanPreview,
    getDailyPlanPreview,
    confirmDailyPlanPreview,
  } = deps;

  const {
    getSubjectById,
    getTopicById,
    getSubjectName,
    getTopicName,
    entitySubjectId,
    activeSubjects,
    activeTopics,
    subjectsForSelection,
    topicsForSelection,
    diasParaRevisao,
    startOfWeek,
    addDays,
    formatDatePt,
    localDateISO,
  } = appSelectors;
  const localDateFromTimestamp = (v: any) => localDateISO(v);

  const {
    studyMetricsSelectors,
    topicDiagnosisService,
    studyCandidateService,
    approvalReadinessService,
    goalsBlueprintService,
  } = analytics;

  let todayTabController: ReturnType<typeof createTodayTabController>;
  let studyRecommendationController: ReturnType<typeof createStudyRecommendationController>;
  let onboardingModalController: ReturnType<typeof createOnboardingModalController>;

  const timerUiController = createTimerUiController({
    document,
    activeTabName,
    activateTab,
    renderTimerFocusContext: () => studyTimerRuntime.renderTimerFocusContext(),
    isTimerRunning: () => studyTimerRuntime.isTimerRunning(),
    getTopicById,
    subjectService: services.subjectService,
  });
  timerUiController.bindKeyboardShortcuts();

  const studyTimerRuntime = createStudyTimerRuntimeController({
    document,
    window,
    getState,
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
    intelligenceCandidates: studyCandidateService.intelligenceCandidates,
    getDailyExecutionItems: () => todayTabController.dailyExecutionController.build(),
    getCurrentStudyRecommendations: () =>
      studyRecommendationController?.getCurrentRecommendations() || [],
    guidedStudyService: services.guidedStudyService,
    sessionService: services.sessionService,
    timerUiController,
    activeTabName,
    activateTab,
    scheduleSave,
    persistAndRender,
    renderPlanoHoje: () => todayTabController.renderPlanoHoje(),
    renderStudyRecommendation: () => studyRecommendationController.renderStudyRecommendation(),
    renderDiagnosisCenter,
    addSimuladoRow,
    showToast,
    showConfirm,
  });
  studyTimerRuntime.bindEvents();

  const whatIfController = createWhatIfController({
    getContainer: () => document.getElementById('whatIfSimulatorMount'),
    getState,
    getCurrentMetrics: () => {
      const metrics = approvalReadinessService.computeApprovalMetrics();
      const topics = activeTopics();
      const covered = topics.filter(
        (t: any) =>
          t.status === 'Concluído' || t.status === 'Em andamento' || (t.completionCount ?? 0) > 0
      );
      return {
        readinessScore: approvalReadinessService.readinessResult(metrics).value,
        weeklyStudyMinutes: studyMetricsSelectors.weeklyStrategyCapacity(),
        totalTopicsCount: topics.length,
        coveredTopicsCount: covered.length,
      };
    },
  });

  todayTabController = createTodayTabController({
    formatPlanMinutes,
    formatDatePt,
    formatDuration,
    formatHoras: studyMetricsSelectors.formatHoras,
    document,
    getState,
    getUiState: () => uiState,
    isDemoMode: () => isDemoMode,
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
    motivoPrioridade: studyCandidateService.motivoPrioridade,
    freezePlanExecution,
    metaHoursToday: goalsBlueprintService.metaHoursToday,
    hasStartedStudyTimer: () => studyTimerRuntime.hasStartedStudyTimer(),
    openStudyTimerFocus: () => timerUiController.openStudyTimerFocus(),
    startPlannedActivity: itemId => studyTimerRuntime.startPlannedActivity(itemId),
    openGuidedOnboarding: (opts?: any) => onboardingModalController.openGuidedOnboarding(opts),
    onDismissFirstSteps: () => todayTabController.dismissFirstSteps(),
    onRestoreFirstSteps: () => todayTabController.restoreFirstSteps(),
    onStartTour: () => guidedTourController?.start(),
    onExecuteFirstStepsMission: (action: string) => {
      if (action === 'open-onboarding') {
        onboardingModalController.openGuidedOnboarding();
      } else if (action === 'open-questions') {
        activateTab('questoes');
      } else if (action === 'start-first-session' || action === 'start-quick-warmup') {
        const plan = todayTabController.todayDailyStudyPlan();
        const first = plan?.items?.find(
          (it: any) => it.status !== 'completed' && it.status !== 'skipped'
        );
        if (first) {
          studyTimerRuntime.startPlannedActivity(first.id);
        } else {
          activateTab('hoje');
        }
      }
    },
    guidedTourController,
    whatIfController,
    latestStudyPlan: getLatestStudyPlan,
    weeklyStrategyCapacity: studyMetricsSelectors.weeklyStrategyCapacity,
    computeStudyPriorities: studyCandidateService.computeStudyPriorities,
    getCurrentStudyRecommendations: () => studyRecommendationController.getCurrentRecommendations(),
    refreshStudyRecommendationItems: (opts?: any) =>
      studyRecommendationController.refreshStudyRecommendationItems(opts),
    renderOverviewDecisionArea: () => studyRecommendationController.renderOverviewDecisionArea(),
    uniqueTopicsCompletedBetween: studyMetricsSelectors.uniqueTopicsCompletedBetween,
    getRevisoesUnificadas: studyMetricsSelectors.getRevisoesUnificadas,
    segundosEstudadosHoje: studyMetricsSelectors.segundosEstudadosHoje,
    diasParaRevisao,
    startOfWeek,
  });
  todayTabController.bindEvents();

  studyRecommendationController = createStudyRecommendationController({
    document,
    getState,
    metaHoursToday: goalsBlueprintService.metaHoursToday,
    intelligenceCandidates: studyCandidateService.intelligenceCandidates,
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
    getTopicPerformance: topicDiagnosisService.getTopicPerformance,
    needsMaintenance,
    activeTopics,
    dailyExecutionController: {
      build: (action?: any) => todayTabController.dailyExecutionController.build(action),
    },
    hasStartedStudyTimer: () => studyTimerRuntime.hasStartedStudyTimer(),
    activeTimerMatchesRecommendation: rec =>
      studyTimerRuntime.activeTimerMatchesRecommendation(rec),
    renderActiveStudyTimerNotice: rec => studyTimerRuntime.renderActiveStudyTimerNotice(rec),
    openStudyTimerFocus: () => timerUiController.openStudyTimerFocus(),
    topicResumeLabel: topicId => timerUiController.topicResumeLabel(topicId),
    guidedStudyService: services.guidedStudyService,
    todayDailyStudyPlan: () => todayTabController.todayDailyStudyPlan(),
    freezePlanExecution,
    startPlannedActivity: itemId => studyTimerRuntime.startPlannedActivity(itemId),
    addQuestaoRow,
    activateTab,
    reviewService: services.reviewService,
    completeAgendaReview,
    validQuestionRecords: studyMetricsSelectors.validQuestionRecords,
    renderFinalStretchBanner: () => todayTabController.renderFinalStretchBanner(),
    renderAlertasInteligentes,
    renderPlanoHoje: () => todayTabController.renderPlanoHoje(),
    replanService: services.replanService,
    planningRepository: services.planningRepository,
    metaHoursForDate: goalsBlueprintService.metaHoursForDate,
    startOfWeek,
    addDays,
    diasParaRevisao,
    localDateFromTimestamp,
  });

  onboardingModalController = createOnboardingModalController({
    document,
    getState,
    getUiState: () => uiState,
    isDemoMode: () => isDemoMode,
    ensureExamCatalog,
    showToast,
    escapeHtml,
    escapeAttr,
    formatPlanMinutes,
    todayISO,
    examPresets,
    difficultyOptions: DIFFICULTY_OPTIONS,
    subjectService: services.subjectService,
    getSubjectById,
    activeSubjects,
    scheduleSave,
    persistAndRender,
    buildStudyPlanProposal: buildCurrentStudyPlanProposal,
    calculateStudyPlanPreview,
    getStudyPlanPreview,
    confirmStudyPlan,
    calculateDailyPlanPreview,
    getDailyPlanPreview,
    confirmDailyPlanPreview,
    render: () => render(),
    activateTab,
    syncModalShell,
    openExamImport: (presetId: string, source: string) => openExamImport(presetId, source),
    onStructuredImport: openStructuredImportFromOnboarding,
    updateExamBlueprint: (field: string, val: any, opts?: any) =>
      goalsBlueprintService.updateExamBlueprint(field as any, val, opts),
    updateMetaHoursDay: (day: string, hours: string, opts?: any) =>
      goalsBlueprintService.updateMetaHoursDay(day, hours, opts),
  });
  onboardingModalController.bindEvents();

  const sessionHistoryController = createSessionHistoryController({
    get state() {
      return getState();
    },
    listViewState: deps.listViewState,
    LIST_VIEW_STEPS: deps.LIST_VIEW_STEPS,
    sessionService: services.sessionService,
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

  return {
    timerUiController,
    studyTimerRuntime,
    whatIfController,
    todayTabController,
    studyRecommendationController,
    onboardingModalController,
    sessionHistoryController,
  };
}
