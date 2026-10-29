/**
 * Controlador de renderização e estado visual da aba Aprovação / Prontidão.
 *
 * Gerencia a montagem do painel de prontidão (Readiness Overview),
 * histórico de prontidão, retenção e saúde de tópicos, calibração de recomendações
 * e ciclo de auditoria de desfechos.
 *
 * Camada: UI Controller.
 */

import { classifyApprovalScore as defaultClassifyApprovalScore } from '../../../domain/analytics/approval-metrics.js';
import { renderReadinessOverview as defaultRenderReadinessOverview } from '../../renderers/readiness-overview-renderer.js';
import { renderReadinessHistory as defaultRenderReadinessHistory } from '../../renderers/readiness-history-renderer.js';
import { renderTopicRetentionDashboard as defaultRenderTopicRetentionDashboardView } from '../../renderers/retention-renderer.js';
import {
  captureProjection as defaultCaptureProjection,
  buildProjectionCalibration as defaultBuildProjectionCalibration,
} from '../../../application/analytics/projection-calibration-history.js';
import { captureAchievementProjection as defaultCaptureAchievementProjection } from '../../../application/projection/index.js';
import { buildRecommendationCalibration as defaultBuildRecommendationCalibration } from '../../../domain/analytics/recommendation-calibration.js';
import { renderRecommendationCalibrationModel as defaultRenderRecommendationCalibrationModel } from '../../renderers/recommendation-calibration-renderer.js';
import { buildRecommendationOutcomeAudit as defaultBuildRecommendationOutcomeAudit } from '../../../application/recommendations/build-recommendation-outcome-audit.js';
import { renderRecommendationOutcomeAudit as defaultRenderRecommendationOutcomeAudit } from '../../renderers/recommendation-outcome-audit-renderer.js';
import { buildRecommendationFollowup as defaultBuildRecommendationFollowup } from '../../../application/recommendations/build-recommendation-followup.js';
import { renderRecommendationFollowup as defaultRenderRecommendationFollowup } from '../../renderers/recommendation-followup-renderer.js';
import { summarizeRecommendationHistory as defaultSummarizeRecommendationHistory } from '../../../application/recommendations/recommendation-history.js';
import { renderRecommendationHistory as defaultRenderRecommendationHistory } from '../../renderers/recommendation-history-renderer.js';
import { renderCollectionFooter as defaultRenderCollectionFooter } from '../../list-components.js';

export interface ApprovalTabControllerOptions {
  document: Document | any;
  getState: () => any;
  todayISO: () => string;
  nowISO: () => string;
  uid: (prefix: string) => string;
  escapeHtml: (text: string) => string;
  escapeAttr: (text: string) => string;
  formatDatePt: (date: string) => string;
  formatPlanMinutes?: (mins: number) => string;
  scheduleSave: () => void;
  computeApprovalMetrics: () => any;
  readinessResult: (metrics: any) => any;
  classifyApprovalScore?: (score: number) => any;
  projectPerformance: () => any;
  examScopedSimulations: () => any[];
  simuladoEffectiveCounts: (sim: any) => any;
  entitySubjectId: (item: any) => string | null;
  currentAchievementProjection: (m?: any, r?: any) => any;
  intelligenceCandidates: () => any[];
  activeTopics: () => any[];
  activeSubjects: () => any[];
  allTopics: () => any[];
  renderCollectionFooter?: (opts: any) => string;
  renderReadinessOverview?: (model: any, opts: any) => string;
  renderReadinessHistory?: (snapshots: any[], opts: any) => string;
  renderTopicRetentionDashboardView?: (opts: any) => string;
  captureProjection?: (opts: any) => boolean;
  captureAchievementProjection?: (opts: any) => boolean;
  buildProjectionCalibration?: (opts: any) => any;
  getMetricDataState: (metric: any) => string;
  metricStateLabel: (metric: any, minimumConfidence?: number) => string;
  gerarDiagnosticoAprovacao: (metrics: any) => string[];
  buildRecommendationCalibration?: (feedback: any[], opts: any) => any;
  renderRecommendationCalibrationModel?: (model: any, opts: any) => string;
  buildRecommendationOutcomeAudit?: (feedback: any[]) => any;
  renderRecommendationOutcomeAudit?: (model: any, opts: any) => string;
  buildRecommendationFollowup?: (opts: any) => any;
  renderRecommendationFollowup?: (model: any) => string;
  summarizeRecommendationHistory?: (history: any[], opts: any) => any;
  renderRecommendationHistory?: (summary: any) => string;
  topicRetentionScore: (subjectId: string, topicId: string) => any;
  topicReviewHealthScore: (topic: any, mastery: any, retention: any) => any;
  topicMasteryIndex: (subjectId: string, topicId: string) => any;
  onRenderStudyTrack32Insights?: () => void;
  getRetentionView?: () => any;
  isRetentionShowAll?: () => boolean;
}

