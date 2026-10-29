import {
  createPerformanceViewState,
  resolvePerformanceRange,
  updatePerformanceViewState,
} from '../../../application/performance/performance-view-state.js';
import { buildPerformancePageModel } from '../../../application/performance/build-performance-page-model.js';
import { renderPerformancePage } from '../../performance/performance-page.js';
import { renderPerformanceSection } from '../../performance/render-performance-section.js';
import { createPerformanceController } from '../../controllers/performance-controller.js';
import { createPerformanceAnalyticsController } from '../../controllers/performance-analytics-controller.js';
import { renderProgressChart as renderProgressChartView } from '../../renderers/study-charts-renderer.js';

export interface PerformanceTabControllerDeps {
  document?: any;
  window?: any;
  getState: () => any;
  todayISO: () => string;
  formatDatePt: (dateStr: string) => string;
  formatDecimal?: (val: number | null | undefined) => string;
  escapeHtml: (text: any) => string;
  escapeAttr: (text: any) => string;
  examEvidenceContext: () => any;
  examScopedSubjects: () => any[];
  examScopedSimulations: () => any[];
  currentAchievementProjection?: () => { model: any; weeklyCapacityMinutes?: number; adherenceContext?: any };
  achievementProjectionHistory?: (snapshots: any[], tags: string[], today: string) => any[];
  recoveryController?: { preview: (model: any) => any; revert?: (id: string) => Promise<any> };
  readinessResult?: (metrics: any) => any;
  computeApprovalMetrics?: () => any;
  intelligenceCandidates?: () => any[];
  entitySubjectId?: (item: any) => string | null;
  simuladoEffectiveCounts?: (simulado: any) => any;
  localDateFromTimestamp?: (timestamp: any) => string;
  topicMasteryIndex?: (subjectId: string, topicId: string) => any;
  topicRetentionScore?: (subjectId: string, topicId: string) => any;
  buildTopicExamProfile?: (options: any) => any;
  topicHistoryService?: { list: (options: any) => any[] };
  analysisContextBanner?: (section: string) => string;
  renderExamIntelligenceSection?: () => void;
  projectionController?: { simulate: (scenario: any) => any };
  renderProjectionScenarioResult?: (result: any, options: any) => string;
  applyConfirmedRecoveryPlan?: (sig: string) => void;
  render?: (tab: string) => void;
  activateTab?: (tab: string) => void;
  activeSubjects?: () => any[];
  subjectRadarModel?: (subject: any) => any;
}

