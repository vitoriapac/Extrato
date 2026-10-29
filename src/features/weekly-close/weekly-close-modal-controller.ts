import { buildWeeklyClose } from '../../domain/analytics/weekly-close.js';
import {
  createWeeklyCloseSnapshot,
  upsertWeeklyCloseSnapshot,
} from '../../application/analytics/weekly-close-snapshot.js';
import { buildStudyTrack32ViewModel } from '../../application/analytics/build-studytrack32-view-model.js';
import { buildGapMap } from '../../domain/analytics/gap-map.js';
import { buildDecisionHistory } from '../../domain/recommendations/decision-history.js';
import { buildPostSimulationReplan } from '../../domain/planning/post-simulation-replan.js';
import {
  captureCloseComparisonMetrics,
  buildCloseComparison,
} from '../../application/analytics/build-close-comparison.js';
import { buildAdherenceCloseHistory } from '../../application/adherence/build-weekly-close-adherence.js';
import { buildStrategicFocusHistory } from '../../application/analytics/build-strategic-focus-history.js';
import { buildPhaseComparison } from '../../application/analytics/build-phase-comparison.js';
import { buildStrategicTimeline } from '../../application/analytics/build-strategic-timeline.js';
import { buildPriorityHistory } from '../../application/analytics/build-priority-history.js';
import { buildWeeklyCloseActionProposal } from '../../application/analytics/weekly-close-actions.js';
import { createWeeklyCloseController } from '../../application/analytics/weekly-close-controller.js';
import { createSustainabilityController } from '../../ui/controllers/sustainability-controller.js';
import {
  renderWeeklyClose,
  renderWeeklyCloseNext,
  renderWeeklyStrategicFocus,
  renderPeriodComparison,
  renderGapMap,
  renderDecisionHistory,
  renderPostSimulationReplan,
  renderStrategicFocusHistory,
} from '../../ui/renderers/studytrack32-renderer.js';
import { renderWeeklyDecisionCycle } from '../../ui/renderers/weekly-decision-cycle-renderer.js';
import {
  renderPriorityHistory,
  renderCloseComparison,
  renderStrategicTimeline,
} from '../../ui/renderers/strategic-history-renderer.js';
import { renderDisclosure as renderAnalyticalDisclosure } from '../../ui/components/analytical-presentation.js';
import { renderAdherenceCloseHistory } from '../../ui/renderers/weekly-adherence-renderer.js';
import { renderPhaseComparison } from '../../ui/renderers/phase-comparison-renderer.js';
import { buildProjectionCloseContext } from '../../application/projection/index.js';
import { renderProjectionCloseContext } from '../../ui/renderers/projection-close-context-renderer.js';
import { resolveExamPhase } from '../../domain/planning/adaptive-planning.js';

export interface WeeklyCloseModalControllerDeps {
  document?: any;
  window?: any;
  getState: () => any;
  planningRepository?: {
    getDailyPlans?: () => any[];
  };
  examEvidenceContext: () => any;
  intelligenceCandidates: () => any[];
  getSubjectName: (id: string) => string;
  getTopicName: (id: string) => string;
  todayISO: () => string;
  nowISO: () => string;
  addDays: (dateStr: string, days: number) => string;
  diasParaRevisao: (dateStr: string) => number | null;
  formatPlanMinutes: (minutes: number) => string;
  escapeHtml: (text: any) => string;
  escapeAttr: (text: any) => string;
  uid: (prefix: string) => string;
  showToast: (message: string) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void, options?: any) => void;
  scheduleSave: () => void;
  renderApprovalDashboard?: () => void;
  renderPlanoHoje?: () => void;
  saveCurrentReadinessSnapshot?: () => void;
  captureReadinessBeforeStrategy?: (reason: string) => void;
  readinessResult?: (metrics: any) => any;
  computeApprovalMetrics?: () => any;
  currentAchievementProjection?: () => { model: any };
  examScopedSimulations?: () => any[];
  allTopics?: () => any[];
  metaHoursForDate?: (dateStr: string) => number;
  projectPerformance?: () => any;
  activateTab?: (tab: string) => void;
}

