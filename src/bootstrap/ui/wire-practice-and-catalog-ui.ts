import {
  STATUS_OPTIONS,
  STATUS_CLASS,
  DIFFICULTY_OPTIONS,
  DIFFICULTY_CLASS,
} from '../../state/schema.js';
import { EXAM_TAGS } from '../../domain/exams/exam-constants.js';
import { isCommonTopic } from '../../domain/exams/exam-scope.js';
import { ERROR_CATEGORIES } from '../../domain/diagnostics/error-categories.js';
import { renderCollectionFooter, renderGroupHeader } from '../../ui/list-components.js';
import {
  matchesSubjectSearch,
  createSubjectSearchController,
} from '../../ui/subjects/subject-navigation.js';
import { needsMaintenance, prerequisiteBlockers } from '../../domain/study-eligibility.js';
import { createSubjectsTabController } from '../../ui/tabs/subjects/subjects-tab-controller.js';
import { createCalendarTabController } from '../../ui/tabs/calendar/calendar-tab-controller.js';
import { createReviewsTabController } from '../../ui/tabs/reviews/reviews-tab-controller.js';
import { createErrorNotebookController } from '../../ui/controllers/error-notebook-controller.js';
import { createQuestionsTabController } from '../../ui/tabs/questions/questions-tab-controller.js';
import { createQuestionAnalyticsController } from '../../ui/tabs/questions/question-analytics-controller.js';
import { createSimulationsTabController } from '../../ui/tabs/questions/simulations-tab-controller.js';