export function createPerformanceTabController(deps: PerformanceTabControllerDeps) {
  const doc = deps.document || (typeof document !== 'undefined' ? document : null);
  const escapeHtml = deps.escapeHtml;
  const escapeAttr = deps.escapeAttr;
  const formatDatePt = deps.formatDatePt;
  const todayISO = deps.todayISO;

  let performanceViewState = createPerformanceViewState();

  function recordProgressSnapshot(pct: number) {
    const state = deps.getState();
    const today = todayISO();
    if (!state.progressHistory) state.progressHistory = [];
    const existing = state.progressHistory.find((p: any) => p.date === today);
    if (existing) {
      existing.pct = pct;
    } else {
      state.progressHistory.push({ date: today, pct });
    }
    state.progressHistory.sort((a: any, b: any) => a.date.localeCompare(b.date));
    if (state.progressHistory.length > 180) {
      state.progressHistory = state.progressHistory.slice(-180);
    }
  }

  function renderProgressChart() {
    if (!doc) return;
    const container = doc.getElementById('progressChart');
    if (!container) return;
    const state = deps.getState();
    container.innerHTML = renderProgressChartView({
      data: state.progressHistory || [],
      formatDate: formatDatePt,
    });
  }

  function renderRadarDisciplinas() {
    if (!doc) return;
    const container = doc.getElementById('radarChart');
    if (!container) return;
    container.innerHTML = performanceAnalyticsController.renderRadarHtml();
  }

  const performanceAnalyticsController = createPerformanceAnalyticsController({
    getSubjects: () => (deps.activeSubjects ? deps.activeSubjects() : []),
    getSubjectRadarModel: deps.subjectRadarModel ? deps.subjectRadarModel : () => ({}),
    onRender: renderRadarDisciplinas,
    escapeHtml,
    escapeAttr,
  });

  function setRadarSubject(slot: string, value: any) {
    performanceAnalyticsController.setRadarSubject(slot, value);
  }

  function performanceScopedPlans(scope: any) {
    const state = deps.getState();
    if (!(state.examBlueprint?.activeExamTags || []).length) return state.dailyPlans || [];
    const eligible = new Set(scope.content.eligibleTopics.map((item: any) => item.id));
    return (state.dailyPlans || [])
      .map((plan: any) => ({
        ...plan,
        items: (plan.items || []).filter((item: any) => item.topicId && eligible.has(item.topicId)),
      }))
      .filter((plan: any) => plan.items.length);
  }

  function renderPerformance() {
    if (!doc) return;
    const target = doc.getElementById('performancePage');
    if (!target) return;

    const examHub = doc.getElementById('examIntelligenceHub');
    const parking = doc.getElementById('examIntelligenceParking');
    if (examHub && parking && examHub.parentElement !== parking) parking.append(examHub);

    const state = deps.getState();
    const today = todayISO();
    const range = resolvePerformanceRange({ today, ...performanceViewState });
    const scope = deps.examEvidenceContext();
    const activeExamTags = state.examBlueprint?.activeExamTags || [];
    const examSection = performanceViewState.section === 'exam';
    const achievement =
      performanceViewState.section === 'overview' && deps.currentAchievementProjection
        ? deps.currentAchievementProjection()
        : null;

    const pageModel = examSection
      ? null
      : buildPerformancePageModel({
          viewState: performanceViewState,
          range,
          today,
          activeExamTags,
          scope,
          subjects: deps.examScopedSubjects ? deps.examScopedSubjects() : [],
          simulations:
            performanceViewState.section === 'subjects' ||
            performanceViewState.section === 'simulations'
              ? deps.examScopedSimulations
                ? deps.examScopedSimulations()
                : []
              : [],
          achievementProjection: achievement?.model || null,
          achievementHistory: deps.achievementProjectionHistory
            ? deps.achievementProjectionHistory(state.projectionSnapshots || [], activeExamTags, today)
            : [],
          achievementCapacityMinutes: achievement?.weeklyCapacityMinutes || 0,
          adherenceContext: achievement?.adherenceContext || null,
          recoveryPlan: achievement && deps.recoveryController ? deps.recoveryController.preview(achievement.model) : null,
          projectionSnapshots: state.projectionSnapshots || [],
          readinessSnapshots: state.readinessSnapshots || [],
          readiness:
            performanceViewState.section === 'overview' && deps.readinessResult && deps.computeApprovalMetrics
              ? deps.readinessResult(deps.computeApprovalMetrics())
              : null,
          blueprint: state.examBlueprint,
          globalTarget: state.metas?.metaAprovacao,
          candidates:
            performanceViewState.section === 'subjects' && deps.intelligenceCandidates
              ? deps.intelligenceCandidates()
              : [],
          dailyPlans: performanceScopedPlans(scope),
          executionSource: {
            dailyPlans: state.dailyPlans || [],
            sessions: state.studySessions || [],
            subjects: state.subjects || [],
            capacityHistory: state.planningCapacityHistory || [],
            adherenceTarget: state.metas?.aderenciaSemanal,
          },
          subjectIdFor: deps.entitySubjectId || ((item: any) => item.subjectId),
          simulationCountsFor: deps.simuladoEffectiveCounts || ((s: any) => ({ total: s.total, correct: s.correct })),
          reviewCompletedDateFor: (item: Record<string, any>) =>
            deps.localDateFromTimestamp ? deps.localDateFromTimestamp(item.completedAt) : item.completedAt,
          topicMetricsFor: (subjectId: string, topicId: string) => {
            const mastery = deps.topicMasteryIndex ? deps.topicMasteryIndex(subjectId, topicId) : null;
            const retention = deps.topicRetentionScore ? deps.topicRetentionScore(subjectId, topicId) : null;
            return {
              mastery: mastery?.confidence > 0 ? mastery.score : null,
              retention: retention?.available ? retention.score : null,
              evidence: mastery?.confidence || 0,
            };
          },
          topicProfileFor: (topic: Record<string, any>, subject: Record<string, any>) =>
            deps.buildTopicExamProfile
              ? deps.buildTopicExamProfile({
                  topic,
                  subjectConfig: (state.examBlueprint?.subjects || []).find((item: any) => item.subjectId === subject.id),
                  activeExamTags,
                  exams: state.exams || [],
                  examQuestions: state.examQuestions || [],
                })
              : {},
          topicHistoryFor: (topicId: string) =>
            deps.topicHistoryService ? deps.topicHistoryService.list({ topicId, includeLifecycle: false }) : [],
        });

    const sectionHtml = examSection
      ? '<div id="examIntelligenceMount"></div>'
      : renderPerformanceSection(pageModel!, {
          range,
          today,
          activeExamTags,
          formatDate: formatDatePt,
          escapeHtml,
          escapeAttr,
          targetScore: state.examBlueprint?.configuredAt ? state.examBlueprint.targetScore : null,
        });

    target.innerHTML = renderPerformancePage({
      viewState: performanceViewState,
      range,
      sectionHtml: (deps.analysisContextBanner ? deps.analysisContextBanner('desempenho') : '') + sectionHtml,
      activeExamCount: (state.examBlueprint?.activeExamTags || []).length,
      escapeHtml,
      escapeAttr,
    });

    if (examSection) {
      target.querySelector('#examIntelligenceMount')?.append(examHub!);
      if (deps.renderExamIntelligenceSection) deps.renderExamIntelligenceSection();
    }

    const status = doc.getElementById('performanceStatus');
    const section = target.querySelector('.performance-section-button.active')?.textContent?.trim();
    const statusText = section
      ? `Mostrando ${section}${examSection ? '' : ` · ${range.label}`}.`
      : '';
    if (status && status.textContent !== statusText) status.textContent = statusText;

    const dialog = target.querySelector('#performanceTopicDialog') as any;
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.addEventListener(
        'close',
        () => {
          performanceViewState = updatePerformanceViewState(performanceViewState, { topicId: null });
        },
        { once: true }
      );
      dialog.showModal();
    }
  }

  function getViewState() {
    return performanceViewState;
  }

  function setViewState(next: any) {
    performanceViewState = next;
  }

  function registerController() {
    if (!doc) return;
    createPerformanceController({
      document: doc,
      getViewState,
      setViewState,
      render: () => {
        if (deps.render) deps.render('desempenho');
        else renderPerformance();
      },
      activateTab: deps.activateTab || (() => {}),
      simulateScenario: (scenario: Record<string, any>) =>
        deps.projectionController ? deps.projectionController.simulate(scenario) : null,
      renderScenarioResult: (result: Record<string, any>) =>
        deps.renderProjectionScenarioResult ? deps.renderProjectionScenarioResult(result, { escapeHtml }) : '',
      applyRecovery: (signature: string) =>
        deps.applyConfirmedRecoveryPlan ? deps.applyConfirmedRecoveryPlan(signature) : undefined,
    }).register();
  }

  return {
    recordProgressSnapshot,
    renderProgressChart,
    renderRadarDisciplinas,
    setRadarSubject,
    renderPerformance,
    performanceScopedPlans,
    getViewState,
    setViewState,
    registerController,
    performanceAnalyticsController,
  };
}
