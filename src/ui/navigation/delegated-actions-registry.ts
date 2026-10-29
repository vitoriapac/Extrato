import {
  composeDelegatedActionHandlers,
  createDelegatedArgumentResolver,
  createSpecialActionResolver,
} from '../events/delegated-actions.js';
import { createDelegatedEventsController } from '../controllers/delegated-events-controller.js';
import { scrollBehavior } from '../accessibility.js';

export interface DelegatedActionsRegistryDeps {
  document: Document | any;
  window?: Window | any;
  todayISO: () => string;
  parseLocalDate: (iso: string) => Date | null;
  showToast: (message: string) => void;
  activateTab: (tab: string) => void;
  customHandlers?: Record<string, Function>;
  specialConfig?: {
    onSetPerformanceSubject?: (value: string) => void;
    renderQuestionAnalytics?: () => void;
    getListViewSteps?: () => Record<string, number>;
    getListViewState?: () => Record<string, number>;
    changeListLimit?: (listKey: string, delta: number, renderer: () => void) => void;
    getRenderers?: () => Record<string, () => void>;
  };
  controllers?: {
    dashboard?: any;
    studyPlan?: any;
    weeklyClose?: any;
    performance?: any;
    subjects?: any;
    questions?: any;
    simulations?: any;
    calendar?: any;
    reviews?: any;
    today?: any;
    recommendations?: any;
    onboarding?: any;
    examMatrix?: any;
    timerUi?: any;
    studyTimerRuntime?: any;
    diagnostics?: any;
    approval?: any;
    goals?: any;
    goalsBlueprint?: any;
    sessionHistory?: any;
  };
}

