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
  scheduleSave: (options?: { silent?: boolean }) => void;
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
  isTestMode?: boolean;
}

export function wireUiControllers(deps: WireUiControllersDeps) {
  const { document, window, todayISO, showToast, render, analytics } = deps;

  const listViewState = {
    questionsPage: 1,
    simulationsPage: 1,
    sessionDaysPage: 1,
    agendaUpcomingPage: 1,
    agendaCompletedPage: 1,
  };

  const isMobileHistoryLayout = () => window.matchMedia('(max-width:850px)').matches;

  function goToListPage(key: string, page: number, renderFn: () => void) {
    // A página do Calendário mora no estado do calendário, a dos tópicos no da disciplina
    // (chave `subjectTopics:<id>`); as demais, em listViewState.
    const topics = practiceUi.subjectsTabController.subjectTopicPages;
    const subjectId = key.startsWith('subjectTopics:') ? key.slice('subjectTopics:'.length) : '';
    const store: Record<string, any> =
      key === 'calendar' ? practiceUi.calendarTabController.calendarUiState : listViewState;
    const previous = (subjectId ? topics.get(subjectId) : store[`${key}Page`]) || 1;
    const clicked = document.activeElement as HTMLElement | null;
    const clickedDir = clicked?.dataset?.pageDir || '';
    const clickedNumber = Boolean(clicked?.closest?.('.list-pagination') && !clickedDir);
    if (subjectId) topics.set(subjectId, page);
    else store[`${key}Page`] = page;
    renderFn();
    // O botão clicado foi recriado: devolve o foco ao mesmo sentido (ou ao outro, na ponta)
    // e traz o início da lista de volta à tela.
    // O botão clicado foi recriado: se era uma seta, o foco volta à mesma seta (ou à página atual,
    // na ponta); se era um número, vai para a página atual. Só entram os botões desta lista.
    const prefix = `goToListPage('${key}',`;
    const buttons = [
      ...document.querySelectorAll<HTMLElement>('.list-pagination .list-page-btn'),
    ].filter(b => b.dataset.delegatedClick?.startsWith(prefix));
    const dir =
      clickedDir ||
      (Math.abs(page - previous) === 1 && !clickedNumber
        ? page > previous
          ? 'next'
          : 'prev'
        : '');
    const current = buttons.find(b => b.getAttribute('aria-current') === 'page');
    const target = (dir && buttons.find(b => b.dataset.pageDir === dir)) || current;
    target?.focus({ preventScroll: true });
    const table = target?.closest('table');
    if (table && table.getBoundingClientRect().top < 0)
      table.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
  }

  let practiceUi: ReturnType<typeof wirePracticeAndCatalogUi>;
  let planningUi: ReturnType<typeof wirePlanningAndGoalsUi>;
  let executionUi: ReturnType<typeof wireExecutionAndOnboardingUi>;
  let analyticsUi: ReturnType<typeof wireAnalyticsAndShellUi>;

  function resetRecordListLimits() {
    listViewState.sessionDaysPage = 1;
    listViewState.questionsPage = 1;
    listViewState.simulationsPage = 1;
    listViewState.agendaUpcomingPage = 1;
    listViewState.agendaCompletedPage = 1;
    practiceUi?.subjectsTabController?.subjectTopicPages.clear();
    analyticsUi?.dashboardTabController?.resetUpcomingListDefault();
    if (practiceUi?.calendarTabController) {
      practiceUi.calendarTabController.calendarUiState.calendarPage = 1;
    }
    practiceUi?.questionAnalyticsController?.resetLimitDefault();
    analyticsUi?.approvalTabController?.resetRetentionLimitDefault();
  }

  const tabRouter = createTabRouter({
    document,
    window,
    onRenderTab: tab => render(tab),
    onResetLists: resetRecordListLimits,
    trapModalTab: event => trapModalTab(event, []),
    onCancelReview: () => practiceUi.reviewsTabController.closeReviewRating(),
    onHashRewrite: () => analyticsUi?.todaySubtabs?.syncFromHash(),
  });
  const activateTab = (tabName: string, updateHash = true) =>
    tabRouter.activateTab(tabName, updateHash);
  const activeTabName = () => tabRouter.activeTabName();

  practiceUi = wirePracticeAndCatalogUi({
    ...deps,
    listViewState,
    isMobileHistoryLayout,
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
    activateTab,
  });

  analyticsUi = wireAnalyticsAndShellUi({
    ...deps,
    examMatrixRows: () => planningUi.examMatrixController.currentRows(),
    activeTabName,
    activateTab,
    renderAgenda: () => practiceUi.reviewsTabController.renderAgenda(),
    renderPlanoHoje: () => executionUi.todayTabController.renderPlanoHoje(),
    // Mesmo modelo da "Execução de hoje": os dois cards citam o mesmo total do plano.
    getTodayPlannedMinutes: () =>
      executionUi.todayTabController.dailyExecutionController.build()?.progress?.plannedMinutes ??
      0,
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
    openAssistantPanel: (
      panel: 'none' | 'quick' | 'copilot' | 'journal' | 'cycle_config' | 'weekly_closing',
      opts?: { sessionId?: string; quickMinutes?: number }
    ) => executionUi?.todayTabController?.openAssistantPanel?.(panel, opts),
    openPlanningCycle: () => planningUi?.goalsTabController?.openPlanningCycle?.(),
    openWeeklyClose: () => planningUi?.weeklyCloseModalController?.openWeeklyClose?.(),
    startGuidedTimerSession: (opts: any) =>
      executionUi?.studyTimerRuntime?.startGuidedTimerSession?.(opts),
  });

  executionUi = wireExecutionAndOnboardingUi({
    ...deps,
    getAchievementNote: () => analyticsUi?.achievementsController?.sessionNote() ?? null,
    getAchievements: () => analyticsUi?.achievementsController?.evaluateAchievements() ?? [],
    listViewState,
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
    openWeeklyClose: () => planningUi.weeklyCloseModalController.openWeeklyClose(),
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
      openWhatIfSimulator: () => executionUi.whatIfController?.open?.(),
    },
    specialConfig: {
      onSetPerformanceSubject: value => practiceUi.questionAnalyticsController.setSubjectId(value),
      renderQuestionAnalytics: () =>
        practiceUi.questionAnalyticsController.renderQuestionAnalytics(),
      goToListPage,
      getRenderers: () => ({
        renderQuestoes: () => practiceUi.questionsTabController.renderQuestoes(),
        renderSimulados: () => practiceUi.simulationsTabController.renderSimulados(),
        renderAgenda: () => practiceUi.reviewsTabController.renderAgenda(),
        renderCalendar: () => practiceUi.calendarTabController.renderCalendar(),
        renderSubjects: () => practiceUi.subjectsTabController.renderSubjects(),
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
      renderSubjectProgressBars: () =>
        analyticsUi.dashboardTabController.renderSubjectProgressBars(),
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
