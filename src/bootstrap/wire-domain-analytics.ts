import { STORAGE_KEY } from '../state/schema.js';
import { pickPersistentState } from '../state/state-boundaries.js';
import { normalizeErrorBreakdown as defaultNormalizeErrorBreakdown } from '../domain/diagnostics/error-categories.js';
import { createStudyMetricsSelectors } from '../application/selectors/study-metrics-selectors.js';
import { createTopicDiagnosisService } from '../application/diagnostics/topic-diagnosis-service.js';
import { createStudyCandidateService } from '../application/recommendations/study-candidate-service.js';
import { createApprovalReadinessService } from '../application/analytics/approval-readiness-service.js';
import { createGoalsBlueprintService } from '../application/goals/goals-blueprint-service.js';
import { createProjectionController } from '../ui/controllers/projection-controller.js';
import { createRecoveryController } from '../ui/controllers/recovery-controller.js';
import { createRecoveryStateCommitter } from '../application/recovery/recovery-state-committer.js';
import { countStudyDaysThisWeek } from '../application/performance/study-day-count.js';

export interface WireDomainAnalyticsDeps {
  getState: () => any;
  appClock: any;
  todayISO: () => string;
  nowISO: () => string;
  uid: (prefix?: string) => string;
  isDemoMode: boolean;
  appSelectors: any;
  goalsService: any;
  subjectGoalService: any;
  topicHistoryService: any;
  storageManager: any;
  stateSyncCoordinator: any;
  scheduleSave: () => void;
  enqueueStateTransaction: (task: () => any) => Promise<any>;
  persistAndRender: () => void;
  flashSaved: () => void;
  showToast: (message: string) => void;
  getLatestStudyPlan: () => any;
  invalidatePlanPreviews: () => void;
  isRendering: () => boolean;
}