export function createWeeklyCloseModalController(deps: WeeklyCloseModalControllerDeps) {
  const doc = deps.document || (typeof document !== 'undefined' ? document : null);
  const escapeHtml = deps.escapeHtml;
  const escapeAttr = deps.escapeAttr;
  const formatPlanMinutes = deps.formatPlanMinutes;
  const showToast = deps.showToast;
  const scheduleSave = deps.scheduleSave;
  const todayISO = deps.todayISO;
  const nowISO = deps.nowISO;
  const addDays = deps.addDays;
  const diasParaRevisao = deps.diasParaRevisao;
  const uid = deps.uid;

  let currentStudyTrackModel: any = null;
  let strategicTimelineFilter = 'all';
  let strategicTimelineGroup = 'none';
  let priorityHistorySubject = '';

  function recordedExamPhase() {
    const state = deps.getState();
    return resolveExamPhase(state.examDate ? diasParaRevisao(state.examDate) : null);
  }

  const sustainabilityController = createSustainabilityController({
    getModel: () => currentStudyTrackModel?.weeklyClose?.adherence?.sustainability,
    getCapacity: () => {
      const state = deps.getState();
      return Object.values(state.metas?.horasPorDia || {}).reduce<number>(
        (sum, value) => sum + (Number(value) || 0) * 60,
        0
      );
    },
    formatMinutes: formatPlanMinutes,
    showPreview: (text: string, accept: () => void, options: Record<string, any>) =>
      deps.showConfirm(text, accept, undefined, options),
    navigate: () => {
      if (deps.activateTab) deps.activateTab('metas');
      if (doc) {
        const target = doc.getElementById('metasCapacityTitle');
        target?.setAttribute('tabindex', '-1');
        target?.focus();
        target?.scrollIntoView({ block: 'start' });
      }
    },
  });

  const weeklyCloseController = createWeeklyCloseController({
    getModel: () => currentStudyTrackModel,
    getState: () => deps.getState(),
    buildProposal: buildWeeklyCloseActionProposal,
    createSnapshot: (model: Record<string, any>, options: Record<string, any>) =>
      createWeeklyCloseSnapshot(model, { ...options, examPhase: recordedExamPhase() }),
    upsertSnapshot: upsertWeeklyCloseSnapshot,
    clock: { today: todayISO, nowISO, addDays },
    idGenerator: uid,
    getDailyCapacity: (date: string) => (deps.metaHoursForDate ? deps.metaHoursForDate(date) * 60 : 240),
    onChanged: renderStudyTrack32Insights,
    onBeforeApply: () => {
      if (deps.saveCurrentReadinessSnapshot) deps.saveCurrentReadinessSnapshot();
      if (deps.captureReadinessBeforeStrategy) {
        deps.captureReadinessBeforeStrategy('Antes de aplicar as prioridades do fechamento');
      }
    },
    onApplied: () => {
      scheduleSave();
      if (deps.renderApprovalDashboard) deps.renderApprovalDashboard();
      if (deps.renderPlanoHoje) deps.renderPlanoHoje();
      showToast('Prioridades aceitas aplicadas ao plano diário.');
    },
  });

  function renderWeeklySnapshotHistory(): string {
    const state = deps.getState();
    const activeExamTags = currentStudyTrackModel?.activeExamTags || [];
    return (
      renderStrategicFocusHistory(
        buildStrategicFocusHistory({
          snapshots: state.weeklyCloseSnapshots || [],
          current: currentStudyTrackModel,
          activeExamTags,
        })
      ) +
      renderAdherenceCloseHistory(
        buildAdherenceCloseHistory({
          snapshots: state.weeklyCloseSnapshots || [],
          activeExamTags,
          today: todayISO(),
        })
      )
    );
  }

  function renderWeeklyCloseActions(close: Record<string, any>): string {
    const priorities = close?.priorities || [];
    if (!priorities.length) {
      return `<button class="btn ghost small" data-delegated-click="saveWeeklyCloseSnapshot()">Salvar fechamento desta semana</button>`;
    }
    const draft = weeklyCloseController.view();
    const checks = priorities
      .map((item: any, index: any) => {
        const id = item.priorityId || item.topicId || String(index);
        return `<label class="weekly-priority-choice"><input type="checkbox" data-delegated-change="toggleWeeklyPriority('${escapeAttr(id)}',this.checked)" ${(draft.selectedIds || []).includes(id) ? 'checked' : ''}><span>${escapeHtml(item.action)} · ${formatPlanMinutes(item.estimatedMinutes)}</span></label>`;
      })
      .join('');
    const proposal = draft.proposal;
    return `<section class="weekly-close-actions"><h4>Decida as prioridades</h4>${checks}<button class="btn ghost small" data-delegated-click="previewWeeklyCloseActions()">Conferir impacto</button>${proposal ? `<div class="weekly-action-preview"><strong>${proposal.allocations.length} alocações · ${formatPlanMinutes(proposal.unallocatedMinutes)} sem capacidade</strong><button class="btn small" data-delegated-click="confirmWeeklyCloseActions()">Aplicar prioridades selecionadas</button></div>` : ''}<button class="btn ghost small" data-delegated-click="saveWeeklyCloseSnapshot()">Salvar fechamento desta semana</button></section>`;
  }

  function previewWeeklyCloseActions() {
    weeklyCloseController.preview();
  }

  function toggleWeeklyPriority(id: string, checked: boolean) {
    weeklyCloseController.toggle(id, checked);
  }

  function confirmWeeklyCloseActions() {
    if (!weeklyCloseController.apply()) {
      showToast(
        'A capacidade ou as prioridades mudaram. Confira a prévia atualizada antes de confirmar.'
      );
    }
  }

  function saveWeeklyCloseSnapshot() {
    const state = deps.getState();
    const snapshot = createWeeklyCloseSnapshot(currentStudyTrackModel, {
      savedAt: nowISO(),
      id: uid('weekly-close'),
      examPhase: recordedExamPhase(),
    });
    if (!snapshot) return showToast('Ainda não há dados suficientes para salvar o fechamento.');
    if (!state.weeklyCloseSnapshots) state.weeklyCloseSnapshots = [];
    if (!upsertWeeklyCloseSnapshot(state.weeklyCloseSnapshots, snapshot)) {
      return showToast('Fechamento já salvo com os mesmos dados.');
    }
    if (deps.saveCurrentReadinessSnapshot) deps.saveCurrentReadinessSnapshot();
    scheduleSave();
    if (deps.renderApprovalDashboard) deps.renderApprovalDashboard();
    if (doc) {
      (
        doc.querySelector(
          '#weeklyCloseDashboard [data-delegated-click="saveWeeklyCloseSnapshot()"]'
        ) as HTMLElement | null
      )?.focus();
    }
    showToast('Fechamento semanal salvo como retrato deste período.');
  }

  function renderStudyTrack32Insights() {
    if (!doc) return;
    const close = doc.getElementById('weeklyCloseDashboard'),
      comparison = doc.getElementById('periodComparisonDashboard'),
      gaps = doc.getElementById('gapMapDashboard'),
      history = doc.getElementById('decisionHistoryDashboard'),
      simReplan = doc.getElementById('postSimulationReplanDashboard');

    const state = deps.getState();
    const scope = deps.examEvidenceContext();
    const scopedTopicIds = new Set(scope.content.eligibleTopics.map((item: any) => item.id));
    const scopedSubjectIds = new Set(scope.content.eligibleTopics.map((item: any) => item.subjectId));
    const dailyPlansSource = deps.planningRepository?.getDailyPlans
      ? deps.planningRepository.getDailyPlans()
      : state.dailyPlans || [];

    const scopedPlans = dailyPlansSource.map((plan: any) => ({
      ...plan,
      items: (plan.items || []).filter(
        (item: any) => !item.topicId || scopedTopicIds.has(item.topicId)
      ),
    }));
    const scopedRecommendations = (state.recommendationFeedback || []).filter(
      (item: any) => !item.topicId || scopedTopicIds.has(item.topicId)
    );

    const model = buildStudyTrack32ViewModel({
      readinessSnapshots: state.readinessSnapshots || [],
      readiness: deps.readinessResult && deps.computeApprovalMetrics
        ? deps.readinessResult(deps.computeApprovalMetrics())
        : null,
      today: todayISO(),
      sessions: scope.sessions.included,
      questions: scope.questions.included,
      dailyPlans: scopedPlans,
      weeklyCloseSnapshots: state.weeklyCloseSnapshots || [],
      executionSource: {
        dailyPlans: state.dailyPlans || [],
        sessions: state.studySessions || [],
        subjects: state.subjects || [],
        capacityHistory: state.planningCapacityHistory || [],
        adherenceTarget: state.metas?.aderenciaSemanal,
      },
      planAdjustments: state.planAdjustments || [],
      recommendations: scopedRecommendations,
      simulations: deps.examScopedSimulations ? deps.examScopedSimulations() : [],
      subjects: (state.subjects || []).filter((subject: any) => scopedSubjectIds.has(subject.id)),
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      weeklyCapacityMinutes: Object.values(state.metas?.horasPorDia || {}).reduce<number>(
        (sum, hours) => sum + (Number(hours) || 0) * 60,
        0
      ),
      targetAccuracy: state.metas?.metaAprovacao,
      blueprint: state.examBlueprint,
      algorithmServices: {
        addDays,
        buildWeeklyClose,
        buildGapMap,
        buildDecisionHistory,
        buildPostSimulationReplan,
        buildCandidates: deps.intelligenceCandidates,
      },
      nameResolvers: { subject: deps.getSubjectName, topic: deps.getTopicName },
    });

    const options = { escapeHtml, formatMinutes: formatPlanMinutes };
    currentStudyTrackModel = model;
    if (deps.projectPerformance) {
      (model as { comparisonMetrics?: unknown }).comparisonMetrics = captureCloseComparisonMetrics(
        model,
        deps.projectPerformance()
      );
    }

    if (close) {
      const trajectory = deps.currentAchievementProjection
        ? deps.currentAchievementProjection().model
        : null;
      const trajectoryClose = buildProjectionCloseContext({
        current: trajectory,
        snapshots: state.projectionSnapshots || [],
        activeExamTags: model.activeExamTags,
        periodStart: model.period.start,
        today: todayISO(),
      });
      close.innerHTML =
        renderWeeklyClose(model.weeklyClose, { ...options, includeNext: false }) +
        renderWeeklyDecisionCycle(model.weeklyClose.decisionCycle, {
          adherence: model.weeklyClose.adherence,
          trajectory: trajectoryClose,
        }) +
        renderAnalyticalDisclosure({
          title: 'Comparar a semana e a trajetória',
          className: 'weekly-comparison-detail',
          contentHTML:
            renderCloseComparison(
              buildCloseComparison({
                current: model,
                snapshots: state.weeklyCloseSnapshots || [],
                activeExamTags: model.activeExamTags,
              })
            ) + renderProjectionCloseContext(trajectoryClose, { escapeHtml }),
        }) +
        renderWeeklyStrategicFocus(model.weeklyClose.strategicFocus) +
        renderWeeklySnapshotHistory() +
        renderWeeklyCloseNext(model.weeklyClose, options) +
        (model.weeklyClose.state === 'insufficient'
          ? ''
          : renderWeeklyCloseActions(model.weeklyClose));
    }

    const timeline = doc.getElementById('strategicTimelineDashboard');
    if (timeline) {
      timeline.innerHTML =
        renderPhaseComparison(
          buildPhaseComparison({
            weeklyCloseSnapshots: state.weeklyCloseSnapshots || [],
            readinessSnapshots: state.readinessSnapshots || [],
            activeExamTags: state.examBlueprint?.activeExamTags || [],
          })
        ) +
        renderStrategicTimeline(
          buildStrategicTimeline({
            readinessSnapshots: state.readinessSnapshots || [],
            weeklyCloseSnapshots: state.weeklyCloseSnapshots || [],
            recommendations: state.recommendationFeedback || [],
            recommendationHistory: state.recommendationHistory || [],
            studyPlans: state.studyPlans || [],
            adaptiveHistory: state.adaptivePlanningHistory || [],
            planAdjustments: state.planAdjustments || [],
            simulations: state.simulados || [],
            topics: deps.allTopics ? deps.allTopics() : [],
            activeExamTags: state.examBlueprint?.activeExamTags || [],
            filter: strategicTimelineFilter,
            groupBy: strategicTimelineGroup,
            today: todayISO(),
          })
        );
    }

    const priorities = doc.getElementById('priorityHistoryDashboard');
    if (priorities) {
      priorities.innerHTML = renderPriorityHistory(
        buildPriorityHistory({
          weeklyCloseSnapshots: state.weeklyCloseSnapshots || [],
          topics: deps.allTopics ? deps.allTopics() : [],
          candidates: deps.intelligenceCandidates(),
          recommendationHistory: state.recommendationHistory || [],
          recommendations: state.recommendationFeedback || [],
          studyPlans: state.studyPlans || [],
          activeExamTags: state.examBlueprint?.activeExamTags || [],
          today: todayISO(),
          subjectId: priorityHistorySubject,
        })
      );
    }

    if (comparison) comparison.innerHTML = renderPeriodComparison(model.weeklyClose, options);
    if (gaps) gaps.innerHTML = renderGapMap(model.gapMap, options);
    if (history) history.innerHTML = renderDecisionHistory(model.decisionHistory, options);
    if (simReplan) simReplan.innerHTML = renderPostSimulationReplan(model.postSimulation, options);
  }

  function openWeeklyClose() {
    if (deps.activateTab) deps.activateTab('metas');
    if (doc) {
      doc.getElementById('metasCloseSection')?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
  }

  function setStrategicTimelineFilter(value: string) {
    strategicTimelineFilter = value;
    renderStudyTrack32Insights();
  }

  function setStrategicTimelineGroup(value: string) {
    strategicTimelineGroup = value;
    renderStudyTrack32Insights();
  }

  function setPriorityHistorySubject(value: string) {
    priorityHistorySubject = value;
    renderStudyTrack32Insights();
  }

  function getCurrentStudyTrackModel() {
    return currentStudyTrackModel;
  }

  return {
    renderStudyTrack32Insights,
    renderWeeklyCloseActions,
    previewWeeklyCloseActions,
    toggleWeeklyPriority,
    confirmWeeklyCloseActions,
    saveWeeklyCloseSnapshot,
    openWeeklyClose,
    setStrategicTimelineFilter,
    setStrategicTimelineGroup,
    setPriorityHistorySubject,
    getCurrentStudyTrackModel,
    weeklyCloseController,
    sustainabilityController,
  };
}
