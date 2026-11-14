import { DIFFICULTY_OPTIONS } from '../../state/schema.js';
import { formatDuration, formatPlanMinutes } from '../../core/format-duration.js';
import { needsMaintenance } from '../../domain/study-eligibility.js';
import { recommendationActionKind } from '../../application/recommendations/recommendation-action.js';
import { displayReadinessValue } from '../../application/analytics/build-header-view-model.js';
import { freezePlanExecution } from '../../domain/planning/plan-execution-snapshot.js';
import { createTimerUiController } from '../../ui/controllers/timer-ui-controller.js';
import { createStudyTimerRuntimeController } from '../../ui/controllers/study-timer-runtime-controller.js';
import { createWhatIfController } from '../../ui/controllers/what-if-controller.js';
import { createTodayTabController } from '../../ui/tabs/today/today-tab-controller.js';
import { createStudyRecommendationController } from '../../ui/tabs/today/study-recommendation-controller.js';
import { createOnboardingModalController } from '../../features/onboarding/onboarding-modal-controller.js';
import { createFirstAccessModalController } from '../../ui/controllers/first-access-modal-controller.js';
import { createRecoveryMissionController } from '../../ui/controllers/recovery-mission-controller.js';
import type { OverdueReviewItem } from '../../domain/recovery/recovery-mission-engine.js';
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
    getAchievementNote,
    getAchievements,
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
    getReadinessValue: () =>
      displayReadinessValue(
        approvalReadinessService.readinessResult(approvalReadinessService.computeApprovalMetrics())
      ),
    getReadinessResult: () => {
      const result = approvalReadinessService.readinessResult(
        approvalReadinessService.computeApprovalMetrics()
      );
      return { ...result, value: displayReadinessValue(result) };
    },
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
    getAchievementNote,
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
        // Primeiro registro: abre direto a linha de entrada em vez de uma tabela vazia.
        if (!(getState().questoes || []).length) {
          (document.getElementById('addQuestaoRowBtn') as HTMLElement | null)?.click();
        }
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
    getAchievements,
    diasParaRevisao,
    startOfWeek,
    onOpenRecoveryMission: () => recoveryMissionController?.open(),
    onRecalibrateWeek: () => {
      studyRecommendationController?.calculateReplanPreview();
      activateTab('desempenho');
      setTimeout(() => {
        const el = document.getElementById('weeklyReplan');
        if (el) {
          el.closest('details')?.setAttribute('open', 'true');
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    },
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

  const firstAccessModalController = createFirstAccessModalController({
    getContainer: () => document.getElementById('firstAccessModalMount'),
    getState,
    isDemoMode: () => isDemoMode,
    isTestMode: () => deps.isTestMode ?? false,
    window,
    onStartGuidedPlan: () => onboardingModalController.openGuidedOnboarding(),
    onStartDemo: () => {
      const enterBtn =
        (document.getElementById('enterDemoBtn') as HTMLElement | null) ||
        (document.getElementById('enterDemoEmptyBtn') as HTMLElement | null) ||
        (document.getElementById('enterDemoHeroBtn') as HTMLElement | null);
      enterBtn?.click();
    },
    onPasteSyllabus: () => {
      activateTab('disciplinas');
      setTimeout(() => {
        const buttons = (
          document.querySelectorAll ? Array.from(document.querySelectorAll('button')) : []
        ) as any[];
        const pasteBtn = buttons.find(b => b?.textContent?.includes('Colar Edital'));
        pasteBtn?.click?.();
      }, 60);
    },
  });

  const getRecoveryMissionMount = () => {
    let mount = document.getElementById('recoveryMissionModalMount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'recoveryMissionModalMount';
      document.body?.appendChild?.(mount);
    }
    return mount;
  };

  const getOverdueReviewsForMission = (): OverdueReviewItem[] => {
    const today = todayISO();
    const unificadas = studyMetricsSelectors.getRevisoesUnificadas() || [];
    return unificadas
      .filter((item: any) => item.date && item.date < today && item.status !== 'Concluído')
      .map((item: any) => {
        const topicId = item.topicId || item.topicRef;
        const topicName = item.label ? item.label.split('·')[0].trim() : 'Tópico';
        return {
          id: item.id,
          origin: item.origem || 'Agenda de Revisões',
          date: item.date,
          subjectId: item.subjectId,
          subjectName: item.subject || 'Disciplina',
          topicId,
          topicName,
          daysOverdue: Math.abs(diasParaRevisao(item.date) || 1),
        };
      });
  };

  const recoveryMissionController = createRecoveryMissionController({
    getContainer: getRecoveryMissionMount,
    getOverdueReviews: getOverdueReviewsForMission,
    onCompleteReview: (reviewId: string, origin: string) => {
      if (origin === 'Agenda de Revisões') {
        completeAgendaReview(reviewId);
      } else {
        const item = (getState().calendar || []).find((x: any) => x.id === reviewId);
        if (item && item.status !== 'Concluído') {
          item.status = 'Concluído';
          item.updatedAt = nowISO();
        }
      }
      persistAndRender();
      showToast('Revisão resgatada e concluída com sucesso!');
    },
    onMissionFinished: () => {
      persistAndRender();
      todayTabController?.renderPlanoHoje?.();
    },
  });

  document.addEventListener?.('click', (event: any) => {
    const target = event.target as HTMLElement | null;
    const btn =
      target?.closest?.('[data-action="open-recovery-mission"]') ||
      target?.closest?.('button[data-delegated-click*="openRecoveryMission"]');
    if (btn) {
      event.preventDefault?.();
      recoveryMissionController.open();
    }
  });

  if (window) {
    (window as any).__EXTRATO_RECOVERY_MISSION__ = recoveryMissionController;
  }

  return {
    timerUiController,
    studyTimerRuntime,
    whatIfController,
    firstAccessModalController,
    todayTabController,
    recoveryMissionController,
    studyRecommendationController,
    onboardingModalController,
    sessionHistoryController,
  };
}
