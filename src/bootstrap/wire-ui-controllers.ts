import { DEFAULT_LIST_VISIBLE_ITEMS } from '../ui/progressive-list.js';
import { renderCollectionFooter } from '../ui/list-components.js';
import { trapModalTab } from '../ui/accessibility.js';
import { parseLocalDate } from '../core/date-utils.js';
import { createTabRouter } from '../ui/navigation/tab-router.js';
import { registerDelegatedActions } from '../ui/navigation/delegated-actions-registry.js';
import { wirePracticeAndCatalogUi } from './ui/wire-practice-and-catalog-ui.js';
import { wirePlanningAndGoalsUi } from './ui/wire-planning-and-goals-ui.js';
import { wireExecutionAndOnboardingUi } from './ui/wire-execution-and-onboarding-ui.js';
import { wireAnalyticsAndShellUi } from './ui/wire-analytics-and-shell-ui.js';

export interface WireUiControllersDeps {
  document: Document;
  window: Window;
  getState: () => any;
  uiState: any;
  isDemoMode: boolean;
  appClock: any;
  todayISO: () => string;
  nowISO: () => string;
  uid: (prefix?: string) => string;
  escapeHtml: (value: any) => string;
  escapeAttr: (value: any) => string;
  pluralize: (count: number, singular: string, plural?: string) => string;
  appSelectors: any;
  appContext: any;
  services: any;
  analytics: any;
  examPresets: any[];
  ensureExamCatalog: () => Promise<any>;
  openExamImport: (presetId?: string, source?: string) => void;
  openStructuredImportFromOnboarding: () => void;
  scheduleSave: () => void;
  render: (scope?: string) => void;
  persistAndRender: () => void;
  renderAll: () => void;
  showToast: (message: string, durationMs?: number) => void;
  showConfirm: (
    message: string,
    onConfirm: (value?: any) => void,
    onCancel?: () => void,
    options?: any
  ) => void;
  showPrompt: (
    message: string,
    options: Record<string, any>,
    onConfirm: (value?: any) => void,
    onCancel?: () => void
  ) => void;
}