export function wirePracticeAndCatalogUi(deps: Record<string, any>) {
  const {
    document,
    window,
    getState,
    appClock,
    todayISO,
    nowISO,
    uid,
    escapeHtml,
    escapeAttr,
    pluralize,
    appSelectors,
    appContext,
    services,
    analytics,
    listViewState,
    LIST_VIEW_STEPS,
    isMobileHistoryLayout,
    renderListViewFooter,
    activeTabName,
    activateTab,
    persistAndRender,
    renderAll,
    showToast,
    showConfirm,
    showPrompt,
    startTimer,
    populateTimerContextControls,
    openStudyTimerFocus,
    openExamImport,
  } = deps;

  const {
    getSubjectById,
    getTopicById,
    getSubjectName,
    getTopicName,
    entitySubjectId,
    entitySubjectName,
    allTopics,
    activeSubjects,
    activeTopics,
    subjectsForSelection,
    topicsForSelection,
    diasParaRevisao,
    diasParaRevisaoPill,
    monthKey,
    monthLabel,
    collectMonthKeys,
    addDays,
    formatDatePt,
    localDateISO,
  } = appSelectors;
  const localDateFromTimestamp = (v: any) => localDateISO(v);
  const { studyMetricsSelectors, topicDiagnosisService } = analytics;

  let simulationsTabController: any;

  const subjectSearchController = createSubjectSearchController({
    document,
    onChange: () => {
      subjectsTabController.subjectTopicLimits.clear();
      subjectsTabController.renderSubjects();
    },
  });

  const subjectsTabController = createSubjectsTabController({
    document,
    window,
    get state() {
      return getState();
    },
    appContext,
    subjectService: services.subjectService,
    topicHistoryService: services.topicHistoryService,
    topicStrategyController: services.topicStrategyController,
    subjectSearchController,
    persistAndRender,
    renderAll,
    showToast,
    showPrompt,
    showConfirm,
    activeSubjects,
    allTopics,
    getTopicById,
    getSubjectById,
    getTopicName,
    isCommonTopic,
    matchesSubjectSearch,
    subjectProgress: studyMetricsSelectors.subjectProgress,
    pluralize,
    renderCollectionFooter,
    topicMasteryIndex: topicDiagnosisService.topicMasteryIndex,
    topicRetentionScore: topicDiagnosisService.topicRetentionScore,
    diagnoseTopic: topicDiagnosisService.diagnoseTopic,
    topicReviewHealthScore: topicDiagnosisService.topicReviewHealthScore,
    diasParaRevisao,
    localDateFromTimestamp,
    prerequisiteBlockers,
    needsMaintenance,
    evidenceScopeForTopic: studyMetricsSelectors.evidenceScopeForTopic,
    entitySubjectId,
    startTimer,
    populateTimerContextControls,
    openStudyTimerFocus,
    openExamImport,
    activeTabName,
    uid,
    nowISO,
    todayISO,
    escapeHtml,
    escapeAttr,
    EXAM_TAGS,
    STATUS_OPTIONS,
    STATUS_CLASS,
    DIFFICULTY_OPTIONS,
    DIFFICULTY_CLASS,
  });
  subjectsTabController.bindEvents();

  const reviewsTabController = createReviewsTabController({
    get state() {
      return getState();
    },
    reviewAgendaRepo: appContext.repositories.reviewAgenda,
    reviewService: services.reviewService,
    diagnoseTopic: topicDiagnosisService.diagnoseTopic,
    subjectAccuracyTarget: topicDiagnosisService.subjectAccuracyTarget,
    getTopicById,
    activeTopics,
    activeSubjects,
    subjectsForSelection,
    topicsForSelection,
    entitySubjectId,
    getSubjectName,
    getTopicName,
    formatDatePt,
    todayISO,
    nowISO,
    uid,
    addHistoryEvent: studyMetricsSelectors.addHistoryEvent,
    refreshTopicReviewStats: topicId => subjectsTabController.refreshTopicReviewStats(topicId),
    showToast,
    showConfirm,
    persistAndRender,
    monthKey: monthKey as (date?: string) => string,
    monthLabel,
    collectMonthKeys: collectMonthKeys as (items: any[]) => string[],
    diasParaRevisaoPill,
    renderGroupHeader,
    renderCollectionFooter,
    isMobileHistoryLayout,
    escapeHtml,
    escapeAttr,
    pluralize,
    document,
  });
  reviewsTabController.bindEvents();

  const calendarTabController = createCalendarTabController({
    get state() {
      return getState();
    },
    calendarService: services.calendarService,
    clock: appClock,
    formatDatePt,
    entitySubjectId,
    entitySubjectName,
    getSubjectName,
    getTopicName,
    diasParaRevisao,
    diasParaRevisaoPill,
    activeSubjects,
    subjectsForSelection,
    collectMonthKeys: collectMonthKeys as (items: any[]) => string[],
    monthLabel,
    monthKey: monthKey as (date?: string) => string,
    showToast,
    showConfirm,
    persistAndRender,
    onCompleteAgendaReview: (id: string) => reviewsTabController.completeAgendaReview(id),
    isMobileHistoryLayout,
    renderCollectionFooter,
    escapeHtml,
    escapeAttr,
    pluralize,
    document,
  });
  calendarTabController.bindEvents();
  calendarTabController.setCalendarMobileView('month');

  const errorNotebookController = createErrorNotebookController({
    getState,
    getMount: () => document.getElementById('errorNotebookMount'),
    getMainContainer: () => document.getElementById('questionsMainContainer'),
    getToggleBtn: () => document.getElementById('errorNotebookToggleBtn'),
    getDueAgendaMount: () => document.getElementById('errorNotebookDueAgenda'),
    getDueTodayMount: () => document.getElementById('errorNotebookDueToday'),
    todayISO,
    nowISO,
    persistAndRender,
    showToast,
    activateTab,
  });

  const questionAnalyticsController = createQuestionAnalyticsController({
    document,
    validQuestionRecords: studyMetricsSelectors.validQuestionRecords,
    entitySubjectId,
    activeSubjects,
    activeTopics,
    getSubjectWeeklyTrend: topicDiagnosisService.getSubjectWeeklyTrend,
    getSubjectTopicPerformance: topicDiagnosisService.getSubjectTopicPerformance,
    topicMasteryIndex: topicDiagnosisService.topicMasteryIndex,
    buildErrorProfile: topicDiagnosisService.buildErrorProfile,
    formatDatePt,
    escapeHtml,
    escapeAttr,
    addDays,
    todayISO,
  });

  const questionsTabController = createQuestionsTabController({
    document,
    window,
    get state() {
      return getState();
    },
    listViewState,
    LIST_VIEW_STEPS,
    questionService: services.questionService,
    errorCategories: ERROR_CATEGORIES,
    errorNotebookController,
    renderQuestionAnalytics: () => questionAnalyticsController.renderQuestionAnalytics(),
    simulationEditController: {
      get state() {
        return (
          simulationsTabController?.simulationEditController?.state || {
            editingId: null,
            draft: null,
          }
        );
      },
    },
    openBreakdownIds: new Set<string>(),
    persistAndRender,
    showToast,
    showConfirm,
    formatDatePt,
    getSubjectName,
    getTopicName,
    entitySubjectId,
    activeSubjects,
    subjectsForSelection,
    topicsForSelection: (sId?: string | null, tId?: string | null) =>
      topicsForSelection(sId || '', tId || null),
    renderListViewFooter,
    isMobileLayout: isMobileHistoryLayout,
    uid,
    todayISO,
    nowISO,
    escapeHtml,
    escapeAttr,
  });
  questionsTabController.bindEvents();

  simulationsTabController = createSimulationsTabController({
    document,
    window,
    get state() {
      return getState();
    },
    listViewState,
    LIST_VIEW_STEPS,
    simulationService: services.simulationService,
    questionEditController: questionsTabController.questionEditController,
    openQuestionErrorIds: questionsTabController.openQuestionErrorIds,
    errorCategories: ERROR_CATEGORIES,
    persistAndRender,
    showToast,
    showConfirm,
    formatDatePt,
    activeSubjects,
    subjectsForSelection,
    topicsForSelection: (sId?: string | null, tId?: string | null) =>
      topicsForSelection(sId || '', tId || null),
    renderListViewFooter,
    isMobileLayout: isMobileHistoryLayout,
    uid,
    todayISO,
    escapeHtml,
    escapeAttr,
  });
  simulationsTabController.bindEvents();

  return {
    subjectsTabController,
    calendarTabController,
    reviewsTabController,
    errorNotebookController,
    questionsTabController,
    questionAnalyticsController,
    simulationsTabController,
  };
}
