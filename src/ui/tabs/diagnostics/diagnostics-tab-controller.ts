import { buildExecutiveSummary as defaultBuildExecutiveSummary } from '../../../application/build-executive-summary.js';
import {
  renderExecutiveSummary as defaultRenderExecutiveSummaryView,
  renderIntelligentAlerts as defaultRenderIntelligentAlerts,
} from '../../renderers/overview-renderer.js';
import {
  reconcileAlerts as defaultReconcileAlerts,
  dismissAlert as defaultDismissAlert,
} from '../../../application/alert-lifecycle.js';
import { buildDiagnosisPageModel as defaultBuildDiagnosisPageModel } from '../../../application/diagnostics/build-diagnosis-page-model.js';
import { renderDiagnosisCenter as defaultRenderDiagnosisCenterView } from '../../renderers/diagnosis-renderer.js';
import { renderRecoveryReviewDebt as defaultRenderRecoveryReviewDebt } from '../../renderers/recovery-review-debt-renderer.js';
import { analyzeFocusAndEnergy as defaultAnalyzeFocusAndEnergy } from '../../../domain/analytics/focus-energy-analytics.js';
import { renderNextBestAction as defaultRenderNextBestAction } from '../../renderers/next-best-action-renderer.js';
import { renderPreparationSignals as defaultRenderPreparationSignals } from '../../renderers/preparation-signals-renderer.js';
import { buildDecisionCoherenceReport as defaultBuildDecisionCoherenceReport } from '../../../application/diagnostics/build-decision-coherence-report.js';
import { renderDecisionCoherenceDebug as defaultRenderDecisionCoherenceDebug } from '../../renderers/decision-coherence-debug-renderer.js';
import {
  buildStudyAction as defaultBuildStudyAction,
  recommendationActionLabel as defaultRecommendationActionLabel,
} from '../../../application/recommendations/recommendation-action.js';

export interface DiagnosticsTabControllerOptions {
  document: any;
  getState: () => any;
  scheduleSave: () => void;
  todayISO: () => string;
  addDays: (iso: string, days: number) => string;
  startOfWeek: (iso: string) => string;
  formatPlanMinutes: (mins: number) => string;
  escapeHtml: (s: string) => string;
  escapeAttr: (s: string) => string;
  pluralize: (count: number, singular: string, plural?: string) => string;
  diasParaRevisao: (dateStr: string) => number | null;
  computeAlertasInteligentes: () => Array<any>;
  computeApprovalMetrics: () => any;
  readinessResult: (metrics: any) => any;
  computeRitmo: () => any;
  computeStudyPriorities: () => Array<any>;
  motivoPrioridade: (priority: any) => string;
  examScopedTopics: () => Array<any>;
  examScopedSubjects: () => Array<any>;
  uniqueTopicsCompletedBetween: (start: string, end: string) => number;
  buildExecutiveSummary?: (opts: any) => any;
  renderExecutiveSummaryView?: (opts: any) => string;
  reconcileAlerts?: (alerts: any[], states: any, today: string) => any;
  renderIntelligentAlerts?: (opts: any) => { list: string; overview: string };
  dismissAlert?: (states: any, id: string, today: string, addDays: any, days: number) => any;
  refreshStudyRecommendationItems: () => { candidates: any[] };
  examEvidenceContext: () => any;
  getStudyPlanPreview: () => any;
  currentAchievementProjection: (target?: any, date?: any, candidates?: any) => { model: any };
  buildDiagnosisPageModel?: (opts: any) => any;
  renderDiagnosisCenterView?: (opts: any) => string;
  renderRecoveryReviewDebt?: (opts: any, viewOpts: any) => string;
  analyzeFocusAndEnergy?: (sessions: any[]) => any;
  analysisContextBanner: (context: string) => string;
  renderNextBestAction?: (action: any, opts: any) => string;
  getDailyPriority: (action: any) => any;
  renderPreparationSignals?: (signals: any) => string;
  buildDecisionCoherenceReport?: (opts: any) => any;
  renderDecisionCoherenceDebug?: (report: any, opts: any) => string;
  buildStudyAction?: (recommendation: any, opts: any) => any;
  recommendationActionLabel?: (action: any) => string;
  getCurrentStudyRecommendations: () => any[];
  setCurrentConsolidatedDiagnosis?: (diag: any) => void;
  latestStudyPlan: () => any;
  weeklyStrategyCapacity: () => number;
  locationSearch?: () => string;
}