export function wireDomainAnalytics(deps: WireDomainAnalyticsDeps) {
  const {
    addDays,
    isSameWeek,
    isSameMonth,
    startOfWeek,
    diasParaRevisao,
    getTopicById,
    getSubjectName,
    getTopicName,
    entitySubjectId,
    entitySubjectName,
    allTopics,
    activeTopics,
    activeSubjects,
    isActiveStudyReference,
    localDateISO,
  } = deps.appSelectors;
  const localDateFromTimestamp = (v: any) => localDateISO(v);

  let goalsBlueprintService: ReturnType<typeof createGoalsBlueprintService>;

  const studyMetricsSelectors = createStudyMetricsSelectors({
    getState: deps.getState,
    todayISO: deps.todayISO,
    addDays,
    isSameWeek,
    isSameMonth,
    startOfWeek,
    localDateFromTimestamp,
    getTopicById,
    getSubjectName,
    getTopicName,
    entitySubjectId,
    entitySubjectName,
    activeTopics,
    activeSubjects,
    metaHoursForDate: (date?: string) => goalsBlueprintService.metaHoursForDate(date),
    topicHistoryService: deps.topicHistoryService,
  });

  const topicDiagnosisService = createTopicDiagnosisService({
    getState: deps.getState,
    todayISO: deps.todayISO,
    addDays,
    startOfWeek,
    diasParaRevisao,
    localDateFromTimestamp,
    getTopicById,
    entitySubjectId,
    validQuestionRecords: studyMetricsSelectors.validQuestionRecords,
    normalizeErrorBreakdown: q => defaultNormalizeErrorBreakdown(q),
    studyTimeByTopic: studyMetricsSelectors.studyTimeByTopic,
    topicHistoryService: deps.topicHistoryService,
  });

  const studyCandidateService = createStudyCandidateService({
    getState: deps.getState,
    todayISO: deps.todayISO,
    addDays,
    startOfWeek,
    diasParaRevisao,
    getTopicById,
    getTopicName,
    entitySubjectId,
    entitySubjectName,
    allTopics,
    activeTopics,
    activeSubjects,
    isActiveStudyReference,
    topicInActiveExamScope: studyMetricsSelectors.topicInActiveExamScope,
    examScopedTopics: studyMetricsSelectors.examScopedTopics,
    examScopedRecords: studyMetricsSelectors.examScopedRecords,
    examEvidenceContext: studyMetricsSelectors.examEvidenceContext,
    diagnoseTopic: topicDiagnosisService.diagnoseTopic,
    getTopicDifficulty: studyMetricsSelectors.getTopicDifficulty,
    taxaErroDisciplina: topicDiagnosisService.taxaErroDisciplina,
    diasSemEstudarDisciplina: topicDiagnosisService.diasSemEstudarDisciplina,
    subjectAccuracyTarget: topicDiagnosisService.subjectAccuracyTarget,
    topicRetentionScore: topicDiagnosisService.topicRetentionScore,
    topicMasteryIndex: topicDiagnosisService.topicMasteryIndex,
    topicReviewHealthScore: topicDiagnosisService.topicReviewHealthScore,
    getSubjectWeeklyTrend: topicDiagnosisService.getSubjectWeeklyTrend,
    metaHoursToday: () => goalsBlueprintService.metaHoursToday(),
    uniqueTopicsCompletedBetween: studyMetricsSelectors.uniqueTopicsCompletedBetween,
    getRevisoesUnificadas: studyMetricsSelectors.getRevisoesUnificadas,
    isRendering: deps.isRendering,
  });

  const approvalReadinessService = createApprovalReadinessService({
    getState: deps.getState,
    todayISO: deps.todayISO,
    nowISO: deps.nowISO,
    uid: deps.uid,
    addDays,
    diasParaRevisao,
    entitySubjectId,
    activeSubjects,
    examScopedTopics: studyMetricsSelectors.examScopedTopics,
    examScopedRecords: studyMetricsSelectors.examScopedRecords,
    examScopedSimulations: studyMetricsSelectors.examScopedSimulations,
    examEvidenceContext: studyMetricsSelectors.examEvidenceContext,
    simuladoEffectiveCounts: studyMetricsSelectors.simuladoEffectiveCounts,
    simuladoNota: studyMetricsSelectors.simuladoNota,
    getRevisoesUnificadas: studyMetricsSelectors.getRevisoesUnificadas,
    computeRitmo: studyCandidateService.computeRitmo,
    topicMasteryIndex: topicDiagnosisService.topicMasteryIndex,
    topicRetentionScore: topicDiagnosisService.topicRetentionScore,
    subjectProgress: studyMetricsSelectors.subjectProgress,
    ultimaAtividadeDisciplina: topicDiagnosisService.ultimaAtividadeDisciplina,
    studySecondsByDate: studyMetricsSelectors.studySecondsByDate,
    metaHoursForDate: date => goalsBlueprintService.metaHoursForDate(date),
    performanceScopedPlans: studyMetricsSelectors.performanceScopedPlans,
  });

  goalsBlueprintService = createGoalsBlueprintService({
    getState: deps.getState,
    todayISO: deps.todayISO,
    nowISO: deps.nowISO,
    diasParaRevisao,
    entitySubjectId,
    goalsService: deps.goalsService,
    subjectGoalService: deps.subjectGoalService,
    captureReadinessBeforeStrategy: approvalReadinessService.captureReadinessBeforeStrategy,
    invalidatePlanPreview: deps.invalidatePlanPreviews,
    persistAndRender: deps.persistAndRender,
    scheduleSave: deps.scheduleSave,
    showToast: deps.showToast,
  });

  const projectionController = createProjectionController({
    getExecutionContext: () => {
      const state = deps.getState();
      return {
        dailyPlans: state.dailyPlans,
        sessions: state.studySessions,
        subjects: state.subjects,
        capacityHistory: state.planningCapacityHistory,
        adherenceTarget: state.metas.aderenciaSemanal,
      };
    },
    getContext: (
      metrics = approvalReadinessService.computeApprovalMetrics(),
      readiness = approvalReadinessService.readinessResult(metrics)
    ) => {
      const state = deps.getState();
      return {
        today: deps.todayISO(),
        scope: studyMetricsSelectors.examEvidenceContext(),
        metrics,
        readiness,
        examDate: state.examDate || null,
        targetScore: state.examBlueprint?.configuredAt
          ? state.examBlueprint.targetScore
          : state.metas.metaAprovacao,
        consistencyTarget: state.metas.consistenciaSemanal,
        snapshots: state.projectionSnapshots,
        activeExamTags: state.examBlueprint.activeExamTags || [],
      };
    },
    buildRecent: approvalReadinessService.recentPerformance,
    getSimulations: () =>
      studyMetricsSelectors.examScopedSimulations().map(item => ({
        ...item,
        ...studyMetricsSelectors.simuladoEffectiveCounts(item),
        breakdown: (item.breakdown || []).map((row: any) => ({
          ...row,
          subjectId: entitySubjectId(row),
        })),
      })),
    countStudyDays: countStudyDaysThisWeek,
    getCandidates: studyCandidateService.intelligenceCandidates,
    getPlan: deps.getLatestStudyPlan,
    getCapacity: studyMetricsSelectors.weeklyStrategyCapacity,
    getAdaptiveHistory: () => deps.getState().adaptivePlanningHistory,
  });

  const currentAchievementProjection = (
    metrics = approvalReadinessService.computeApprovalMetrics(),
    readiness = approvalReadinessService.readinessResult(metrics),
    candidates: any[] | null = null
  ) => projectionController.current(metrics, readiness, candidates);

  const recoveryController = createRecoveryController({
    getState: deps.getState,
    getPlan: deps.getLatestStudyPlan,
    getActiveExamTags: () => deps.getState().examBlueprint.activeExamTags || [],
    getPreview: (trajectory: Record<string, any> | null) => projectionController.recovery(trajectory),
    isDisabled: () => deps.isDemoMode,
    services: {
      clock: deps.appClock,
      idGenerator: deps.uid,
      buildReadinessSnapshot: (_before: unknown, timestamp: string, reason: string) =>
        approvalReadinessService.buildReadinessBeforeStrategySnapshot(reason, timestamp),
      commitState: createRecoveryStateCommitter({
        getState: deps.getState,
        publish: (value: any) => {
          Object.assign(deps.getState(), value);
        },
        persist: async (serialized: string) =>
          !deps.stateSyncCoordinator.isPersistenceBlocked() &&
          deps.storageManager.set(STORAGE_KEY, serialized),
        runExclusive: deps.enqueueStateTransaction,
        clock: deps.appClock,
        onCommitted: (value: any) => {
          deps.flashSaved();
          deps.stateSyncCoordinator.notifyRemoteState(
            JSON.stringify(pickPersistentState(value)),
            value.updatedAt
          );
        },
      }),
    },
  });

  return {
    studyMetricsSelectors,
    topicDiagnosisService,
    studyCandidateService,
    approvalReadinessService,
    goalsBlueprintService,
    projectionController,
    currentAchievementProjection,
    recoveryController,
  };
}