export function wireUiControllers(deps: WireUiControllersDeps) {
  const { document, window, todayISO, showToast, render, analytics } = deps;

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

  let practiceUi: ReturnType<typeof wirePracticeAndCatalogUi>;
  let planningUi: ReturnType<typeof wirePlanningAndGoalsUi>;
  let executionUi: ReturnType<typeof wireExecutionAndOnboardingUi>;
  let analyticsUi: ReturnType<typeof wireAnalyticsAndShellUi>;

  function resetRecordListLimits() {
    Object.keys(LIST_VIEW_STEPS).forEach(key => {
      (listViewState as Record<string, any>)[`${key}Visible`] = DEFAULT_LIST_VISIBLE_ITEMS;
    });
    if (practiceUi?.reviewsTabController) {
      practiceUi.reviewsTabController.agendaUiState.upcomingVisible =
        practiceUi.reviewsTabController.agendaUiState.completedVisible = DEFAULT_LIST_VISIBLE_ITEMS;
    }
    analyticsUi?.dashboardTabController?.resetUpcomingListDefault();
    if (practiceUi?.calendarTabController) {
      practiceUi.calendarTabController.calendarUiState.visible = DEFAULT_LIST_VISIBLE_ITEMS;
    }
    practiceUi?.questionAnalyticsController?.resetLimitDefault();
    analyticsUi?.approvalTabController?.resetRetentionLimitDefault();
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
    onCancelReview: () => practiceUi.reviewsTabController.closeReviewRating(),
  });
  const activateTab = (tabName: string, updateHash = true) =>
    tabRouter.activateTab(tabName, updateHash);
  const activeTabName = () => tabRouter.activeTabName();

  practiceUi = wirePracticeAndCatalogUi({
    ...deps,
    listViewState,
    LIST_VIEW_STEPS,
    isMobileHistoryLayout,
    renderListViewFooter,
    activeTabName,
    activateTab,
    startTimer: () => executionUi.studyTimerRuntime.startTimer(),
    populateTimerContextControls: () =>
      executionUi.studyTimerRuntime.populateTimerContextControls(),
    openStudyTimerFocus: () => executionUi.timerUiController.openStudyTimerFocus(),
  });

  planningUi = wirePlanningAndGoalsUi({
    ...deps,
    resetRecordListLimits,
    renderPlanoHoje: () => executionUi?.todayTabController?.renderPlanoHoje(),
    renderApprovalDashboard: () => analyticsUi?.approvalTabController?.renderApprovalDashboard(),
    analysisContextBanner: (dest: string) =>
      analyticsUi.analysisNavigationController.analysisContextBanner(dest),
  });

  analyticsUi = wireAnalyticsAndShellUi({
    ...deps,
    activeTabName,
    activateTab,
    renderAgenda: () => practiceUi.reviewsTabController.renderAgenda(),
    renderPlanoHoje: () => executionUi.todayTabController.renderPlanoHoje(),
    dismissFirstSteps: () => executionUi.todayTabController.dismissFirstSteps(),
    restoreFirstSteps: () => executionUi.todayTabController.restoreFirstSteps(),
    renderFirstStepsMissionCard: () => executionUi.todayTabController.renderFirstStepsMissionCard(),
    getOnboardingController: () => executionUi?.onboardingModalController,
    selectSessionHistoryDate: (date: string) =>
      executionUi.sessionHistoryController.selectSessionHistoryDate(date),
    renderExamIntelligenceSection: () =>
      planningUi.examMatrixController.renderExamIntelligenceSection(),
    renderStudyTrack32Insights: () =>
      planningUi.weeklyCloseModalController.renderStudyTrack32Insights(),
    feedbackRecoveryResult: planningUi.feedbackRecoveryResult,
    calculateStudyPlanPreview: () =>
      planningUi.studyPlanBuilderController.calculateStudyPlanPreview(),
    getStudyPlanPreview: () => planningUi.studyPlanBuilderController.getStudyPlanPreview(),
    getLatestStudyPlan: () => planningUi.studyPlanBuilderController.latestStudyPlan(),
    refreshStudyRecommendationItems: () =>
      executionUi.studyRecommendationController.refreshStudyRecommendationItems(),
    getCurrentStudyRecommendations: () =>
      executionUi.studyRecommendationController.getCurrentRecommendations(),
    executeStudyRecommendation: (id: string, source?: string) =>
      executionUi.studyRecommendationController.executeStudyRecommendation(id, source),
    getDailyPriority: (action: any) =>
      executionUi.todayTabController.dailyExecutionController.build(action)?.priority,
  });

  executionUi = wireExecutionAndOnboardingUi({
    ...deps,
    listViewState,
    LIST_VIEW_STEPS,
    isMobileHistoryLayout,
    activeTabName,
    activateTab,
    guidedTourController: analyticsUi.guidedTourController,
    syncModalShell: () => analyticsUi.shellUiController?.syncModalShell(),
    renderHeatmap: () => analyticsUi.dashboardTabController.renderHeatmap(),
    renderDiagnosisCenter: () => analyticsUi.diagnosticsTabController.renderDiagnosisCenter(),
    renderAlertasInteligentes: () =>
      analyticsUi.diagnosticsTabController.renderAlertasInteligentes(),
    renderRecommendationHistorySummary: () =>
      analyticsUi.approvalTabController.renderRecommendationHistorySummary(),
    addQuestaoRow: (initial?: any) => practiceUi.questionsTabController.addQuestaoRow(initial),
    addSimuladoRow: () => practiceUi.simulationsTabController.addSimuladoRow(),
    completeAgendaReview: (id: string) => practiceUi.reviewsTabController.completeAgendaReview(id),
    getLatestStudyPlan: () => planningUi.studyPlanBuilderController.latestStudyPlan(),
    buildCurrentStudyPlanProposal: (opts?: any) =>
      planningUi.studyPlanBuilderController.buildCurrentStudyPlanProposal(opts),
    calculateStudyPlanPreview: () =>
      planningUi.studyPlanBuilderController.calculateStudyPlanPreview(),
    getStudyPlanPreview: () => planningUi.studyPlanBuilderController.getStudyPlanPreview(),
    confirmStudyPlan: () => planningUi.studyPlanBuilderController.confirmStudyPlan(),
    calculateDailyPlanPreview: () =>
      planningUi.studyPlanBuilderController.calculateDailyPlanPreview(),
    getDailyPlanPreview: () => planningUi.studyPlanBuilderController.getDailyPlanPreview(),
    confirmDailyPlanPreview: () => planningUi.studyPlanBuilderController.confirmDailyPlanPreview(),
  });

  registerDelegatedActions({
    document,
    window,
    todayISO,
    parseLocalDate,
    showToast,
    activateTab,
    controllers: {
      dashboard: analyticsUi.dashboardTabController,
      studyPlan: planningUi.studyPlanBuilderController,
      weeklyClose: planningUi.weeklyCloseModalController,
      performance: analyticsUi.performanceTabController,
      subjects: practiceUi.subjectsTabController,
      questions: practiceUi.questionsTabController,
      simulations: practiceUi.simulationsTabController,
      calendar: practiceUi.calendarTabController,
      reviews: practiceUi.reviewsTabController,
      today: executionUi.todayTabController,
      recommendations: executionUi.studyRecommendationController,
      onboarding: executionUi.onboardingModalController,
      examMatrix: planningUi.examMatrixController,
      timerUi: executionUi.timerUiController,
      studyTimerRuntime: executionUi.studyTimerRuntime,
      diagnostics: analyticsUi.diagnosticsTabController,
      approval: analyticsUi.approvalTabController,
      goals: planningUi.goalsTabController,
      goalsBlueprint: analytics.goalsBlueprintService,
      sessionHistory: executionUi.sessionHistoryController,
    },
    customHandlers: {
      advanceGuidedStrategy: () => executionUi.studyTimerRuntime.advanceGuidedStrategy(),
      changeUpcomingLimit: (delta: number) =>
        analyticsUi.dashboardTabController.changeUpcomingLimit(delta),
      showAllUpcoming: () => analyticsUi.dashboardTabController.showAllUpcoming(),
      resetUpcomingLimit: () => analyticsUi.dashboardTabController.resetUpcomingLimit(),
      setPerformanceViewMode: (mode: string) =>
        practiceUi.questionAnalyticsController.setViewMode(mode),
      setErrorAnalysisFilter: (field: string, value: any) =>
        practiceUi.questionAnalyticsController.setErrorAnalysisFilter(field, value),
      changePerformanceLimit: () => practiceUi.questionAnalyticsController.changePerformanceLimit(),
      showAllPerformance: () => practiceUi.questionAnalyticsController.showAllPerformance(),
      resetPerformanceLimit: () => practiceUi.questionAnalyticsController.resetPerformanceLimit(),
      showAllRetention: () => analyticsUi.approvalTabController.showAllRetention(),
      resetRetentionLimit: () => analyticsUi.approvalTabController.resetRetentionLimit(),
      setRetentionFilter: (field: string, value: any) =>
        analyticsUi.approvalTabController.setRetentionFilter(field, value),
      updateExamSubject: analytics.goalsBlueprintService.updateExamSubject,
    },
    specialConfig: {
      onSetPerformanceSubject: value => practiceUi.questionAnalyticsController.setSubjectId(value),
      renderQuestionAnalytics: () =>
        practiceUi.questionAnalyticsController.renderQuestionAnalytics(),
      getListViewSteps: () => LIST_VIEW_STEPS,
      getListViewState: () => listViewState,
      changeListLimit,
      getRenderers: () => ({
        renderQuestoes: () => practiceUi.questionsTabController.renderQuestoes(),
        renderSimulados: () => practiceUi.simulationsTabController.renderSimulados(),
        renderStudySessionsHistory: () =>
          executionUi.sessionHistoryController.renderStudySessionsHistory(),
      }),
    },
  });

  tabRouter.registerShortcuts();

  return {
    tabRouter,
    activateTab,
    activeTabName,
    resetRecordListLimits,
    ...practiceUi,
    ...planningUi,
    ...executionUi,
    ...analyticsUi,
    renderHandlers: {
      renderPerformance: () => analyticsUi.performanceTabController.renderPerformance(),
      renderKPIs: () => analyticsUi.dashboardTabController.renderKPIs(),
      renderGuidedOnboarding: () => executionUi.onboardingModalController.renderGuidedOnboarding(),
      renderOverviewDecisionArea: () =>
        executionUi.studyRecommendationController.renderOverviewDecisionArea(),
      renderApprovalDashboard: () => analyticsUi.approvalTabController.renderApprovalDashboard(),
      populateTimerContextControls: () =>
        executionUi.studyTimerRuntime.populateTimerContextControls(),
      renderHeader: () => analyticsUi.dashboardTabController.renderHeader(),
      renderProgressChart: () => analyticsUi.performanceTabController.renderProgressChart(),
      renderBadges: () => analyticsUi.achievementsController.render(),
      renderRadarDisciplinas: () => analyticsUi.performanceTabController.renderRadarDisciplinas(),
      renderDashboard: () => analyticsUi.dashboardTabController.renderDashboard(),
      renderStudySessionsHistory: () =>
        executionUi.sessionHistoryController.renderStudySessionsHistory(),
      renderSubjects: () => practiceUi.subjectsTabController.renderSubjects(),
      renderCalIndicadores: () => practiceUi.calendarTabController.renderCalIndicadores(),
      renderCalTarefasHoje: (elId?: string) =>
        practiceUi.calendarTabController.renderCalTarefasHoje(elId),
      renderCalAtrasadas: (elId?: string) =>
        practiceUi.calendarTabController.renderCalAtrasadas(elId),
      renderCalendarFilters: () => practiceUi.calendarTabController.renderCalendarFilters(),
      renderCalendar: () => practiceUi.calendarTabController.renderCalendar(),
      renderMonthCalendar: () => practiceUi.calendarTabController.renderMonthCalendar(),
      renderAgendaFilters: () => practiceUi.reviewsTabController.renderAgendaFilters(),
      renderAgenda: () => practiceUi.reviewsTabController.renderAgenda(),
      renderErrorNotebookDueNotices: () => practiceUi.errorNotebookController.renderDueNotices(),
      renderQuestoes: () => practiceUi.questionsTabController.renderQuestoes(),
      renderQuestionAnalytics: () =>
        practiceUi.questionAnalyticsController.renderQuestionAnalytics(),
      renderSimulados: () => practiceUi.simulationsTabController.renderSimulados(),
      renderMetas: () => planningUi.goalsTabController.renderMetasSection(),
      renderPlanExecution: () => planningUi.goalsTabController.renderPlanExecutionSection(),
      renderExamBlueprintConfig: () => planningUi.examMatrixController.renderExamBlueprintConfig(),
      renderStudyPlanBuilder: () => planningUi.studyPlanBuilderController.renderStudyPlanBuilder(),
      renderWeeklyHoursGoals: () => planningUi.goalsTabController.renderWeeklyHoursGoalsSection(),
      renderSubjectTargetEditor: () =>
        planningUi.subjectTargetEditorController.renderSubjectTargetEditor(),
      renderMetasPorDisciplina: () =>
        planningUi.goalsTabController.renderMetasPorDisciplinaSection(),
      renderHistoricoMetas: () => planningUi.goalsTabController.renderHistoricoMetasSection(),
      renderRitmo: () => planningUi.goalsTabController.renderRitmo(),
      renderExecutiveSummary: () => analyticsUi.diagnosticsTabController.renderExecutiveSummary(),
      renderDiagnosisCenter: () => analyticsUi.diagnosticsTabController.renderDiagnosisCenter(),
      renderStudyRecommendation: () =>
        executionUi.studyRecommendationController.renderStudyRecommendation(),
      renderWeeklyReplan: () => executionUi.studyRecommendationController.renderWeeklyReplan(),
      renderSimuladosPlanejados: () => executionUi.todayTabController.renderSimuladosPlanejados(),
      renderMetasHoje: () => executionUi.todayTabController.renderMetasHoje(),
      renderAlertasInteligentes: () =>
        analyticsUi.diagnosticsTabController.renderAlertasInteligentes(),
      renderPlanoHoje: () => executionUi.todayTabController.renderPlanoHoje(),
      renderDailyExecutionCard: () => executionUi.todayTabController.renderDailyExecutionCard(),
    },
    onResponsiveChange: () => {
      practiceUi.questionsTabController.renderQuestoes();
      practiceUi.simulationsTabController.renderSimulados();
      executionUi.sessionHistoryController.renderStudySessionsHistory();
      practiceUi.reviewsTabController.renderAgenda();
      practiceUi.calendarTabController.renderCalendar();
    },
  };
}