export function createDiagnosticsTabController(opts: DiagnosticsTabControllerOptions) {
  let currentConsolidatedDiagnosis: any = null;
  const reconcileAlerts = opts.reconcileAlerts || defaultReconcileAlerts;
  const renderIntelligentAlerts = opts.renderIntelligentAlerts || defaultRenderIntelligentAlerts;
  const dismissAlert = opts.dismissAlert || defaultDismissAlert;
  const buildExecutiveSummary = opts.buildExecutiveSummary || defaultBuildExecutiveSummary;
  const renderExecutiveSummaryView =
    opts.renderExecutiveSummaryView || defaultRenderExecutiveSummaryView;
  const buildDiagnosisPageModel = opts.buildDiagnosisPageModel || defaultBuildDiagnosisPageModel;
  const renderDiagnosisCenterView =
    opts.renderDiagnosisCenterView || defaultRenderDiagnosisCenterView;
  const renderRecoveryReviewDebt =
    opts.renderRecoveryReviewDebt || defaultRenderRecoveryReviewDebt;
  const analyzeFocusAndEnergy = opts.analyzeFocusAndEnergy || defaultAnalyzeFocusAndEnergy;
  const renderNextBestAction = opts.renderNextBestAction || defaultRenderNextBestAction;
  const renderPreparationSignals =
    opts.renderPreparationSignals || defaultRenderPreparationSignals;
  const buildDecisionCoherenceReport =
    opts.buildDecisionCoherenceReport || defaultBuildDecisionCoherenceReport;
  const renderDecisionCoherenceDebug =
    opts.renderDecisionCoherenceDebug || defaultRenderDecisionCoherenceDebug;
  const buildStudyAction = opts.buildStudyAction || defaultBuildStudyAction;
  const recommendationActionLabel =
    opts.recommendationActionLabel || defaultRecommendationActionLabel;

  function renderAlertasInteligentes(): void {
    const container = opts.document.getElementById('alertasInteligentesList');
    const overview = opts.document.getElementById('overviewAttention');
    if (!container && !overview) return;

    const state = opts.getState();
    const reconciliation = reconcileAlerts(
      opts.computeAlertasInteligentes(),
      state.alertStates,
      opts.todayISO()
    );

    if (JSON.stringify(reconciliation.states) !== JSON.stringify(state.alertStates)) {
      state.alertStates = reconciliation.states;
      opts.scheduleSave();
    }

    const alertas = reconciliation.visible;
    const recommendations = opts.getCurrentStudyRecommendations();
    const presentation = renderIntelligentAlerts({
      alerts: alertas,
      additional: reconciliation.additional,
      currentAction: recommendations[0],
      escapeHtml: opts.escapeHtml,
      escapeAttr: opts.escapeAttr,
    });

    if (container) container.innerHTML = presentation.list;
    if (overview) overview.innerHTML = presentation.overview;
  }

  function dismissIntelligentAlert(id: string): void {
    const state = opts.getState();
    state.alertStates = dismissAlert(state.alertStates, id, opts.todayISO(), opts.addDays, 7);
    opts.scheduleSave();
    renderAlertasInteligentes();
  }

  function renderExecutiveSummary(): void {
    const container = opts.document.getElementById('executiveSummary');
    if (!container) return;

    const state = opts.getState();
    const metrics = opts.computeApprovalMetrics();
    const readiness = opts.readinessResult(metrics);
    const pace = opts.computeRitmo();
    const priorities = opts.computeStudyPriorities();
    const topPriority = priorities[0]
      ? { ...priorities[0], reason: opts.motivoPrioridade(priorities[0]) }
      : null;
    const risks = opts.computeAlertasInteligentes();
    const configuredTopics = opts.examScopedTopics().filter(
      topic =>
        (topic.examImportance !== null || Object.keys(topic.examImportanceEstimates || {}).length) &&
        topic.estimatedStudyMinutes !== null
    );
    const opportunityCount = configuredTopics.filter(topic =>
      priorities.some(priority => priority.topicId === topic.id)
    ).length;

    const weekStart = opts.startOfWeek(opts.todayISO());
    const weeklyGoal = {
      achieved: opts.uniqueTopicsCompletedBetween(weekStart, opts.addDays(weekStart, 6)),
      target: state.metas?.semanal ?? 0,
    };

    const summary = buildExecutiveSummary({
      readiness,
      daysToExam: state.examDate ? (opts.diasParaRevisao(state.examDate) ?? null) : null,
      pace,
      topPriority,
      riskCount: risks.length,
      weeklyGoal,
      opportunityCount,
    });

    container.innerHTML = renderExecutiveSummaryView({
      summary,
      formatMinutes: opts.formatPlanMinutes,
      escapeHtml: opts.escapeHtml,
    });
  }

  function renderDiagnosisCenter(): void {
    const container = opts.document.getElementById('diagnosisCenter');
    if (!container) return;

    const state = opts.getState();
    const { candidates } = opts.refreshStudyRecommendationItems();
    const scoped = opts.examEvidenceContext();
    const studyPlanPreview = opts.getStudyPlanPreview();

    const opportunityCosts =
      studyPlanPreview?.adaptiveAdvice?.state === 'proposal' &&
      !studyPlanPreview.adaptiveAdvice.applied
        ? [studyPlanPreview.adaptiveAdvice]
        : [];

    const projection = opts.currentAchievementProjection(undefined, undefined, candidates).model;
    const currentStudyRecommendations = opts.getCurrentStudyRecommendations();

    const { diagnosis, consolidated, preparationSignals, nextAction, debt } =
      buildDiagnosisPageModel({
        candidates,
        subjects: opts.examScopedSubjects(),
        scope: scoped,
        blueprint: state.examBlueprint,
        globalTarget: state.metas?.metaAprovacao,
        today: opts.todayISO(),
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        recommendations: currentStudyRecommendations,
        opportunityCosts,
        activePlan: opts.latestStudyPlan(),
        weeklyCapacityMinutes: opts.weeklyStrategyCapacity(),
        hoursByDay: state.metas?.horasPorDia || {},
        projection,
      });

    currentConsolidatedDiagnosis = consolidated;
    opts.setCurrentConsolidatedDiagnosis?.(consolidated);

    const diagnosisHtml = renderDiagnosisCenterView({
      model: diagnosis,
      studyActionForItem: (item: Record<string, any>) => {
        const recommendation = currentStudyRecommendations.find(
          candidate => candidate.subjectId === item.subjectId && candidate.topicId === item.topicId
        );
        const action = buildStudyAction(recommendation, { source: 'diagnosis' });
        return action ? { ...action, label: recommendationActionLabel(action) } : null;
      },
      escapeHtml: opts.escapeHtml,
      escapeAttr: opts.escapeAttr,
    });

    const secondaryHtml = renderRecoveryReviewDebt(
      { recoveries: preparationSignals.rows.filter((item: any) => item.type === 'recovery'), debt },
      { escapeHtml: opts.escapeHtml }
    );

    const energyAnalysis = analyzeFocusAndEnergy(state.studySessions || []);
    let energyAlertHtml = '';
    if (energyAnalysis.fatigueAlert) {
      energyAlertHtml = `<div class="alerta-item alerta-media mt-4">
        <span class="alerta-icon">⚠️</span><span><strong>Alerta Cronobiológico:</strong> ${opts.escapeHtml(energyAnalysis.fatigueAlert)}</span>
      </div>`;
    }

    container.innerHTML =
      opts.analysisContextBanner('hoje') +
      renderNextBestAction(nextAction, {
        escapeHtml: opts.escapeHtml,
        escapeAttr: opts.escapeAttr,
        dailyPriority: opts.getDailyPriority(nextAction),
      }) +
      energyAlertHtml +
      diagnosisHtml +
      `<details class="diagnosis-secondary"><summary>Recuperação e revisões · ${opts.pluralize(debt.count, 'vencida')}</summary>${secondaryHtml}</details>`;

    container.innerHTML += `<details class="diagnosis-method-details"><summary>Examinar sinais de preparação e critérios</summary>${renderPreparationSignals(preparationSignals)}</details>`;

    const search = opts.locationSearch ? opts.locationSearch() : '';
    if (search.includes('debug=decisions')) {
      container.innerHTML += renderDecisionCoherenceDebug(
        buildDecisionCoherenceReport({
          trajectory: projection,
          nextBestAction: nextAction,
          examIntelligence: candidates,
          adaptivePlan: opts.latestStudyPlan(),
        }),
        { escapeHtml: opts.escapeHtml }
      );
    }
  }

  return {
    renderAlertasInteligentes,
    dismissIntelligentAlert,
    renderExecutiveSummary,
    renderDiagnosisCenter,
    getConsolidatedDiagnosis: () => currentConsolidatedDiagnosis,
  };
}
