import { buildWeeklyClose } from '../../domain/analytics/weekly-close.js';
import {
  createWeeklyCloseSnapshot,
  planWeeklyCloseRevision,
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
  renderWeeklyCloseKpis,
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
import { scrollBehavior } from '../../ui/accessibility.js';
import { renderWeeklyCloseRecord } from '../../ui/renderers/weekly-close-record-renderer.js';
import { openSectionFor } from '../../ui/remembered-sections.js';

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
  showConfirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: any
  ) => void;
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
  // Prévia do retrato aberta e retrato acabado de salvar (mensagem de confirmação).
  let recordPreviewOpen = false;
  let recordSavedNow = false;
  let lastAppliedSnapshotId: string | null = null;
  // Depois do Desfazer fica um carimbo curto, para a semana não parecer intocada.
  let undoneNote: { kept: number } | null = null;
  let appliedSummary: { ids: string[]; names: string[]; minutes: number; days: number } | null =
    null;
  let strategicTimelineFilter = 'all';
  let strategicTimelineGroup = 'none';
  let priorityHistorySubject = '';
  let priorityHistoryPage = 0;
  const expandedPriorityTopics = new Set<string>();
  const expandedPriorityObservations = new Set<string>();

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
        openSectionFor(target);
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
    getDailyCapacity: (date: string) =>
      deps.metaHoursForDate ? deps.metaHoursForDate(date) * 60 : 240,
    onChanged: renderStudyTrack32Insights,
    onBeforeApply: () => {
      if (deps.saveCurrentReadinessSnapshot) deps.saveCurrentReadinessSnapshot();
      if (deps.captureReadinessBeforeStrategy) {
        deps.captureReadinessBeforeStrategy('Antes de aplicar as prioridades do fechamento');
      }
    },
    onApplied: (result: Record<string, any>) => {
      const proposal = result?.proposal;
      // O ritual termina com o que foi agendado, no mesmo tom do selo do retrato.
      const allocations = proposal?.allocations || [];
      undoneNote = null;
      appliedSummary = {
        ids: allocations.map((item: any) => item.priorityId).filter(Boolean),
        names: [
          ...new Set(
            allocations.map((item: any) => deps.getTopicName(item.topicId)).filter(Boolean)
          ),
        ] as string[],
        minutes: allocations.reduce(
          (sum: number, item: any) => sum + (Number(item.minutes) || 0),
          0
        ),
        days: new Set(allocations.map((item: any) => item.date)).size,
      };
      lastAppliedSnapshotId = result?.snapshot?.id || null;
      recordSavedNow = true;
      scheduleSave();
      if (deps.renderApprovalDashboard) deps.renderApprovalDashboard();
      if (deps.renderPlanoHoje) deps.renderPlanoHoje();
      renderStudyTrack32Insights();
      (doc?.getElementById('weeklyAppliedStatus') as HTMLElement | null)?.focus();
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

  // "Praticar o tópico" sozinho não diz qual: a decisão nomeia o tópico de cada prioridade.
  function withTopicNames(close: Record<string, any>): Record<string, any> {
    return {
      ...close,
      priorities: (close.priorities || []).map((item: any) => {
        const name = item.topicId ? deps.getTopicName(item.topicId) : '';
        return name ? { ...item, action: `${item.action} · ${name}` } : item;
      }),
    };
  }

  function renderWeeklyCloseActions(close: Record<string, any>): string {
    // O que já foi agendado sai da decisão; resta o selo e o que ainda dá para escolher.
    const done = new Set(appliedSummary?.ids || []);
    const priorities = (close?.priorities || []).filter((item: any) => !done.has(item.priorityId));
    if (!priorities.length && !appliedSummary && !undoneNote) return '';
    const draft = weeklyCloseController.view();
    const checks = priorities
      .map((item: any, index: any) => {
        const id = item.priorityId || item.topicId || String(index);
        return `<label class="weekly-priority-choice"><input type="checkbox" data-delegated-change="toggleWeeklyPriority('${escapeAttr(id)}',this.checked)" ${(draft.selectedIds || []).includes(id) ? 'checked' : ''}><span>${escapeHtml(item.action)} · ${formatPlanMinutes(item.estimatedMinutes)}${item.reason ? `<small>${escapeHtml(item.reason)}</small>` : ''}</span></label>`;
      })
      .join('');
    const proposal = draft.proposal,
      none = !(draft.selectedIds || []).length;
    // Sem seleção não há impacto a conferir, e sem alocação não há o que aplicar.
    const allocated = proposal?.allocations?.length || 0,
      left = Number(proposal?.unallocatedMinutes) || 0;
    const previewHtml = proposal
      ? `<div class="weekly-action-preview"><strong>${allocated ? `${allocated} ${allocated === 1 ? 'bloco entra' : 'blocos entram'} na agenda dos próximos 7 dias` : 'Nada coube na capacidade livre dos próximos 7 dias'}${left ? ` · ${formatPlanMinutes(left)} não couberam` : ''}</strong>${allocated ? '<button class="btn small" type="button" data-delegated-click="confirmWeeklyCloseActions()">Aplicar prioridades selecionadas</button>' : '<p class="analytics-note">Libere horas em Disponibilidade semanal ou escolha outra prioridade.</p>'}</div>`
      : '';
    const applied = appliedSummary
      ? `<div class="weekly-applied" id="weeklyAppliedStatus" role="status" tabindex="-1"><span class="weekly-record-stamp" aria-hidden="true"><span>Agendado</span></span><p>Próxima semana: ${escapeHtml(appliedSummary.names.join(', ') || 'prioridades escolhidas')} · ${formatPlanMinutes(appliedSummary.minutes)} reservados em ${appliedSummary.days} ${appliedSummary.days === 1 ? 'dia' : 'dias'}. Os blocos já estão no plano diário; o retrato e a prontidão desta semana foram registrados junto.</p>${lastAppliedSnapshotId ? '<button class="btn ghost small" type="button" data-delegated-click="undoWeeklyCloseApply()">Desfazer</button>' : ''}</div>`
      : '';
    const undone = undoneNote
      ? `<div class="weekly-applied weekly-applied--undone" id="weeklyUndoneStatus" role="status" tabindex="-1"><span class="weekly-record-stamp" aria-hidden="true"><span>Desfeito</span></span><p>${undoneNote.kept ? 'Blocos ainda não estudados foram removidos; os que já têm tempo registrado continuam no plano.' : 'As prioridades foram desfeitas: os blocos saíram do plano e a revisão aplicada foi removida.'} Você pode escolher de novo.</p></div>`
      : '';
    if (!priorities.length)
      return `<section class="weekly-close-actions">${applied}${undone}</section>`;
    return `<section class="weekly-close-actions">${applied}${undone}<h4>Foco da próxima semana</h4><p>Vem das sugestões desta semana; a próxima ação de hoje continua no plano. ${priorities.length === 1 ? 'Marque a prioridade' : 'Selecione até três'}, confira a capacidade restante e confirme.</p>${checks}<button class="btn ghost small" type="button" data-delegated-click="previewWeeklyCloseActions()"${none ? ' disabled aria-describedby="weeklyPreviewHint"' : ''}>Conferir impacto</button>${none ? '<small id="weeklyPreviewHint" class="analytics-note">Marque ao menos uma prioridade para conferir o impacto.</small>' : ''}${previewHtml}</section>`;
  }

  // Desfaz só o que ainda não foi estudado: blocos com tempo registrado ficam, e com eles a revisão.
  function undoWeeklyCloseApply() {
    const id = lastAppliedSnapshotId;
    if (!id) return;
    const state = deps.getState();
    let kept = 0;
    for (const plan of state.dailyPlans || []) {
      const items = plan.items || [];
      const next = items.filter((item: any) => {
        if (item.weeklyCloseSnapshotId !== id) return true;
        const executed =
          (Number(item.executedSeconds) || 0) > 0 || (item.sessionIds || []).length > 0;
        if (executed) kept++;
        return executed;
      });
      if (next.length === items.length) continue;
      plan.items = next;
      plan.plannedMinutes = next.reduce(
        (sum: number, row: any) => sum + (Number(row.plannedMinutes) || 0),
        0
      );
      plan.flexMinutes = Math.max(0, (Number(plan.availableMinutes) || 0) - plan.plannedMinutes);
      plan.updatedAt = nowISO();
    }
    const snapshots = state.weeklyCloseSnapshots || [];
    const index = snapshots.findIndex((item: any) => item.id === id);
    if (!kept && index >= 0) snapshots.splice(index, 1);
    lastAppliedSnapshotId = null;
    appliedSummary = null;
    undoneNote = { kept };
    recordSavedNow = false;
    scheduleSave();
    if (deps.renderApprovalDashboard) deps.renderApprovalDashboard();
    if (deps.renderPlanoHoje) deps.renderPlanoHoje();
    renderStudyTrack32Insights();
    showToast(
      kept
        ? 'Blocos ainda não estudados removidos. Os que já têm tempo registrado continuam no plano.'
        : 'Prioridades desfeitas: os blocos saíram do plano e a revisão aplicada foi removida.'
    );
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

  function weeklyCloseCandidate() {
    if (!currentStudyTrackModel) return null;
    return createWeeklyCloseSnapshot(currentStudyTrackModel, {
      savedAt: null,
      id: 'preview',
      examPhase: recordedExamPhase(),
    });
  }

  function focusRecord(selector: string) {
    (doc?.querySelector(selector) as HTMLElement | null)?.focus();
  }

  function openWeeklyCloseRecord() {
    recordPreviewOpen = true;
    recordSavedNow = false;
    renderStudyTrack32Insights();
    focusRecord('#weeklyRecordPreview');
  }

  function closeWeeklyCloseRecord() {
    recordPreviewOpen = false;
    renderStudyTrack32Insights();
    focusRecord('[data-delegated-click="openWeeklyCloseRecord()"]');
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
    recordPreviewOpen = false;
    recordSavedNow = true;
    if (deps.renderApprovalDashboard) deps.renderApprovalDashboard();
    renderStudyTrack32Insights();
    // O comprovante no lugar confirma o salvamento; um toast extra ficava sob a faixa da demonstração.
    focusRecord('#weeklyRecordStatus');
  }

  function goToWeeklyDecision() {
    const title = doc?.getElementById('weeklyNextTitle') as HTMLElement | null;
    if (!title) return;
    title.tabIndex = -1;
    title.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
    title.focus({ preventScroll: true });
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
    const scopedSubjectIds = new Set(
      scope.content.eligibleTopics.map((item: any) => item.subjectId)
    );
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
      readiness:
        deps.readinessResult && deps.computeApprovalMetrics
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
      const candidate = weeklyCloseCandidate();
      // Redesenhar depois de uma ação não pode fechar a análise que o estudante abriu.
      const analysisOpen = Boolean(
        (close.querySelector?.('.weekly-close-analysis') as HTMLDetailsElement | null)?.open
      );
      close.innerHTML =
        '<section class="weekly-close-act" aria-labelledby="weeklyWeekTitle"><h4 class="weekly-close-act__title" id="weeklyWeekTitle">A semana</h4>' +
        renderWeeklyCloseKpis(model.weeklyClose, options) +
        // A semana lê-se nos três números; a análise inteira fica num único disclosure.
        `<details class="weekly-close-analysis editorial-disclosure"${analysisOpen ? ' open' : ''}><summary>Ver análise completa da semana</summary>` +
        renderWeeklyClose(model.weeklyClose, {
          ...options,
          includeNext: false,
          includeKpis: false,
        }) +
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
        '</details></section>' +
        renderWeeklyCloseRecord({
          close: model.weeklyClose,
          candidate,
          plan: candidate
            ? planWeeklyCloseRevision(state.weeklyCloseSnapshots || [], candidate)
            : null,
          previewOpen: recordPreviewOpen,
          // Um retrato que cruza outro período salvo distorce a comparação entre os dois.
          overlap:
            candidate &&
            (state.weeklyCloseSnapshots || []).find(
              (item: any) =>
                item.period?.start &&
                (item.period.start !== candidate.period?.start ||
                  item.period.end !== candidate.period?.end) &&
                item.period.start <= candidate.period?.end &&
                item.period.end >= candidate.period?.start
            )?.period,
          savedNow: recordSavedNow,
          formatMinutes: formatPlanMinutes,
          escapeHtml,
        }) +
        '<section class="weekly-close-act" aria-labelledby="weeklyNextTitle"><h4 class="weekly-close-act__title" id="weeklyNextTitle">A decisão</h4>' +
        ((model.weeklyClose.priorities || []).length
          ? renderWeeklyCloseNext({ ...model.weeklyClose, priorities: [] }, options) +
            renderWeeklyCloseActions(withTopicNames(model.weeklyClose))
          : '<p class="weekly-close-empty">Nenhuma prioridade sugerida para a próxima semana ainda. Elas vêm das recomendações deste período que não foram dispensadas, mostradas em Hoje.</p>') +
        '</section>';
    }
    const closeHistory = doc.getElementById('weeklyCloseHistoryDashboard');
    if (closeHistory) {
      closeHistory.innerHTML =
        renderWeeklySnapshotHistory() ||
        '<p class="analytics-note">Nenhum retrato salvo ainda. Cada fechamento salvo aparece aqui, sem recálculo.</p>';
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
        }),
        {
          expandedTopics: expandedPriorityTopics,
          expandedObservations: expandedPriorityObservations,
          page: priorityHistoryPage,
        }
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
      const section = doc.getElementById('metasCloseSection');
      openSectionFor(section);
      section?.scrollIntoView({
        block: 'start',
        behavior: scrollBehavior(),
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
    priorityHistoryPage = 0;
    expandedPriorityTopics.clear();
    expandedPriorityObservations.clear();
    renderStudyTrack32Insights();
  }

  function togglePriorityTopic(topicKey: string) {
    const key = String(topicKey || '');
    if (!key) return;
    if (expandedPriorityTopics.has(key)) {
      expandedPriorityTopics.delete(key);
    } else {
      expandedPriorityTopics.add(key);
    }
    renderStudyTrack32Insights();
  }

  function togglePriorityTopicObservations(topicKey: string) {
    const key = String(topicKey || '');
    if (!key) return;
    if (expandedPriorityObservations.has(key)) {
      expandedPriorityObservations.delete(key);
    } else {
      expandedPriorityObservations.add(key);
    }
    renderStudyTrack32Insights();
  }

  function showMorePriorityHistoryTopics() {
    priorityHistoryPage += 1;
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
    undoWeeklyCloseApply,
    saveWeeklyCloseSnapshot,
    openWeeklyCloseRecord,
    closeWeeklyCloseRecord,
    goToWeeklyDecision,
    openWeeklyClose,
    setStrategicTimelineFilter,
    setStrategicTimelineGroup,
    setPriorityHistorySubject,
    togglePriorityTopic,
    togglePriorityTopicObservations,
    showMorePriorityHistoryTopics,
    getCurrentStudyTrackModel,
    weeklyCloseController,
    sustainabilityController,
  };
}
