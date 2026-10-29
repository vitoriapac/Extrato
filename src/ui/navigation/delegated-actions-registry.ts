import {
  composeDelegatedActionHandlers,
  createDelegatedArgumentResolver,
  createSpecialActionResolver,
} from '../events/delegated-actions.js';
import { createDelegatedEventsController } from '../controllers/delegated-events-controller.js';

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
    diagnostics?: any;
    approval?: any;
    goals?: any;
    sessionHistory?: any;
  };
}

export function buildDelegatedActionHandlers(deps: DelegatedActionsRegistryDeps): Record<string, Function> {
  const c = deps.controllers || {};
  const custom = deps.customHandlers || {};

  const defaultHandlers: Record<string, Function> = {
    // Navigation / Close
    openWeeklyAdherencePlanning: () => deps.activateTab('metas'),
    openWeeklyClose: () => c.weeklyClose?.openWeeklyClose?.(),
    reviewPlanningCapacity: () => c.weeklyClose?.sustainabilityController?.review?.(),
    setStrategicTimelineFilter: (v: any) => c.weeklyClose?.setStrategicTimelineFilter?.(v),
    setStrategicTimelineGroup: (v: any) => c.weeklyClose?.setStrategicTimelineGroup?.(v),
    setPriorityHistorySubject: (v: any) => c.weeklyClose?.setPriorityHistorySubject?.(v),
    saveWeeklyCloseSnapshot: () => c.weeklyClose?.saveWeeklyCloseSnapshot?.(),
    previewWeeklyCloseActions: () => c.weeklyClose?.previewWeeklyCloseActions?.(),
    confirmWeeklyCloseActions: () => c.weeklyClose?.confirmWeeklyCloseActions?.(),
    toggleWeeklyPriority: (id: string, checked: boolean) => c.weeklyClose?.toggleWeeklyPriority?.(id, checked),

    // Reviews Agenda
    addAgendaRow: () => c.reviews?.addAgendaRow?.(),
    cancelAgendaEdit: () => c.reviews?.cancelAgendaEdit?.(),
    changeAgendaLimit: (d: number) => c.reviews?.changeAgendaLimit?.(d),
    completeAgendaReview: (id: string) => c.reviews?.completeAgendaReview?.(id),
    rateCompletedReview: (id: string, r: any) => c.reviews?.rateCompletedReview?.(id, r),
    deleteAgendaRow: (id: string) => c.reviews?.deleteAgendaRow?.(id),
    editAgenda: (id: string) => c.reviews?.editAgenda?.(id),
    gerarAgendaAutomatica: () => c.reviews?.gerarAgendaAutomatica?.(),
    resetAdaptiveReviewDate: () => c.reviews?.resetAdaptiveReviewDate?.(),
    resetAgendaLimit: () => c.reviews?.resetAgendaLimit?.(),
    saveAgendaEdit: (id: string) => c.reviews?.saveAgendaEdit?.(id),
    toggleCompletedReviews: () => c.reviews?.toggleCompletedReviews?.(),
    updateAgenda: (id: string, f: string, v: any) => c.reviews?.updateAgenda?.(id, f, v),
    updateAgendaDraft: (id: string, f: string, v: any) => c.reviews?.updateAgendaDraft?.(id, f, v),

    // Simulations & Breakdowns
    addBreakdownRow: (s: string) => c.simulations?.addBreakdownRow?.(s),
    deleteBreakdownRow: (s: string, id: string) => c.simulations?.deleteBreakdownRow?.(s, id),
    updateBreakdownRow: (s: string, id: string, f: string, v: any) => c.simulations?.updateBreakdownRow?.(s, id, f, v),
    addSimuladoRow: () => c.simulations?.addSimuladoRow?.(),
    cancelSimulationEdit: (id: string) => c.simulations?.cancelSimulationEdit?.(id),
    deleteSimuladoRow: (id: string) => c.simulations?.deleteSimuladoRow?.(id),
    editSimulation: (id: string) => c.simulations?.editSimulation?.(id),
    saveSimulationEdit: (id: string) => c.simulations?.saveSimulationEdit?.(id),
    toggleBreakdown: (id: string) => c.simulations?.toggleBreakdown?.(id),
    updateSimulationDraft: (id: string, f: string, v: any) => c.simulations?.updateSimulationDraft?.(id, f, v),

    // Calendar
    addCalRow: () => c.calendar?.addCalRow?.(),
    cancelCalendarEdit: () => c.calendar?.cancelCalendarEdit?.(),
    changeCalendarLimit: (d: number) => c.calendar?.changeCalendarLimit?.(d),
    changeOverdueGroupLimit: (d: number) => c.calendar?.changeOverdueGroupLimit?.(d),
    completeCalendarItem: (id: string) => c.calendar?.completeCalendarItem?.(id),
    completeUnifiedReview: (id: string, o: string) => c.calendar?.completeUnifiedReview?.(id, o),
    deleteCalRow: (id: string) => c.calendar?.deleteCalRow?.(id),
    editCalendarItem: (id: string) => c.calendar?.editCalendarItem?.(id),
    resetCalendarLimit: () => c.calendar?.resetCalendarLimit?.(),
    resetOverdueGroupLimit: () => c.calendar?.resetOverdueGroupLimit?.(),
    saveCalendarEdit: (id: string) => c.calendar?.saveCalendarEdit?.(id),
    showAllOverdueGroups: () => c.calendar?.showAllOverdueGroups?.(),
    toggleFilterPanel: (s: any) => c.calendar?.toggleFilterPanel?.(s),
    toggleOverdueDate: (d: string) => c.calendar?.toggleOverdueDate?.(d),
    updateCal: (id: string, f: string, v: any) => c.calendar?.updateCal?.(id, f, v),
    updateCalendarDraft: (id: string, f: string, v: any) => c.calendar?.updateCalendarDraft?.(id, f, v),

    // Questions
    addQuestaoRow: (p?: any) => c.questions?.addQuestaoRow?.(p),
    cancelQuestionEdit: (id: string) => c.questions?.cancelQuestionEdit?.(id),
    deleteQuestaoRow: (id: string) => c.questions?.deleteQuestaoRow?.(id),
    editQuestion: (id: string) => c.questions?.editQuestion?.(id),
    saveQuestionEdit: (id: string) => c.questions?.saveQuestionEdit?.(id),
    toggleQuestionErrors: (id: string) => c.questions?.toggleQuestionErrors?.(id),
    updateQuestionDraft: (id: string, f: string, v: any) => c.questions?.updateQuestionDraft?.(id, f, v),
    updateQuestionError: (id: string, f: string, v: any) => c.questions?.updateQuestionError?.(id, f, v),
    setErrorAnalysisFilter: (f: string, v: any) => {
      if (c.questions?.setErrorAnalysisFilter) {
        c.questions.setErrorAnalysisFilter(f, v);
      } else if (custom?.['setErrorAnalysisFilter']) {
        custom['setErrorAnalysisFilter'](f, v);
      }
    },

    // Subjects & Topics
    addSubject: () => c.subjects?.addSubject?.(),
    addTopic: (s: string) => c.subjects?.addTopic?.(s),
    archiveSubject: (id: string) => c.subjects?.archiveSubject?.(id),
    archiveTopic: (s: string, t: string) => c.subjects?.archiveTopic?.(s, t),
    changeSubjectTopicLimit: (s: string, d: number) => c.subjects?.changeSubjectTopicLimit?.(s, d),
    duplicateSubject: (id: string) => c.subjects?.duplicateSubject?.(id),
    moveSubject: (id: string, d: number) => c.subjects?.moveSubject?.(id, d),
    renameSubject: (id: string, name: string) => c.subjects?.renameSubject?.(id, name),
    requestPermanentSubjectDelete: (id: string) => c.subjects?.requestPermanentSubjectDelete?.(id),
    requestPermanentTopicDelete: (s: string, t: string) => c.subjects?.requestPermanentTopicDelete?.(s, t),
    resetSubjectTopicLimit: (s: string) => c.subjects?.resetSubjectTopicLimit?.(s),
    restoreSubject: (id: string) => c.subjects?.restoreSubject?.(id),
    restoreTopic: (s: string, t: string) => c.subjects?.restoreTopic?.(s, t),
    setSubjectExamFilter: (v: any) => c.subjects?.setSubjectExamFilter?.(v),
    setSubjectTopicFilter: (s: string, f: string, v: any) => c.subjects?.setSubjectTopicFilter?.(s, f, v),
    showAllSubjectTopics: (s: string) => c.subjects?.showAllSubjectTopics?.(s),
    toggleNotes: (t: string) => c.subjects?.toggleNotes?.(t),
    toggleSubject: (id: string) => c.subjects?.toggleSubject?.(id),
    toggleTopicPrerequisite: (s: string, t: string, p: string, ch: boolean) => c.subjects?.toggleTopicPrerequisite?.(s, t, p, ch),
    updateTopic: (s: string, t: string, f: string, v: any) => c.subjects?.updateTopic?.(s, t, f, v),
    updateTopicStatus: (s: string, t: string, el: HTMLSelectElement) => c.subjects?.updateTopicStatus?.(s, t, el),
    updateTopicStrategy: (s: string, t: string, f: string, v: any) => c.subjects?.updateTopicStrategy?.(s, t, f, v),
    updateTopicTags: (s: string, t: string, v: any) => c.subjects?.updateTopicTags?.(s, t, v),

    // Goals Tab
    applyTodayGoalToAllDays: () => c.goals?.applyTodayGoalToAllDays?.(),
    clearWeekendGoals: () => c.goals?.clearWeekendGoals?.(),
    deleteMetaDisciplina: (id: string) => c.goals?.deleteMetaDisciplina?.(id),
    updateMeta: (f: string, v: any) => c.goals?.updateMeta?.(f, v),
    updateMetaDisciplina: (id: string, v: any) => c.goals?.updateMetaDisciplina?.(id, v),
    updateMetaHoursDay: (d: string, h: any) => c.goals?.updateMetaHoursDay?.(d, h),

    // Study Plan Builder & Adaptive Planning
    previewPhaseStrategy: () => c.studyPlan?.previewPhaseStrategy?.(),
    cancelPhaseStrategy: () => c.studyPlan?.cancelPhaseStrategy?.(),
    confirmPhaseStrategy: () => c.studyPlan?.confirmPhaseStrategy?.(),
    revertPhaseStrategy: () => c.studyPlan?.revertPhaseStrategy?.(),
    calculateStudyPlanPreview: () => c.studyPlan?.calculateStudyPlanPreview?.(),
    clearStudyPlanPreview: () => c.studyPlan?.clearStudyPlanPreview?.(),
    confirmStudyPlan: () => c.studyPlan?.confirmStudyPlan?.(),
    useAdaptivePlanAdvice: () => c.studyPlan?.useAdaptivePlanAdvice?.(),
    rejectAdaptivePlanAdvice: () => c.studyPlan?.rejectAdaptivePlanAdvice?.(),
    revertAdaptivePlanningDecision: (id: string) => c.studyPlan?.revertAdaptivePlanningDecision?.(id),
    calculateDailyPlanPreview: () => c.studyPlan?.calculateDailyPlanPreview?.(),
    clearDailyPlanPreview: () => c.studyPlan?.clearDailyPlanPreview?.(),
    confirmDailyPlanPreview: () => c.studyPlan?.confirmDailyPlanPreview?.(),
    undoLatestDailyPlanGeneration: () => c.studyPlan?.undoLatestDailyPlanGeneration?.(),

    // Study Recommendations & Replan
    calculateReplanPreview: () => c.recommendations?.calculateReplanPreview?.(),
    clearReplanPreview: () => c.recommendations?.clearReplanPreview?.(),
    confirmReplan: () => c.recommendations?.confirmReplan?.(),
    undoPlanAdjustment: () => c.recommendations?.undoPlanAdjustment?.(),
    executeStudyRecommendation: (id: string) => c.recommendations?.executeStudyRecommendation?.(id),
    dismissStudyRecommendation: (id: string) => c.recommendations?.dismissStudyRecommendation?.(id),
    markRecommendationNotUseful: (id: string) => c.recommendations?.markRecommendationNotUseful?.(id),
    rateRecommendationOutcome: (id: string, r: any) => c.recommendations?.rateRecommendationOutcome?.(id, r),
    startStudyRecommendation: (id: string) => c.recommendations?.startStudyRecommendation?.(id),

    // Timer UI
    focusStudyTimer: () => c.timerUi?.focusStudyTimer?.(),
    openStudyTimerFocus: () => c.timerUi?.openStudyTimerFocus?.(),
    toggleTimerFocus: (f: boolean | null = null) => c.timerUi?.toggleTimerFocus?.(f),
    advanceGuidedStrategy: () => c.timerUi?.advanceGuidedStrategy?.(),

    // Dashboard
    navigateKpi: (tab: string, f?: string) => c.dashboard?.navigateKpi?.(tab, f),
    selectHeatmapDay: (d: string) => c.dashboard?.selectHeatmapDay?.(d),
    setHeatmapFilter: (f: string, v: any) => c.dashboard?.setHeatmapFilter?.(f, v),
    viewSelectedHeatmapSessions: () => c.dashboard?.viewSelectedHeatmapSessions?.(),
    toggleStreakActiveDays: () => c.dashboard?.toggleStreakActiveDays?.(),
    toggleStreakExpanded: () => c.dashboard?.toggleStreakExpanded?.(),
    changeUpcomingLimit: (d: number) => c.dashboard?.changeUpcomingLimit?.(d),
    resetUpcomingLimit: () => c.dashboard?.resetUpcomingLimit?.(),
    showAllUpcoming: () => c.dashboard?.showAllUpcoming?.(),
    openNextSessionAction: () => {
      deps.activateTab('dashboard');
      deps.document?.getElementById('overviewNextAction')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },

    // Diagnostics & Approval
    dismissIntelligentAlert: (id: string) => c.diagnostics?.dismissIntelligentAlert?.(id),
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
    setRadarSubject: (slot: string, v: any) => c.performance?.setRadarSubject?.(slot, v),
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
    cancelStudySessionEdit: (id: string) => c.sessionHistory?.cancelStudySessionEdit?.(id),
    clearSessionHistoryFilters: () => c.sessionHistory?.clearSessionHistoryFilters?.(),
    deleteStudySession: (id: string) => c.sessionHistory?.deleteStudySession?.(id),
    editStudySession: (id: string) => c.sessionHistory?.editStudySession?.(id),
    saveStudySessionEdit: (id: string) => c.sessionHistory?.saveStudySessionEdit?.(id),
    selectSessionHistoryDate: (d: string) => c.sessionHistory?.selectSessionHistoryDate?.(d),
    toggleSessionDay: (d: string) => c.sessionHistory?.toggleSessionDay?.(d),
    toggleSessionDetails: (id: string) => c.sessionHistory?.toggleSessionDetails?.(id),
    updateSessionHistoryFilter: (f: string, v: any) => c.sessionHistory?.updateSessionHistoryFilter?.(f, v),
    updateStudySessionDraft: (id: string, f: string, v: any) => c.sessionHistory?.updateStudySessionDraft?.(id, f, v),

    // Exam Matrix / Blueprint
    toggleActiveExamTag: (tag: string) => c.examMatrix?.toggleActiveExamTag?.(tag),
    updateExamBlueprint: (f: string, v: any, o?: any) => c.examMatrix?.updateExamBlueprint?.(f, v, o),
    updateExamSubject: (id: string, f: string, v: any) => {
      if (c.examMatrix?.updateExamSubject) {
        c.examMatrix.updateExamSubject(id, f, v);
      } else if (custom?.['updateExamSubject']) {
        custom['updateExamSubject'](id, f, v);
      }
    },
    saveExamSubjectConfig: (id: string) => c.examMatrix?.saveExamSubjectConfig?.(id),
    cancelExamSubjectConfig: (id: string) => c.examMatrix?.cancelExamSubjectConfig?.(id),

    // Today Tab
    startPlannedActivity: (p: any) => c.today?.startPlannedActivity?.(p),
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