export function buildDelegatedActionHandlers(deps: DelegatedActionsRegistryDeps): Record<string, Function> {
  const c = deps.controllers || {};
  const custom = deps.customHandlers || {};

  const defaultHandlers: Record<string, Function> = {
    // Navigation / Close
    openWeeklyAdherencePlanning: () => deps.activateTab('metas'),
    openWeeklyClose: (...args: any[]) => c.weeklyClose?.openWeeklyClose?.(...args),
    reviewPlanningCapacity: () => c.weeklyClose?.sustainabilityController?.review?.(),
    setStrategicTimelineFilter: (...args: any[]) => c.weeklyClose?.setStrategicTimelineFilter?.(...args),
    setStrategicTimelineGroup: (...args: any[]) => c.weeklyClose?.setStrategicTimelineGroup?.(...args),
    setPriorityHistorySubject: (...args: any[]) => c.weeklyClose?.setPriorityHistorySubject?.(...args),
    saveWeeklyCloseSnapshot: (...args: any[]) => c.weeklyClose?.saveWeeklyCloseSnapshot?.(...args),
    previewWeeklyCloseActions: (...args: any[]) => c.weeklyClose?.previewWeeklyCloseActions?.(...args),
    confirmWeeklyCloseActions: (...args: any[]) => c.weeklyClose?.confirmWeeklyCloseActions?.(...args),
    toggleWeeklyPriority: (...args: any[]) => c.weeklyClose?.toggleWeeklyPriority?.(...args),

    // Reviews Agenda
    addAgendaRow: (...args: any[]) => c.reviews?.addAgendaRow?.(...args),
    cancelAgendaEdit: (...args: any[]) => c.reviews?.cancelAgendaEdit?.(...args),
    changeAgendaLimit: (...args: any[]) => c.reviews?.changeAgendaLimit?.(...args),
    completeAgendaReview: (...args: any[]) => c.reviews?.completeAgendaReview?.(...args),
    rateCompletedReview: (...args: any[]) => c.reviews?.rateCompletedReview?.(...args),
    deleteAgendaRow: (...args: any[]) => c.reviews?.deleteAgendaRow?.(...args),
    editAgenda: (...args: any[]) => c.reviews?.editAgenda?.(...args),
    gerarAgendaAutomatica: (...args: any[]) => c.reviews?.gerarAgendaAutomatica?.(...args),
    resetAdaptiveReviewDate: (...args: any[]) => c.reviews?.resetAdaptiveReviewDate?.(...args),
    resetAgendaLimit: (...args: any[]) => c.reviews?.resetAgendaLimit?.(...args),
    saveAgendaEdit: (...args: any[]) => c.reviews?.saveAgendaEdit?.(...args),
    toggleCompletedReviews: (...args: any[]) => c.reviews?.toggleCompletedReviews?.(...args),
    updateAgenda: (...args: any[]) => c.reviews?.updateAgenda?.(...args),
    updateAgendaDraft: (...args: any[]) => c.reviews?.updateAgendaDraft?.(...args),

    // Simulations & Breakdowns
    addBreakdownRow: (...args: any[]) => c.simulations?.addBreakdownRow?.(...args),
    deleteBreakdownRow: (...args: any[]) => c.simulations?.deleteBreakdownRow?.(...args),
    updateBreakdownRow: (...args: any[]) => c.simulations?.updateBreakdownRow?.(...args),
    addSimuladoRow: (...args: any[]) => c.simulations?.addSimuladoRow?.(...args),
    cancelSimulationEdit: (...args: any[]) => c.simulations?.cancelSimulationEdit?.(...args),
    deleteSimuladoRow: (...args: any[]) => c.simulations?.deleteSimuladoRow?.(...args),
    editSimulation: (...args: any[]) => c.simulations?.editSimulation?.(...args),
    saveSimulationEdit: (...args: any[]) => c.simulations?.saveSimulationEdit?.(...args),
    toggleBreakdown: (...args: any[]) => c.simulations?.toggleBreakdown?.(...args),
    updateSimulationDraft: (...args: any[]) => c.simulations?.updateSimulationDraft?.(...args),

    // Calendar
    addCalRow: (...args: any[]) => c.calendar?.addCalRow?.(...args),
    cancelCalendarEdit: (...args: any[]) => c.calendar?.cancelCalendarEdit?.(...args),
    changeCalendarLimit: (...args: any[]) => c.calendar?.changeCalendarLimit?.(...args),
    changeOverdueGroupLimit: (...args: any[]) => c.calendar?.changeOverdueGroupLimit?.(...args),
    completeCalendarItem: (...args: any[]) => c.calendar?.completeCalendarItem?.(...args),
    completeUnifiedReview: (...args: any[]) => c.calendar?.completeUnifiedReview?.(...args),
    deleteCalRow: (...args: any[]) => c.calendar?.deleteCalRow?.(...args),
    editCalendarItem: (...args: any[]) => c.calendar?.editCalendarItem?.(...args),
    resetCalendarLimit: (...args: any[]) => c.calendar?.resetCalendarLimit?.(...args),
    resetOverdueGroupLimit: (...args: any[]) => c.calendar?.resetOverdueGroupLimit?.(...args),
    saveCalendarEdit: (...args: any[]) => c.calendar?.saveCalendarEdit?.(...args),
    showAllOverdueGroups: (...args: any[]) => c.calendar?.showAllOverdueGroups?.(...args),
    toggleFilterPanel: (...args: any[]) => c.calendar?.toggleFilterPanel?.(...args),
    toggleOverdueDate: (...args: any[]) => c.calendar?.toggleOverdueDate?.(...args),
    updateCal: (...args: any[]) => c.calendar?.updateCal?.(...args),
    updateCalendarDraft: (...args: any[]) => c.calendar?.updateCalendarDraft?.(...args),

    // Questions
    addQuestaoRow: (...args: any[]) => c.questions?.addQuestaoRow?.(...args),
    cancelQuestionEdit: (...args: any[]) => c.questions?.cancelQuestionEdit?.(...args),
    deleteQuestaoRow: (...args: any[]) => c.questions?.deleteQuestaoRow?.(...args),
    editQuestion: (...args: any[]) => c.questions?.editQuestion?.(...args),
    saveQuestionEdit: (...args: any[]) => c.questions?.saveQuestionEdit?.(...args),
    toggleQuestionErrors: (...args: any[]) => c.questions?.toggleQuestionErrors?.(...args),
    updateQuestionDraft: (...args: any[]) => c.questions?.updateQuestionDraft?.(...args),
    updateQuestionError: (...args: any[]) => c.questions?.updateQuestionError?.(...args),
    setErrorAnalysisFilter: (f: string, v: any) => {
      if (c.questions?.setErrorAnalysisFilter) {
        c.questions.setErrorAnalysisFilter(f, v);
      } else if (custom?.['setErrorAnalysisFilter']) {
        custom['setErrorAnalysisFilter'](f, v);
      }
    },

    // Subjects & Topics
    addSubject: (...args: any[]) => c.subjects?.addSubject?.(...args),
    addTopic: (...args: any[]) => c.subjects?.addTopic?.(...args),
    archiveSubject: (...args: any[]) => c.subjects?.archiveSubject?.(...args),
    archiveTopic: (...args: any[]) => c.subjects?.archiveTopic?.(...args),
    changeSubjectTopicLimit: (...args: any[]) => c.subjects?.changeSubjectTopicLimit?.(...args),
    duplicateSubject: (...args: any[]) => c.subjects?.duplicateSubject?.(...args),
    moveSubject: (...args: any[]) => c.subjects?.moveSubject?.(...args),
    renameSubject: (...args: any[]) => c.subjects?.renameSubject?.(...args),
    requestPermanentSubjectDelete: (...args: any[]) => c.subjects?.requestPermanentSubjectDelete?.(...args),
    requestPermanentTopicDelete: (...args: any[]) => c.subjects?.requestPermanentTopicDelete?.(...args),
    resetSubjectTopicLimit: (...args: any[]) => c.subjects?.resetSubjectTopicLimit?.(...args),
    restoreSubject: (...args: any[]) => c.subjects?.restoreSubject?.(...args),
    restoreTopic: (...args: any[]) => c.subjects?.restoreTopic?.(...args),
    setSubjectExamFilter: (...args: any[]) => c.subjects?.setSubjectExamFilter?.(...args),
    setSubjectTopicFilter: (...args: any[]) => c.subjects?.setSubjectTopicFilter?.(...args),
    showAllSubjectTopics: (...args: any[]) => c.subjects?.showAllSubjectTopics?.(...args),
    toggleNotes: (...args: any[]) => c.subjects?.toggleNotes?.(...args),
    toggleSubject: (...args: any[]) => c.subjects?.toggleSubject?.(...args),
    toggleTopicPrerequisite: (...args: any[]) => c.subjects?.toggleTopicPrerequisite?.(...args),
    updateTopic: (...args: any[]) => c.subjects?.updateTopic?.(...args),
    updateTopicStatus: (...args: any[]) => c.subjects?.updateTopicStatus?.(...args),
    updateTopicStrategy: (...args: any[]) => c.subjects?.updateTopicStrategy?.(...args),
    updateTopicTags: (...args: any[]) => c.subjects?.updateTopicTags?.(...args),

    // Goals Tab
    applyTodayGoalToAllDays: (...args: any[]) =>
      (c.goals?.applyTodayGoalToAllDays || c.goalsBlueprint?.applyTodayGoalToAllDays)?.(...args),
    clearWeekendGoals: (...args: any[]) =>
      (c.goals?.clearWeekendGoals || c.goalsBlueprint?.clearWeekendGoals)?.(...args),
    deleteMetaDisciplina: (...args: any[]) =>
      (c.goals?.deleteMetaDisciplina || c.goalsBlueprint?.deleteMetaDisciplina)?.(...args),
    updateMeta: (...args: any[]) =>
      (c.goals?.updateMeta || c.goalsBlueprint?.updateMeta)?.(...args),
    updateMetaDisciplina: (...args: any[]) =>
      (c.goals?.updateMetaDisciplina || c.goalsBlueprint?.updateMetaDisciplina)?.(...args),
    updateMetaHoursDay: (...args: any[]) =>
      (c.goals?.updateMetaHoursDay || c.goalsBlueprint?.updateMetaHoursDay)?.(...args),

    // Study Plan Builder & Adaptive Planning
    previewPhaseStrategy: (...args: any[]) => c.studyPlan?.previewPhaseStrategy?.(...args),
    cancelPhaseStrategy: (...args: any[]) => c.studyPlan?.cancelPhaseStrategy?.(...args),
    confirmPhaseStrategy: (...args: any[]) => c.studyPlan?.confirmPhaseStrategy?.(...args),
    revertPhaseStrategy: (...args: any[]) => c.studyPlan?.revertPhaseStrategy?.(...args),
    calculateStudyPlanPreview: (...args: any[]) => c.studyPlan?.calculateStudyPlanPreview?.(...args),
    clearStudyPlanPreview: (...args: any[]) => c.studyPlan?.clearStudyPlanPreview?.(...args),
    confirmStudyPlan: (...args: any[]) => c.studyPlan?.confirmStudyPlan?.(...args),
    useAdaptivePlanAdvice: (...args: any[]) => c.studyPlan?.useAdaptivePlanAdvice?.(...args),
    rejectAdaptivePlanAdvice: (...args: any[]) => c.studyPlan?.rejectAdaptivePlanAdvice?.(...args),
    revertAdaptivePlanningDecision: (...args: any[]) => c.studyPlan?.revertAdaptivePlanningDecision?.(...args),
    calculateDailyPlanPreview: (...args: any[]) => c.studyPlan?.calculateDailyPlanPreview?.(...args),
    clearDailyPlanPreview: (...args: any[]) => c.studyPlan?.clearDailyPlanPreview?.(...args),
    confirmDailyPlanPreview: (...args: any[]) => c.studyPlan?.confirmDailyPlanPreview?.(...args),
    undoLatestDailyPlanGeneration: (...args: any[]) => c.studyPlan?.undoLatestDailyPlanGeneration?.(...args),

    // Study Recommendations & Replan
    calculateReplanPreview: (...args: any[]) => c.recommendations?.calculateReplanPreview?.(...args),
    clearReplanPreview: (...args: any[]) => c.recommendations?.clearReplanPreview?.(...args),
    confirmReplan: (...args: any[]) => c.recommendations?.confirmReplan?.(...args),
    undoPlanAdjustment: (...args: any[]) => c.recommendations?.undoPlanAdjustment?.(...args),
    executeStudyRecommendation: (...args: any[]) => c.recommendations?.executeStudyRecommendation?.(...args),
    dismissStudyRecommendation: (...args: any[]) => c.recommendations?.dismissStudyRecommendation?.(...args),
    markRecommendationNotUseful: (...args: any[]) => c.recommendations?.markRecommendationNotUseful?.(...args),
    rateRecommendationOutcome: (...args: any[]) => c.recommendations?.rateRecommendationOutcome?.(...args),
    startStudyRecommendation: (...args: any[]) =>
      (c.recommendations?.startStudyRecommendation || c.studyTimerRuntime?.startStudyRecommendation)?.(...args),

    // Timer UI
    focusStudyTimer: (...args: any[]) => c.timerUi?.focusStudyTimer?.(...args),
    openStudyTimerFocus: (...args: any[]) => c.timerUi?.openStudyTimerFocus?.(...args),
    toggleTimerFocus: (f: boolean | null = null) => c.timerUi?.toggleTimerFocus?.(f),
    advanceGuidedStrategy: (...args: any[]) =>
      (c.studyTimerRuntime?.advanceGuidedStrategy || c.timerUi?.advanceGuidedStrategy)?.(...args),

    // Dashboard
    navigateKpi: (...args: any[]) => c.dashboard?.navigateKpi?.(...args),
    selectHeatmapDay: (...args: any[]) => c.dashboard?.selectHeatmapDay?.(...args),
    setHeatmapFilter: (...args: any[]) => c.dashboard?.setHeatmapFilter?.(...args),
    viewSelectedHeatmapSessions: (...args: any[]) => c.dashboard?.viewSelectedHeatmapSessions?.(...args),
    toggleStreakActiveDays: (...args: any[]) => c.dashboard?.toggleStreakActiveDays?.(...args),
    toggleStreakExpanded: (...args: any[]) => c.dashboard?.toggleStreakExpanded?.(...args),
    changeUpcomingLimit: (...args: any[]) => c.dashboard?.changeUpcomingLimit?.(...args),
    resetUpcomingLimit: (...args: any[]) => c.dashboard?.resetUpcomingLimit?.(...args),
    showAllUpcoming: (...args: any[]) => c.dashboard?.showAllUpcoming?.(...args),
    openNextSessionAction: () => {
      deps.activateTab('dashboard');
      deps.document?.getElementById('overviewNextAction')?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
    },

    // Diagnostics & Approval
    dismissIntelligentAlert: (...args: any[]) => c.diagnostics?.dismissIntelligentAlert?.(...args),
    setRetentionFilter: (f: string, v?: any) => {
      if (c.approval?.setRetentionFilter) {
        c.approval.setRetentionFilter(f, v);
      } else if (custom?.['setRetentionFilter']) {
        custom['setRetentionFilter'](f, v);
      }
    },
    resetRetentionLimit: () => {
      if (c.approval?.resetRetentionLimit) {
        c.approval.resetRetentionLimit();
      } else if (custom?.['resetRetentionLimit']) {
        custom['resetRetentionLimit']();
      }
    },
    showAllRetention: () => {
      if (c.approval?.showAllRetention) {
        c.approval.showAllRetention();
      } else if (custom?.['showAllRetention']) {
        custom['showAllRetention']();
      }
    },

    // Performance
    setRadarSubject: (...args: any[]) => c.performance?.setRadarSubject?.(...args),
    setPerformanceViewMode: (v: any) => {
      if (c.performance?.setPerformanceViewMode) {
        c.performance.setPerformanceViewMode(v);
      } else if (custom?.['setPerformanceViewMode']) {
        custom['setPerformanceViewMode'](v);
      }
    },
    changePerformanceLimit: (d: number) => {
      if (c.performance?.changePerformanceLimit) {
        c.performance.changePerformanceLimit(d);
      } else if (custom?.['changePerformanceLimit']) {
        custom['changePerformanceLimit'](d);
      }
    },
    resetPerformanceLimit: () => {
      if (c.performance?.resetPerformanceLimit) {
        c.performance.resetPerformanceLimit();
      } else if (custom?.['resetPerformanceLimit']) {
        custom['resetPerformanceLimit']();
      }
    },
    showAllPerformance: () => {
      if (c.performance?.showAllPerformance) {
        c.performance.showAllPerformance();
      } else if (custom?.['showAllPerformance']) {
        custom['showAllPerformance']();
      }
    },

    // Session History
    cancelStudySessionEdit: (...args: any[]) => c.sessionHistory?.cancelStudySessionEdit?.(...args),
    clearSessionHistoryFilters: (...args: any[]) => c.sessionHistory?.clearSessionHistoryFilters?.(...args),
    deleteStudySession: (...args: any[]) => c.sessionHistory?.deleteStudySession?.(...args),
    editStudySession: (...args: any[]) => c.sessionHistory?.editStudySession?.(...args),
    saveStudySessionEdit: (...args: any[]) => c.sessionHistory?.saveStudySessionEdit?.(...args),
    selectSessionHistoryDate: (...args: any[]) => c.sessionHistory?.selectSessionHistoryDate?.(...args),
    toggleSessionDay: (...args: any[]) => c.sessionHistory?.toggleSessionDay?.(...args),
    toggleSessionDetails: (...args: any[]) => c.sessionHistory?.toggleSessionDetails?.(...args),
    updateSessionHistoryFilter: (...args: any[]) => c.sessionHistory?.updateSessionHistoryFilter?.(...args),
    updateStudySessionDraft: (...args: any[]) => c.sessionHistory?.updateStudySessionDraft?.(...args),

    // Exam Matrix / Blueprint
    toggleActiveExamTag: (...args: any[]) => c.examMatrix?.toggleActiveExamTag?.(...args),
    updateExamBlueprint: (...args: any[]) =>
      (c.examMatrix?.updateExamBlueprint || c.goalsBlueprint?.updateExamBlueprint)?.(...args),
    updateExamSubject: (id: string, f: string, v: any) => {
      if (c.examMatrix?.updateExamSubject) {
        c.examMatrix.updateExamSubject(id, f, v);
      } else if (c.goalsBlueprint?.updateExamSubject) {
        c.goalsBlueprint.updateExamSubject(id, f, v);
      } else if (custom?.['updateExamSubject']) {
        custom['updateExamSubject'](id, f, v);
      }
    },
    saveExamSubjectConfig: (...args: any[]) => c.examMatrix?.saveExamSubjectConfig?.(...args),
    cancelExamSubjectConfig: (...args: any[]) => c.examMatrix?.cancelExamSubjectConfig?.(...args),

    // Today Tab / Timer Runtime
    startPlannedActivity: (...args: any[]) =>
      (c.studyTimerRuntime?.startPlannedActivity || c.today?.startPlannedActivity)?.(...args),
  };

  return composeDelegatedActionHandlers(defaultHandlers, custom);
}

