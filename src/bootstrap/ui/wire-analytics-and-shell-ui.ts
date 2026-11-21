import { initLazyDetails } from '../../ui/lazy-details.js';
import { formatDuration, formatPlanMinutes } from '../../core/format-duration.js';
import { formatDecimal } from '../../core/format-number.js';
import { parseLocalDate } from '../../core/date-utils.js';
import { heatmapMetricLevel } from '../../domain/analytics/heatmap.js';
import { buildTopicExamProfile } from '../../application/exam-intelligence/build-topic-exam-profile.js';
import { achievementProjectionHistory } from '../../application/projection/index.js';
import { renderProjectionScenarioResult } from '../../ui/performance/achievement-projection-renderer.js';
import { generateDiagnosis } from '../../application/generate-diagnosis.js';
import { createReportController } from '../../ui/controllers/report-controller.js';
import { createHelpController } from '../../ui/help/help-controller.js';
import { createAchievementsController } from '../../ui/controllers/achievements-controller.js';
import { initTodaySubtabs, todaySubtabHash } from '../../ui/tabs/today/today-subtabs.js';
import { createGuidedTourController } from '../../ui/controllers/guided-tour-controller.js';
import { createAnalysisNavigationController } from '../../ui/navigation/analysis-navigation-controller.js';
import { createDiagnosticsTabController } from '../../ui/tabs/diagnostics/diagnostics-tab-controller.js';
import { createDiagnosisController } from '../../ui/controllers/diagnosis-controller.js';
import { createShellUiController } from '../../ui/shell/shell-ui-controller.js';
import { createSearchController } from '../../ui/controllers/search-controller.js';
import { createApprovalTabController } from '../../ui/tabs/approval/approval-tab-controller.js';
import { createDashboardTabController } from '../../ui/tabs/dashboard/dashboard-tab-controller.js';
import { buildNextBestAction } from '../../application/diagnostics/build-next-best-action.js';
import { buildDiagnosisPageModel } from '../../application/diagnostics/build-diagnosis-page-model.js';
import { createPerformanceTabController } from '../../ui/tabs/performance/performance-tab-controller.js';

