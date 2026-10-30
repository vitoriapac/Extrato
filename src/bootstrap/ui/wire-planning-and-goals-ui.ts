import { EXAM_TAGS, EXAM_SOURCES } from '../../domain/exams/exam-constants.js';
import { formatPlanMinutes } from '../../core/format-duration.js';
import { formatDecimal } from '../../core/format-number.js';
import { parseLocalDate } from '../../core/date-utils.js';
import { createGoalsTabController } from '../../ui/tabs/goals/goals-tab-controller.js';
import { createExamMatrixController } from '../../ui/tabs/goals/exam-matrix-controller.js';
import { createSubjectTargetEditorController } from '../../ui/tabs/goals/subject-target-editor-controller.js';
import { createStudyPlanBuilderController } from '../../ui/tabs/goals/study-plan-builder-controller.js';
import { createWeeklyCloseModalController } from '../../features/weekly-close/weekly-close-modal-controller.js';

export function wirePlanningAndGoalsUi(deps: Record<string, any>) {
  const {
    document,
    window,
    getState,
    todayISO,
    nowISO,
    uid,
    escapeHtml,
    escapeAttr,
    pluralize,
    appSelectors,
    services,
    analytics,
    scheduleSave,
    render,
    persistAndRender,
    showToast,
    showConfirm,
    resetRecordListLimits,
    renderPlanoHoje,
    renderApprovalDashboard,
    analysisContextBanner,
  } = deps;

  const {
    getTopicById,
    getSubjectName,
    getTopicName,
    entitySubjectId,
    allTopics,
    activeSubjects,
    activeTopics,
    diasParaRevisao,
    startOfWeek,
    isSameWeek,
    isSameMonth,
    addDays,
    formatDatePt,
    localDateISO,
  } = appSelectors;
  const localDateFromTimestamp = (v: any) => localDateISO(v);

  const {
    studyMetricsSelectors,
    studyCandidateService,
    approvalReadinessService,
    goalsBlueprintService,
    currentAchievementProjection,
    recoveryController,
  } = analytics;

  let studyPlanBuilderController: ReturnType<typeof createStudyPlanBuilderController>;
  let weeklyCloseModalController: ReturnType<typeof createWeeklyCloseModalController>;

  function feedbackRecoveryResult(result: Record<string, any>) {
    if (result.status === 'rejected') {
      showToast(result.reason);
      return false;
    }
    studyPlanBuilderController.invalidatePreviews();
    render('desempenho');
    weeklyCloseModalController.renderStudyTrack32Insights();
    studyPlanBuilderController.renderStudyPlanBuilder();
    renderApprovalDashboard();
    showToast(
      result.status === 'applied'
        ? 'Plano de recuperação confirmado. A carga semanal foi preservada.'
        : 'A redistribuição foi revertida em uma nova versão do plano semanal. Atividades realizadas foram preservadas.'
    );
    return true;
  }

  const goalsTabController = createGoalsTabController({
    getState,
    document,
    parseLocalDate,
    todayISO,
    formatPlanMinutes,
    formatDecimal,
    metaHoursToday: goalsBlueprintService.metaHoursToday,
    metaHoursForDate: goalsBlueprintService.metaHoursForDate,
    addDays,
    startOfWeek,
    isSameWeek,
    isSameMonth,
    examScopedTopics: studyMetricsSelectors.examScopedTopics,
    formatDatePt,
    escapeHtml,
    escapeAttr,
    entitySubjectId,
    weeklyStrategyCapacity: studyMetricsSelectors.weeklyStrategyCapacity,
    activeSubjects,
    getSubjectName,
    localDateFromTimestamp,
    somarQuestoesDisciplinaNaSemana: (subjectId: string | null) =>
      subjectId ? studyMetricsSelectors.somarQuestoesDisciplinaNaSemana(subjectId) : 0,
    contarTopicosConcluidosNoPeriodo: studyMetricsSelectors.contarTopicosConcluidosNoPeriodo,
    somarQuestoesNaSemana: studyMetricsSelectors.somarQuestoesNaSemana,
    contarSimuladosNaSemana: studyMetricsSelectors.contarSimuladosNaSemana,
    recentPerformance: approvalReadinessService.recentPerformance,
    computeWeeklyHistory: studyMetricsSelectors.computeWeeklyHistory,
    addMetaDisciplina: goalsBlueprintService.addMetaDisciplina,
    computeRitmo: studyCandidateService.computeRitmo,
  });
  goalsTabController.bindEvents();

  const examMatrixController = createExamMatrixController({
    document,
    window,
    getState,
    examEvidenceContext: studyMetricsSelectors.examEvidenceContext,
    intelligenceCandidates: studyCandidateService.intelligenceCandidates,
    examScopedTopics: studyMetricsSelectors.examScopedTopics,
    activeTopics,
    activeSubjects,
    currentAchievementProjection: () => currentAchievementProjection(),
    nowISO,
    idGenerator: uid,
    escapeHtml,
    escapeAttr,
    formatDatePt,
    showToast,
    persistAndRender,
    captureReadinessBeforeStrategy: approvalReadinessService.captureReadinessBeforeStrategy,
    invalidatePlanPreview: () => studyPlanBuilderController.clearStudyPlanPreviewState(),
    resetRecordListLimits,
    updateExamBlueprint: (field, val) =>
      goalsBlueprintService.updateExamBlueprint(field as any, val),
    getProgressiveLists: () => (globalThis as Record<string, any>).studytrackProgressiveLists,
    EXAM_TAGS,
    EXAM_SOURCES,
  });
  examMatrixController.bindEvents();

  const subjectTargetEditorController = createSubjectTargetEditorController({
    document,
    getState,
    examEvidenceContext: studyMetricsSelectors.examEvidenceContext,
    examScopedSubjects: studyMetricsSelectors.examScopedSubjects,
    entitySubjectId,
    todayISO,
    nowISO,
    escapeHtml,
    escapeAttr,
    showToast,
    persistAndRender,
    captureReadinessBeforeStrategy: approvalReadinessService.captureReadinessBeforeStrategy,
    invalidatePlanPreview: () => studyPlanBuilderController.clearStudyPlanPreviewState(),
  });
  subjectTargetEditorController.bindEvents();

  studyPlanBuilderController = createStudyPlanBuilderController({
    document,
    window,
    getState,
    studyPlanService: services.studyPlanService,
    dailyPlanService: services.dailyPlanService,
    recoveryController,
    intelligenceCandidates: studyCandidateService.intelligenceCandidates,
    getTopicById,
    getTopicName,
    getSubjectName,
    todayISO,
    nowISO,
    addDays,
    diasParaRevisao,
    formatDatePt,
    formatPlanMinutes,
    pluralize,
    escapeHtml,
    escapeAttr,
    metaHoursForDate: goalsBlueprintService.metaHoursForDate,
    uid,
    showToast,
    scheduleSave,
    renderPlanoHoje,
    captureReadinessBeforeStrategy: approvalReadinessService.captureReadinessBeforeStrategy,
    readinessResult: approvalReadinessService.readinessResult,
    computeApprovalMetrics: approvalReadinessService.computeApprovalMetrics,
    currentAchievementProjection,
    examEvidenceContext: studyMetricsSelectors.examEvidenceContext,
    analysisContextBanner,
    feedbackRecoveryResult,
  });

  weeklyCloseModalController = createWeeklyCloseModalController({
    document,
    window,
    getState,
    planningRepository: services.planningRepository,
    examEvidenceContext: studyMetricsSelectors.examEvidenceContext,
    intelligenceCandidates: studyCandidateService.intelligenceCandidates,
    getSubjectName,
    getTopicName,
    todayISO,
    nowISO,
    addDays,
    diasParaRevisao,
    formatPlanMinutes,
    escapeHtml,
    escapeAttr,
    uid,
    showToast,
    showConfirm,
    scheduleSave,
    renderApprovalDashboard,
    renderPlanoHoje,
    saveCurrentReadinessSnapshot: approvalReadinessService.saveCurrentReadinessSnapshot,
    captureReadinessBeforeStrategy: approvalReadinessService.captureReadinessBeforeStrategy,
    readinessResult: approvalReadinessService.readinessResult,
    computeApprovalMetrics: approvalReadinessService.computeApprovalMetrics,
    currentAchievementProjection,
    examScopedSimulations: studyMetricsSelectors.examScopedSimulations,
    allTopics,
  });

  return {
    goalsTabController,
    examMatrixController,
    subjectTargetEditorController,
    studyPlanBuilderController,
    weeklyCloseModalController,
    feedbackRecoveryResult,
  };
}