export function registerDelegatedActions(deps: DelegatedActionsRegistryDeps) {
  const handlers = buildDelegatedActionHandlers(deps);
  const parseArgument = createDelegatedArgumentResolver({
    getTodayDayOfWeek: () => {
      const d = deps.parseLocalDate(deps.todayISO());
      return d ? d.getDay() : new Date().getDay();
    },
  });

  const resolveSpecial = deps.specialConfig
    ? createSpecialActionResolver({
        onSetPerformanceSubject: deps.specialConfig.onSetPerformanceSubject || (() => {}),
        renderQuestionAnalytics: deps.specialConfig.renderQuestionAnalytics || (() => {}),
        getListViewSteps: deps.specialConfig.getListViewSteps || (() => ({})),
        getListViewState: deps.specialConfig.getListViewState || (() => ({})),
        changeListLimit: deps.specialConfig.changeListLimit || (() => {}),
        getRenderers: deps.specialConfig.getRenderers || (() => ({})),
      })
    : () => false;

  const controller = createDelegatedEventsController({
    document: deps.document,
    handlers,
    parseArgument,
    resolveSpecial,
    onError: (error: unknown) => {
      console.error('Evento delegado bloqueado', error);
      deps.showToast('Uma ação inválida foi bloqueada por segurança.');
    },
  });

  controller.register();
  return { handlers, controller };
}