export function createApprovalTabController(opts: ApprovalTabControllerOptions) {
  let internalRetentionShowAll = false;
  const internalRetentionView: Record<string, any> = {
    subjectId: '',
    order: 'asc',
    confidence: 'all',
  };

  const {
    document,
    getState,
    todayISO,
    nowISO,
    uid,
    escapeHtml,
    escapeAttr,
    formatDatePt,
    scheduleSave,
    computeApprovalMetrics,
    readinessResult,
    classifyApprovalScore = defaultClassifyApprovalScore,
    projectPerformance,
    examScopedSimulations,
    simuladoEffectiveCounts,
    entitySubjectId,
    currentAchievementProjection,
    intelligenceCandidates,
    activeTopics,
    activeSubjects,
    allTopics,
    renderCollectionFooter = defaultRenderCollectionFooter,
    renderReadinessOverview = defaultRenderReadinessOverview,
    renderReadinessHistory = defaultRenderReadinessHistory,
    renderTopicRetentionDashboardView = defaultRenderTopicRetentionDashboardView,
    captureProjection = defaultCaptureProjection,
    captureAchievementProjection = defaultCaptureAchievementProjection,
    buildProjectionCalibration = defaultBuildProjectionCalibration,
    getMetricDataState,
    metricStateLabel,
    gerarDiagnosticoAprovacao,
    buildRecommendationCalibration = defaultBuildRecommendationCalibration,
    renderRecommendationCalibrationModel = defaultRenderRecommendationCalibrationModel,
    buildRecommendationOutcomeAudit = defaultBuildRecommendationOutcomeAudit,
    renderRecommendationOutcomeAudit = defaultRenderRecommendationOutcomeAudit,
    buildRecommendationFollowup = defaultBuildRecommendationFollowup,
    renderRecommendationFollowup = defaultRenderRecommendationFollowup,
    summarizeRecommendationHistory = defaultSummarizeRecommendationHistory,
    renderRecommendationHistory = defaultRenderRecommendationHistory,
    topicRetentionScore,
    topicReviewHealthScore,
    topicMasteryIndex,
    onRenderStudyTrack32Insights,
  } = opts;
  const getRetentionView = opts.getRetentionView || (() => internalRetentionView);
  const isRetentionShowAll = opts.isRetentionShowAll || (() => internalRetentionShowAll);

  function renderApprovalDashboard(): void {
    const el = document.getElementById('approvalDashboard');
    if (!el) return;
    const state = getState();
    const m = computeApprovalMetrics(),
      readiness = readinessResult(m),
      score = readiness.value ?? 0,
      level = classifyApprovalScore(score),
      confidence = { value: readiness.confidence, nivel: readiness.confidenceLabel },
      projection = projectPerformance();
    const projectionInputs = examScopedSimulations().map((item: any) => ({
      ...item,
      ...simuladoEffectiveCounts(item),
      breakdown: (item.breakdown || []).map((row: any) => ({ ...row, subjectId: entitySubjectId(row) })),
    }));
    if (
      captureProjection({
        snapshots: state.projectionSnapshots,
        model: projection.calibration,
        simulations: projectionInputs,
        date: todayISO(),
        issuedAt: nowISO(),
        id: uid('projection'),
        activeExamTags: state.examBlueprint?.activeExamTags || [],
      })
    ) {
      scheduleSave();
    }
    const achievement = currentAchievementProjection(m, readiness);
    if (
      captureAchievementProjection({
        snapshots: state.projectionSnapshots,
        ...achievement,
        date: todayISO(),
        issuedAt: nowISO(),
        id: uid('achievement-projection'),
        activeExamTags: state.examBlueprint?.activeExamTags || [],
      })
    ) {
      scheduleSave();
    }
    const projectionHistory = buildProjectionCalibration({
      snapshots: state.projectionSnapshots,
      simulations: projectionInputs,
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      today: todayISO(),
    });
    const factors = [
      ['Cobertura · 30%', m.edital, 'coverage'],
      ['Domínio · 25%', m.dominio, 'mastery'],
      ['Retenção · 20%', m.retencao, 'retention'],
      ['Consistência · 15%', m.consistencia, 'consistency'],
      ['Simulados · 10%', m.simulados, 'simulations'],
    ];
    const approvalState =
      readiness.state === 'empty'
        ? 'empty'
        : readiness.state === 'insufficient' || confidence.value < 0.35
          ? 'insufficient'
          : 'ready';
    const approvalLabel =
      approvalState === 'empty'
        ? 'Aguardando dados'
        : approvalState === 'insufficient'
          ? 'Estimativa inicial'
          : 'Estimativa calculada';
    el.innerHTML = renderReadinessOverview(
      {
        m,
        score,
        level,
        confidence,
        projection,
        projectionHistory,
        factors,
        approvalState,
        approvalLabel,
        diagnostics: gerarDiagnosticoAprovacao(m),
        candidates: intelligenceCandidates(),
      },
      { escapeHtml, escapeAttr, getMetricDataState, metricStateLabel }
    );
    renderTopicRetentionDashboard();
    const readinessHistory = document.getElementById('readinessHistoryDashboard');
    if (readinessHistory) {
      readinessHistory.innerHTML = renderReadinessHistory(state.readinessSnapshots, {
        formatDate: formatDatePt,
        escapeHtml,
        current: readiness,
        today: todayISO(),
        activeExamTags: state.examBlueprint?.activeExamTags || [],
      });
    }
    renderRecommendationCalibration();
    onRenderStudyTrack32Insights?.();
  }

  function renderTopicRetentionDashboard(): void {
    const el = document.getElementById('topicRetentionDashboard');
    if (!el) return;
    const retentionView = getRetentionView();
    const retentionShowAll = isRetentionShowAll();
    const baseRows = activeTopics().map(t => {
      const r = topicRetentionScore(t.subjectId, t.id);
      return { ...t, r, h: topicReviewHealthScore(t, topicMasteryIndex(t.subjectId, t.id), r) };
    });
    const confidenceMatch = (row: Record<string, any>) =>
      retentionView.confidence === 'all' ||
      row.r.confidenceLabel.toLowerCase() === retentionView.confidence;
    const rows = baseRows
      .filter(
        row =>
          (!retentionView.subjectId || row.subjectId === retentionView.subjectId) &&
          confidenceMatch(row)
      )
      .sort((a, b) => {
        const av = a.r.available ? (a.r as { value?: number }).value : null,
          bv = b.r.available ? (b.r as { value?: number }).value : null;
        if (av == null || bv == null)
          return av == null && bv == null ? a.name.localeCompare(b.name) : av == null ? 1 : -1;
        const score = retentionView.order === 'desc' ? bv - av : av - bv;
        return (
          score ||
          a.r.confidence - b.r.confidence ||
          a.subjectName.localeCompare(b.subjectName) ||
          a.name.localeCompare(b.name)
        );
      });
    el.innerHTML = renderTopicRetentionDashboardView({
      rows,
      subjects: activeSubjects(),
      filters: retentionView,
      showAll: retentionShowAll,
      renderFooter: renderCollectionFooter,
      escapeHtml,
      escapeAttr,
    });
  }

  function renderRecommendationCalibration(): void {
    const el = document.getElementById('recommendationCalibration');
    if (!el) return;
    const state = getState();
    const subjectNames = Object.fromEntries(state.subjects.map((item: any) => [item.id, item.name]));
    const topicNames = Object.fromEntries(
      state.subjects.flatMap((subject: any) => (subject.topics || []).map((topic: any) => [topic.id, topic.name]))
    );
    const model = buildRecommendationCalibration(state.recommendationFeedback, {
      minimumSample: 5,
      subjectNames,
      topicNames,
    });
    el.innerHTML = renderRecommendationCalibrationModel(model, { escapeHtml });
    const audit = document.getElementById('recommendationOutcomeAudit');
    if (audit) {
      audit.innerHTML =
        renderRecommendationOutcomeAudit(
          buildRecommendationOutcomeAudit(state.recommendationFeedback),
          { escapeHtml }
        ) +
        renderRecommendationFollowup(
          buildRecommendationFollowup({
            feedback: state.recommendationFeedback,
            sessions: state.studySessions,
            topics: allTopics(),
            activeExamTags: state.examBlueprint?.activeExamTags || [],
            today: todayISO(),
          })
        );
    }
    renderRecommendationHistorySummary();
  }

  function renderRecommendationHistorySummary(): void {
    const history = document.getElementById('recommendationHistorySummary');
    if (history) {
      const state = getState();
      history.innerHTML = renderRecommendationHistory(
        summarizeRecommendationHistory(state.recommendationHistory, { today: todayISO() })
      );
    }
  }

  function showAllRetention(): void {
    internalRetentionShowAll = true;
    renderTopicRetentionDashboard();
  }

  function resetRetentionLimit(): void {
    internalRetentionShowAll = false;
    renderTopicRetentionDashboard();
  }

  function resetRetentionLimitDefault(): void {
    internalRetentionShowAll = false;
  }

  function setRetentionFilter(field: string, value: any): void {
    const view = getRetentionView();
    if (field in view) view[field] = value;
    internalRetentionShowAll = false;
    renderTopicRetentionDashboard();
  }

  return {
    renderApprovalDashboard,
    renderTopicRetentionDashboard,
    renderRecommendationCalibration,
    renderRecommendationHistorySummary,
    showAllRetention,
    resetRetentionLimit,
    resetRetentionLimitDefault,
    setRetentionFilter,
  };
}