export function wireAnalyticsAndShellUi(deps: Record<string, any>) {
  const {
    document,
    window,
    getState,
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
    activeTabName,
    activateTab,
    scheduleSave,
    render,
    persistAndRender,
    showToast,
    openExamImport,
    renderAgenda,
    renderPlanoHoje,
    dismissFirstSteps,
    restoreFirstSteps,
    renderFirstStepsMissionCard,
    getOnboardingController,
    selectSessionHistoryDate,
    renderExamIntelligenceSection,
    renderStudyTrack32Insights,
    feedbackRecoveryResult,
    calculateStudyPlanPreview,
    getStudyPlanPreview,
    getLatestStudyPlan,
    refreshStudyRecommendationItems,
    getCurrentStudyRecommendations,
    executeStudyRecommendation,
    getDailyPriority,
  } = deps;

  const {
    getTopicName,
    getSubjectName,
    entitySubjectId,
    entitySubjectName,
    allTopics,
    activeSubjects,
    activeTopics,
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
    projectionController,
    currentAchievementProjection,
    recoveryController,
  } = analytics;

  let performanceTabController: ReturnType<typeof createPerformanceTabController>;

  createReportController({
    document,
    window,
    getState,
    nowISO,
    isDemo: isDemoMode,
    getCandidates: studyCandidateService.intelligenceCandidates,
    getDiagnosis: generateDiagnosis,
    getReadiness: () =>
      approvalReadinessService.readinessResult(approvalReadinessService.computeApprovalMetrics()),
    getForecast: approvalReadinessService.projectPerformance,
  });

  createHelpController({ document, window, activateTab }).mount();

  const achievementsController = createAchievementsController({
    document,
    getState,
    allTopics,
    activeSubjects,
    subjectProgress: studyMetricsSelectors.subjectProgress,
    computeStreak: studyMetricsSelectors.computeStreak,
    getActivityDates: studyMetricsSelectors.getActivityDates,
    intelligenceCandidates: studyCandidateService.intelligenceCandidates,
    escapeHtml,
    todayISO,
  });

  // Conquistas moram numa subaba de Hoje; só são desenhadas quando ela é aberta.
  const todaySubtabs = initTodaySubtabs({
    document,
    onShow: key => {
      if (key === 'conquistas') achievementsController.render();
    },
  });
  // Voltar à aba Hoje mantém a subaba lembrada, e a URL diz qual é.
  document.querySelector('.tab-btn[data-tab="hoje"]')?.addEventListener('click', () => {
    window.history.replaceState(null, '', todaySubtabHash(todaySubtabs.current()));
  });

  const guidedTourController = createGuidedTourController({
    document,
    window,
    activateTab,
    showToast,
  });

  const analysisNavigationController = createAnalysisNavigationController({
    document,
    getState,
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

  const diagnosticsTabController = createDiagnosticsTabController({
    diagnosisQueue: () => diagnosisQueue(),
    document,
    getState,
    scheduleSave,
    todayISO,
    addDays,
    startOfWeek,
    formatPlanMinutes,
    escapeHtml,
    escapeAttr,
    pluralize,
    diasParaRevisao,
    computeAlertasInteligentes: studyCandidateService.computeAlertasInteligentes,
    computeApprovalMetrics: approvalReadinessService.computeApprovalMetrics,
    readinessResult: approvalReadinessService.readinessResult,
    computeRitmo: studyCandidateService.computeRitmo,
    computeStudyPriorities: studyCandidateService.computeStudyPriorities,
    motivoPrioridade: studyCandidateService.motivoPrioridade,
    examScopedTopics: studyMetricsSelectors.examScopedTopics,
    examScopedSubjects: studyMetricsSelectors.examScopedSubjects,
    uniqueTopicsCompletedBetween: studyMetricsSelectors.uniqueTopicsCompletedBetween,
    refreshStudyRecommendationItems,
    examEvidenceContext: studyMetricsSelectors.examEvidenceContext,
    getStudyPlanPreview,
    currentAchievementProjection,
    analysisContextBanner: dest => analysisNavigationController.analysisContextBanner(dest),
    getDailyPriority,
    getCurrentStudyRecommendations,
    latestStudyPlan: getLatestStudyPlan,
    weeklyStrategyCapacity: studyMetricsSelectors.weeklyStrategyCapacity,
    locationSearch: () => location.search,
  });

  createDiagnosisController({
    document,
    refreshRecommendations: refreshStudyRecommendationItems,
    getRecommendations: getCurrentStudyRecommendations,
    onStale: () => {
      showToast('A recomendação mudou. Atualize o diagnóstico antes de pré-visualizar.');
      diagnosticsTabController.renderDiagnosisCenter();
    },
    openPreview: calculateStudyPlanPreview,
    activateTab,
    requestFrame: requestAnimationFrame,
  }).register();

  const shellUiController = createShellUiController({
    document,
    window,
    activateTab,
    getState,
    scheduleSave,
    persistAndRender,
    renderPlanoHoje,
    guidedTourController,
    dismissFirstSteps,
    restoreFirstSteps,
    renderFirstStepsMissionCard,
    showToast,
    onboardingController: {
      openGuidedOnboarding: (opts?: any) => getOnboardingController()?.openGuidedOnboarding(opts),
    },
  });
  shellUiController.initStickyHeaderAndOverviewNav();
  initLazyDetails(document);
  shellUiController.registerShellEvents();

  createSearchController({
    document,
    window,
    getState,
    activateTab,
    showToast,
    openExamImport,
    getRecommendations: getCurrentStudyRecommendations,
    onExecuteRecommendation: executeStudyRecommendation,
    onOpenQuickStudy: () => deps.openAssistantPanel?.('quick', { quickMinutes: 30 }),
    onOpenCopilot: () => deps.openAssistantPanel?.('copilot'),
    onOpenJournal: () => deps.openAssistantPanel?.('journal'),
    onOpenStudyCycleCenter: () => deps.openPlanningCycle?.(),
    jumpToTopic: (sId, tId) => shellUiController.jumpToTopic(sId, tId),
    escapeHtml,
    escapeAttr,
  }).mount();

  const approvalTabController = createApprovalTabController({
    document,
    getState,
    todayISO,
    nowISO,
    uid,
    escapeHtml,
    escapeAttr,
    formatDatePt,
    formatPlanMinutes,
    scheduleSave,
    computeApprovalMetrics: approvalReadinessService.computeApprovalMetrics,
    readinessResult: approvalReadinessService.readinessResult,
    projectPerformance: approvalReadinessService.projectPerformance,
    examScopedSimulations: studyMetricsSelectors.examScopedSimulations,
    simuladoEffectiveCounts: studyMetricsSelectors.simuladoEffectiveCounts,
    entitySubjectId,
    currentAchievementProjection,
    intelligenceCandidates: studyCandidateService.intelligenceCandidates,
    activeTopics,
    activeSubjects,
    allTopics,
    getMetricDataState: approvalReadinessService.getMetricDataState,
    metricStateLabel: approvalReadinessService.metricStateLabel,
    gerarDiagnosticoAprovacao: approvalReadinessService.gerarDiagnosticoAprovacao,
    topicRetentionScore: topicDiagnosisService.topicRetentionScore,
    topicReviewHealthScore: topicDiagnosisService.topicReviewHealthScore,
    topicMasteryIndex: topicDiagnosisService.topicMasteryIndex,
    onRenderStudyTrack32Insights: renderStudyTrack32Insights,
  });

  const dashboardTabController = createDashboardTabController({
    document,
    window,
    getState,
    todayISO,
    parseLocalDate,
    addDays,
    formatDecimal,
    formatDatePt,
    formatDuration,
    pluralize,
    escapeHtml,
    escapeAttr,
    recentPerformance: approvalReadinessService.recentPerformance,
    projectPerformance: approvalReadinessService.projectPerformance,
    examMatrixRows: () => deps.examMatrixRows?.() ?? [],
    intelligenceCandidates: studyCandidateService.intelligenceCandidates,
    revisoesAtrasadas: studyCandidateService.revisoesAtrasadas,
    getRevisoesUnificadas: studyMetricsSelectors.getRevisoesUnificadas,
    metaHoursToday: analytics.goalsBlueprintService.metaHoursToday,
    getTodayPlannedMinutes: deps.getTodayPlannedMinutes,
    diasParaRevisao,
    activateTab,
    renderAgenda,
    getActivityDates: studyMetricsSelectors.getActivityDates,
    getGoalDates: studyMetricsSelectors.getGoalDates,
    getDailyStudySummary: studyMetricsSelectors.getDailyStudySummary,
    heatmapMetricLevel,
    computeStreak: studyMetricsSelectors.computeStreak,
    activeSubjects,
    activeTopics,
    subjectProgress: studyMetricsSelectors.subjectProgress,
    entitySubjectName,
    getTopicName,
    readinessResult: approvalReadinessService.readinessResult,
    computeApprovalMetrics: approvalReadinessService.computeApprovalMetrics,
    recordProgressSnapshot: pct => performanceTabController.recordProgressSnapshot(pct),
    selectSessionHistoryDate,
    planStartDate: studyMetricsSelectors.planStartDate,
    nowISO,
    isDemoMode: () => (typeof isDemoMode === 'function' ? Boolean(isDemoMode()) : Boolean(isDemoMode)),
    getCurrentStudyRecommendations,
    diagnosisQueue: () => diagnosisQueue(),
    getLatestStudyPlan,
    getDailyPriority,
    weeklyStrategyCapacity: studyMetricsSelectors.weeklyStrategyCapacity,
    openAssistantPanel: deps.openAssistantPanel,
    openWeeklyClose: deps.openWeeklyClose,
    openPlanningPreview: calculateStudyPlanPreview,
    startGuidedTimerSession: deps.startGuidedTimerSession,
    showToast,
  });

  // A ordem dos cards do Diagnóstico (a fila de estudo oficial), calculada com os mesmos insumos.
  // Sem efeito colateral: não chama refreshStudyRecommendationItems (que grava histórico e troca as recomendações).
  // shortcut: cache por assinatura barata (dia, recomendações atuais e tamanho das listas); uma edição que não muda
  // esses tamanhos só aparece na fila no próximo refresh das recomendações.
  let queueCache: { key: string; recs: unknown; value: string[] } | null = null;
  const diagnosisQueue = (): string[] => {
      const state = getState();
      const recs = getCurrentStudyRecommendations();
      const key = [
        todayISO(),
        (state.studySessions || []).length,
        (state.questoes || []).length,
        (state.reviewAgenda || []).length,
        (state.subjects || []).reduce(
          (sum: number, sub: { topics?: unknown[] }) => sum + (sub.topics || []).length,
          0
        ),
      ].join('|');
      if (queueCache && queueCache.key === key && queueCache.recs === recs) return queueCache.value;
      const candidates = studyCandidateService.intelligenceCandidates();
      const model = buildDiagnosisPageModel({
        candidates,
        subjects: studyMetricsSelectors.examScopedSubjects(),
        scope: studyMetricsSelectors.examEvidenceContext(),
        blueprint: state.examBlueprint,
        globalTarget: state.metas?.metaAprovacao,
        today: todayISO(),
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        recommendations: getCurrentStudyRecommendations(),
        activePlan: getLatestStudyPlan(),
        weeklyCapacityMinutes: studyMetricsSelectors.weeklyStrategyCapacity(),
        hoursByDay: state.metas?.horasPorDia || {},
      });
      // Só os tópicos que entram na lista do Diagnóstico (os com sinal): é a mesma fila que a Leitura segue.
      const value = (model.consolidated?.topics || [])
        .filter((row: any) => row.primarySignal)
        .map((row: any) => row.topicId);
      queueCache = { key, recs, value };
      return value;
  };

  performanceTabController = createPerformanceTabController({
    document,
    window,
    getState,
    todayISO,
    formatDatePt,
    formatDecimal,
    escapeHtml,
    escapeAttr,
    examEvidenceContext: studyMetricsSelectors.examEvidenceContext,
    examScopedSubjects: studyMetricsSelectors.examScopedSubjects,
    examScopedSimulations: studyMetricsSelectors.examScopedSimulations,
    currentAchievementProjection,
    achievementProjectionHistory,
    recoveryController,
    overdueCount: studyCandidateService.revisoesAtrasadas,
    readinessResult: approvalReadinessService.readinessResult,
    computeApprovalMetrics: approvalReadinessService.computeApprovalMetrics,
    // Os mesmos candidatos (e a mesma pontuação) do Diagnóstico: uma fila de estudo só.
    intelligenceCandidates: () => refreshStudyRecommendationItems().candidates,
    // A ordem dos cards do Diagnóstico (a fila de estudo oficial), calculada com os mesmos insumos.
    diagnosisOrder: diagnosisQueue,
    nextBestAction: () =>
      buildNextBestAction({
        recommendations: getCurrentStudyRecommendations(),
        queueOrder: diagnosisQueue(),
        activePlan: getLatestStudyPlan(),
        weeklyCapacityMinutes: studyMetricsSelectors.weeklyStrategyCapacity(),
      }),
    entitySubjectId,
    simuladoEffectiveCounts: studyMetricsSelectors.simuladoEffectiveCounts,
    localDateFromTimestamp,
    topicMasteryIndex: topicDiagnosisService.topicMasteryIndex,
    topicRetentionScore: topicDiagnosisService.topicRetentionScore,
    buildTopicExamProfile,
    topicHistoryService: services.topicHistoryService,
    analysisContextBanner: dest => analysisNavigationController.analysisContextBanner(dest),
    renderExamIntelligenceSection,
    projectionController,
    renderProjectionScenarioResult,
    applyConfirmedRecoveryPlan: async (sig: string) =>
      feedbackRecoveryResult(await recoveryController.apply(sig)),
    render: tab => render(tab),
    activateTab,
    activeSubjects,
    subjectRadarModel: approvalReadinessService.subjectRadarModel,
  });
  performanceTabController.registerController();

  return {
    diagnosisQueue,
    achievementsController,
    todaySubtabs,
    guidedTourController,
    analysisNavigationController,
    diagnosticsTabController,
    shellUiController,
    approvalTabController,
    dashboardTabController,
    performanceTabController,
  };
}
