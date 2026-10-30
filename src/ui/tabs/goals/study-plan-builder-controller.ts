import {
  applyAdaptivePlanningAdvice,
  buildAdaptivePlanningAdvice,
  resolveExamPhase,
} from '../../../domain/planning/adaptive-planning.js';
import {
  renderAdaptiveAllocationAdvice,
  renderExamPhase,
} from '../../renderers/adaptive-planning-renderer.js';
import { createPhaseStrategyController } from '../../../application/planning/phase-strategy-controller.js';
import { buildPhasePlanningPreview } from '../../../application/planning/build-phase-planning-preview.js';
import { renderPhaseStrategy } from '../../renderers/phase-strategy-renderer.js';
import { buildRecommendationExplanation } from '../../../application/recommendations/build-recommendation-explanation.js';
import { renderRecommendationExplanation } from '../../renderers/recommendation-explanation-renderer.js';

export interface StudyPlanBuilderControllerDeps {
  document?: any;
  window?: any;
  getState: () => any;
  studyPlanService: {
    calculate: (options: any) => any;
    confirm: (proposal: any) => any;
    getActive: () => any;
  };
  dailyPlanService: {
    calculate: (options: any) => any;
    confirm: (proposal: any, studyPlan: any) => any;
    undo: (operation: any, studyPlan: any) => any;
  };
  recoveryController?: {
    revert: (id: string) => Promise<any>;
  };
  intelligenceCandidates: () => any[];
  getTopicById?: (id: string) => any;
  getTopicName?: (id: string) => string;
  getSubjectName?: (id: string) => string;
  todayISO: () => string;
  nowISO: () => string;
  addDays: (dateStr: string, days: number) => string;
  diasParaRevisao: (dateStr: string) => number | null;
  formatDatePt: (dateStr: string) => string;
  formatPlanMinutes: (minutes: number) => string;
  pluralize: (count: number, singular: string, plural?: string) => string;
  escapeHtml: (text: any) => string;
  escapeAttr: (text: any) => string;
  metaHoursForDate: (dateStr: string) => number;
  uid: (prefix: string) => string;
  showToast: (message: string) => void;
  scheduleSave: () => void;
  renderPlanoHoje?: () => void;
  captureReadinessBeforeStrategy?: (reason: string) => void;
  readinessResult?: (metrics: any) => any;
  computeApprovalMetrics?: () => any;
  currentAchievementProjection?: (date?: any, tags?: any, candidates?: any) => { model: any };
  examEvidenceContext?: () => any;
  analysisContextBanner?: (section: string) => string;
  feedbackRecoveryResult?: (result: any) => any;
}

export function createStudyPlanBuilderController(deps: StudyPlanBuilderControllerDeps) {
  const doc = deps.document || (typeof document !== 'undefined' ? document : null);
  const escapeHtml = deps.escapeHtml;
  const escapeAttr = deps.escapeAttr;
  const formatPlanMinutes = deps.formatPlanMinutes;
  const formatDatePt = deps.formatDatePt;
  const pluralize = deps.pluralize;
  const showToast = deps.showToast;
  const scheduleSave = deps.scheduleSave;
  const todayISO = deps.todayISO;
  const nowISO = deps.nowISO;
  const addDays = deps.addDays;
  const diasParaRevisao = deps.diasParaRevisao;
  const uid = deps.uid;

  let studyPlanPreview: any = null;
  let dailyPlanPreview: any = null;

  function latestStudyPlan() {
    return deps.studyPlanService.getActive();
  }

  function getStudyPlanPreview() {
    return studyPlanPreview;
  }

  function getDailyPlanPreview() {
    return dailyPlanPreview;
  }

  function clearStudyPlanPreviewState() {
    studyPlanPreview = null;
  }

  function clearDailyPlanPreviewState() {
    dailyPlanPreview = null;
  }

  function invalidatePreviews() {
    studyPlanPreview = null;
    dailyPlanPreview = null;
  }

  function weeklyStrategyCapacity(): number {
    const state = deps.getState();
    return Object.values(state.metas?.horasPorDia || {}).reduce<number>(
      (sum, hours) => sum + Math.max(0, Number(hours) || 0) * 60,
      0
    );
  }

  function currentPhaseStrategy() {
    const state = deps.getState();
    const candidates = deps.intelligenceCandidates();
    const readiness =
      deps.readinessResult && deps.computeApprovalMetrics
        ? deps.readinessResult(deps.computeApprovalMetrics())
        : null;
    const trajectory = deps.currentAchievementProjection
      ? deps.currentAchievementProjection(undefined, undefined, candidates).model
      : null;
    const evidenceScope = deps.examEvidenceContext
      ? deps.examEvidenceContext()
      : { content: { eligibleTopics: [] } };

    return buildPhasePlanningPreview({
      plan: latestStudyPlan(),
      weeklyCapacityMinutes: weeklyStrategyCapacity(),
      candidates,
      daysToExam: state.examDate ? diasParaRevisao(state.examDate) : null,
      today: todayISO(),
      history: state.adaptivePlanningHistory || [],
      readiness,
      trajectory,
      examDate: state.examDate,
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      eligibleTopicIds: evidenceScope.content.eligibleTopics.map((topic: any) => topic.id),
    });
  }

  const phaseStrategyController = createPhaseStrategyController({
    getProposal: currentPhaseStrategy,
    getLatestPlan: latestStudyPlan,
    getPlans: () => deps.getState().studyPlans,
    confirmPlan: (proposal: Record<string, any>) => deps.studyPlanService.confirm(proposal),
    getCapacity: weeklyStrategyCapacity,
    getExamDate: () => deps.getState().examDate,
    clock: { nowISO },
    onBeforeChange: deps.captureReadinessBeforeStrategy || (() => {}),
  });

  function previewPhaseStrategy() {
    phaseStrategyController.preview();
    renderStudyPlanBuilder();
  }

  function cancelPhaseStrategy() {
    phaseStrategyController.cancel();
    renderStudyPlanBuilder();
  }

  function savePhaseStrategyResult(result: Record<string, any>) {
    if (!['applied', 'reverted'].includes(result.state)) {
      renderStudyPlanBuilder();
      showToast(result.reason || 'A proposta mudou. Confira os dados e confirme novamente.');
      return;
    }
    studyPlanPreview = null;
    dailyPlanPreview = null;
    scheduleSave();
    renderStudyPlanBuilder();
    showToast(
      result.state === 'applied'
        ? 'Estratégia confirmada em uma nova versão. Distribua o plano nos próximos dias.'
        : 'Divisão anterior restaurada em uma nova versão. Planos diários existentes foram preservados.'
    );
  }

  function confirmPhaseStrategy() {
    savePhaseStrategyResult(phaseStrategyController.confirm());
  }

  function revertPhaseStrategy() {
    savePhaseStrategyResult(phaseStrategyController.revert());
  }

  function studyPlanCandidates({ guidedDefaults = false }: any = {}) {
    return deps
      .intelligenceCandidates()
      .filter((item: any) => item.topicId)
      .map((item: any) => {
        let estimatedMinutes = item.remainingMinutes;
        if (guidedDefaults && estimatedMinutes == null && deps.getTopicById) {
          const topic = deps.getTopicById(item.topicId)?.topic;
          estimatedMinutes =
            topic?.difficulty === 'Difícil' ? 120 : topic?.difficulty === 'Fácil' ? 45 : 75;
        }
        return { ...item, completed: false, estimatedMinutes, remainingMinutes: estimatedMinutes };
      });
  }

  function buildCurrentStudyPlanProposal({ guidedDefaults = false }: any = {}) {
    const state = deps.getState();
    const days = state.examDate ? diasParaRevisao(state.examDate) : null;
    const weeklyAvailableMinutes = Object.values(state.metas?.horasPorDia || {}).reduce<number>(
      (sum, hours) => sum + Math.max(0, Number(hours) || 0) * 60,
      0
    );
    const candidates = studyPlanCandidates({ guidedDefaults });
    const plan = deps.studyPlanService.calculate({
      topics: candidates,
      weeklyAvailableMinutes,
      weeksUntilExam: days === null ? 0 : Math.max(0, days / 7),
    });
    return {
      ...plan,
      examPhase: resolveExamPhase(days),
      adaptiveAdvice: buildAdaptivePlanningAdvice({
        plan,
        candidates,
        history: state.adaptivePlanningHistory || [],
        today: todayISO(),
      }),
    };
  }

  function calculateStudyPlanPreview() {
    phaseStrategyController.cancel();
    studyPlanPreview = buildCurrentStudyPlanProposal();
    renderStudyPlanBuilder();
  }

  function recordAdaptiveDecision(
    advice: Record<string, any>,
    status: string,
    planBefore: Record<string, any> | null = null,
    planAfter: Record<string, any> | null = null
  ) {
    const state = deps.getState();
    const from = advice?.from || {};
    const to = advice?.to || {};
    if (advice?.state !== 'proposal') return null;

    const changed =
      planAfter?.items?.filter(
        (item: any) =>
          item.minutes !==
          planBefore?.items?.find((previous: any) => previous.topicId === item.topicId)?.minutes
      ) || [];
    const sourceItem = changed.find((item: any) => item.subjectId === from.subjectId);
    const targetItem = changed.find((item: any) => item.subjectId === to.subjectId);

    const entry = {
      id: uid('adaptive-plan'),
      activeExamTags: [...(state.examBlueprint?.activeExamTags || [])],
      createdAt: nowISO(),
      explanationSnapshot: buildRecommendationExplanation(advice, {
        createdAt: nowISO(),
        weeklyPlannedMinutes: (planBefore || studyPlanPreview)?.weeklyPlannedMinutes,
        weeklyAvailableMinutes: (planBefore || studyPlanPreview)?.weeklyAvailableMinutes,
      }),
      sourceSubjectId: from.subjectId,
      targetSubjectId: to.subjectId,
      sourceName: from.name,
      targetName: to.name,
      minutes: advice.transferMinutes,
      sourceBefore: from.beforeMinutes,
      sourceAfter: from.afterMinutes,
      targetBefore: to.beforeMinutes,
      targetAfter: to.afterMinutes,
      reasons: [...(advice.rationale || [])],
      algorithmVersion: advice.algorithmVersion,
      status,
      planId: null as any,
      sourceTopicId: sourceItem?.topicId || null,
      targetTopicId: targetItem?.topicId || null,
      sourceItemBefore: sourceItem
        ? planBefore!.items.find((item: any) => item.topicId === sourceItem.topicId)?.minutes
        : null,
      targetItemBefore: targetItem
        ? planBefore!.items.find((item: any) => item.topicId === targetItem.topicId)?.minutes
        : null,
      sourceMixBefore: sourceItem
        ? structuredClone(
            planBefore!.items.find((item: any) => item.topicId === sourceItem.topicId)?.activityMix
          )
        : null,
      targetMixBefore: targetItem
        ? structuredClone(
            planBefore!.items.find((item: any) => item.topicId === targetItem.topicId)?.activityMix
          )
        : null,
    };
    if (!state.adaptivePlanningHistory) state.adaptivePlanningHistory = [];
    state.adaptivePlanningHistory.push(entry);
    scheduleSave();
    return entry;
  }

  function useAdaptivePlanAdvice() {
    const adjusted = applyAdaptivePlanningAdvice(
      studyPlanPreview,
      studyPlanPreview?.adaptiveAdvice
    );
    if (!adjusted) {
      showToast(
        'Não há capacidade livre suficiente nos tópicos indicados para aplicar esta sugestão.'
      );
      return;
    }
    const entry = recordAdaptiveDecision(
      studyPlanPreview.adaptiveAdvice,
      'suggested',
      studyPlanPreview,
      adjusted
    );
    adjusted.adaptiveHistoryId = entry?.id || null;
    studyPlanPreview = adjusted;
    renderStudyPlanBuilder();
  }

  function rejectAdaptivePlanAdvice() {
    if (
      studyPlanPreview?.adaptiveAdvice?.state !== 'proposal' ||
      studyPlanPreview.adaptiveAdvice.applied
    )
      return;
    recordAdaptiveDecision(studyPlanPreview.adaptiveAdvice, 'rejected');
    studyPlanPreview.adaptiveAdvice = {
      state: 'rejected',
      reason: 'Sugestão recusada. O plano calculado continua disponível para confirmação.',
    };
    renderStudyPlanBuilder();
  }

  function clearStudyPlanPreview() {
    const state = deps.getState();
    const entry = (state.adaptivePlanningHistory || []).find(
      (item: any) => item.id === studyPlanPreview?.adaptiveHistoryId && item.status === 'suggested'
    );
    if (entry) {
      entry.status = 'rejected';
      entry.decidedAt = nowISO();
      scheduleSave();
    }
    studyPlanPreview = null;
    renderStudyPlanBuilder();
  }

  function confirmStudyPlan() {
    if (
      !studyPlanPreview ||
      studyPlanPreview.state === 'insufficient' ||
      !studyPlanPreview.items?.length
    )
      return;
    if (deps.captureReadinessBeforeStrategy) {
      deps.captureReadinessBeforeStrategy('Antes de confirmar o plano semanal');
    }
    const confirmed = deps.studyPlanService.confirm({
      ...studyPlanPreview,
      examDate: deps.getState().examDate || null,
    });
    const state = deps.getState();
    const entry = (state.adaptivePlanningHistory || []).find(
      (item: any) => item.id === studyPlanPreview.adaptiveHistoryId && item.status === 'suggested'
    );
    if (entry && confirmed) {
      entry.status = 'applied';
      entry.planId = confirmed.id;
      entry.decidedAt = nowISO();
    }
    studyPlanPreview = null;
    dailyPlanPreview = null;
    scheduleSave();
    renderStudyPlanBuilder();
    showToast('Plano semanal confirmado e salvo.');
  }

  async function revertAdaptivePlanningDecision(id: string) {
    if (!deps.recoveryController) return;
    const res = await deps.recoveryController.revert(id);
    return deps.feedbackRecoveryResult ? deps.feedbackRecoveryResult(res) : res;
  }

  function calculateDailyPlanPreview() {
    const studyPlan = latestStudyPlan();
    if (!studyPlan) return;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(todayISO(), index);
      return { date, availableMinutes: Math.round(deps.metaHoursForDate(date) * 60) };
    });
    const end = days.at(-1)!.date;
    const state = deps.getState();
    const dueReviews = (state.reviewAgenda || [])
      .filter(
        (review: any) =>
          review.status !== 'Concluído' &&
          review.topicId &&
          review.date >= todayISO() &&
          review.date <= end
      )
      .map((review: any) => ({
        id: review.id,
        date: review.date,
        subjectId: review.subjectId,
        topicId: review.topicId,
        subjectName: deps.getSubjectName ? deps.getSubjectName(review.subjectId) : '',
        topicName: deps.getTopicName ? deps.getTopicName(review.topicId) : '',
        minutes: 25,
      }));

    dailyPlanPreview = deps.dailyPlanService.calculate({
      studyPlan,
      days,
      dueReviews,
      reserveRatio: 0.1,
      eligibleTopicIds: deps
        .intelligenceCandidates()
        .filter((item: any) => !item.archived && !item.blockedPrerequisites?.length)
        .map((item: any) => item.topicId),
    });
    renderStudyPlanBuilder();
  }

  function clearDailyPlanPreview() {
    dailyPlanPreview = null;
    renderStudyPlanBuilder();
  }

  function confirmDailyPlanPreview() {
    if (dailyPlanPreview?.state !== 'proposal') return;
    const studyPlan = latestStudyPlan();
    const result = deps.dailyPlanService.confirm(dailyPlanPreview, studyPlan);
    dailyPlanPreview = null;
    scheduleSave();
    renderStudyPlanBuilder();
    showToast(
      `${pluralize(result.createdItems, 'atividade')} criada${result.createdItems === 1 ? '' : 's'} no plano diário.`
    );
  }

  function undoLatestDailyPlanGeneration() {
    const studyPlan = latestStudyPlan();
    const operation = [...(studyPlan?.dailyPlanOperations || [])]
      .reverse()
      .find((item: any) => !item.undoneAt);
    if (!operation) return;
    const result = deps.dailyPlanService.undo(operation, studyPlan);
    scheduleSave();
    renderStudyPlanBuilder();
    if (deps.renderPlanoHoje) deps.renderPlanoHoje();
    showToast(
      result.protectedItems?.length
        ? `${pluralize(result.removedItems, 'atividade')} removida${result.removedItems === 1 ? '' : 's'}; itens executados foram preservados.`
        : 'Criação dos planos diários desfeita.'
    );
  }

  function renderAdaptivePlanningHistory() {
    if (!doc) return;
    const container = doc.getElementById('adaptivePlanningHistory');
    if (!container) return;
    const state = deps.getState();
    const entries = [...(state.adaptivePlanningHistory || [])].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    const labels: Record<string, string> = {
      suggested: 'Sugestão na prévia',
      applied: 'Aplicado',
      rejected: 'Recusado',
      reverted: 'Revertido',
    };
    container.innerHTML = `<details class="adaptive-history"><summary>Histórico de adaptações (${entries.length})</summary>${entries.length ? `<ol>${entries.map((item: any) => `<li><div><strong>${escapeHtml(labels[item.status] || item.status)}</strong><small>${escapeHtml(new Date(item.createdAt!).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))}</small></div><p>${escapeHtml(item.sourceName || (deps.getSubjectName ? deps.getSubjectName(item.sourceSubjectId!) : item.sourceSubjectId))} ${formatPlanMinutes(item.sourceBefore!)} → ${formatPlanMinutes(item.sourceAfter!)} · ${escapeHtml(item.targetName || (deps.getSubjectName ? deps.getSubjectName(item.targetSubjectId!) : item.targetSubjectId))} ${formatPlanMinutes(item.targetBefore!)} → ${formatPlanMinutes(item.targetAfter!)}</p><small>${escapeHtml(item.reasons?.join(' ') || 'Redistribuição proposta pelos indicadores disponíveis.')}</small>${renderRecommendationExplanation(item.explanationSnapshot!)}${item.status === 'applied' && latestStudyPlan()?.id === item.planId ? `<button class="btn ghost small" data-delegated-click="revertAdaptivePlanningDecision('${escapeAttr(item.id)}')">Reverter ajuste</button>` : ''}</li>`).join('')}</ol>` : '<p>Nenhuma decisão de adaptação registrada.</p>'}</details>`;
  }

  function renderStudyPlanBuilder() {
    if (!doc) return;
    const container = doc.getElementById('examStudyPlan');
    if (!container) return;
    const contextContainer = doc.getElementById('analysisPlanningContext');
    if (contextContainer && deps.analysisContextBanner) {
      contextContainer.innerHTML = deps.analysisContextBanner('metas');
    }
    renderAdaptivePlanningHistory();
    const latest = latestStudyPlan();

    if (!studyPlanPreview) {
      if (dailyPlanPreview) {
        const proposal = dailyPlanPreview;
        const rows = (proposal.days || [])
          .map(
            (day: any) =>
              `<div><strong>${formatDatePt(day.date)}</strong><span>${formatPlanMinutes(day.plannedMinutes)} planejados · ${formatPlanMinutes(day.flexMinutes)} livres · ${day.items.length} atividades</span></div>`
          )
          .join('');
        container.innerHTML = `<div class="study-plan-summary"><div><strong>${formatPlanMinutes(proposal.plannedMinutes)}</strong><span>Distribuição proposta</span></div><div><strong>${proposal.days.length}</strong><span>Dias utilizados</span></div><div><strong>${formatPlanMinutes(proposal.unallocatedMinutes)}</strong><span>Não alocados</span></div><div><strong>10%</strong><span>Reserva mínima</span></div></div>${proposal.state === 'proposal' ? `<div class="replan-allocations">${rows}</div><div class="study-plan-actions"><button class="btn" data-delegated-click="confirmDailyPlanPreview()">Confirmar planos diários</button><button class="btn ghost" data-delegated-click="clearDailyPlanPreview()">Cancelar</button></div>` : `<div class="upcoming-empty">${escapeHtml(proposal.reason)}</div><button class="btn ghost small" data-delegated-click="clearDailyPlanPreview()">Fechar</button>`}`;
        return;
      }
      const activeOperation = [...(latest?.dailyPlanOperations || [])]
        .reverse()
        .find((item: any) => !item.undoneAt);
      container.innerHTML = `${latest ? `<div class="confirmed-plan-note"><strong>Plano confirmado</strong><span>${new Date(latest.confirmedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · ${formatPlanMinutes(latest.weeklyPlannedMinutes)} por semana · prova em ${latest.examDate ? formatDatePt(latest.examDate) : 'data não definida'}</span></div>` : ''}${renderPhaseStrategy(phaseStrategyController.view() || currentPhaseStrategy(), { preview: phaseStrategyController.view()?.state === 'proposal', canRevert: latest?.phaseStrategy?.status === 'applied' })}<div class="study-plan-actions"><button class="btn" data-delegated-click="calculateStudyPlanPreview()">Calcular proposta semanal</button>${latest ? '<button class="btn ghost" data-delegated-click="calculateDailyPlanPreview()">Distribuir nos próximos 7 dias</button>' : ''}${activeOperation ? '<button class="btn ghost" data-delegated-click="undoLatestDailyPlanGeneration()">Desfazer última distribuição</button>' : ''}</div>`;
      return;
    }

    const plan = studyPlanPreview;
    const blockedNote = plan.blockedTopics?.length
      ? `<details class="blocked-topics-note"><summary>${plan.blockedTopics.length} tópico${plan.blockedTopics.length === 1 ? ' aguarda' : 's aguardam'} pré-requisitos</summary><p>${plan.blockedTopics
          .slice(0, 5)
          .map(
            (item: any) =>
              escapeHtml(item.topicName || item.id) +
              ' — requer ' +
              (item.prerequisites || [])
                .map((id: any) => escapeHtml(deps.getTopicName ? deps.getTopicName(id) || id : id))
                .join(', ')
          )
          .join(
            '; '
          )}${plan.blockedTopics.length > 5 ? ` · e mais ${plan.blockedTopics.length - 5}` : ''}.</p><small>Conclua a base ou reforce o domínio e recalcule a proposta.</small></details>`
      : '';

    if (plan.state === 'insufficient') {
      container.innerHTML = `<div class="upcoming-empty">Não foi possível montar o plano. Confira a data da prova, disponibilidade e carga restante dos tópicos elegíveis.</div>${blockedNote}<button class="btn ghost small" data-delegated-click="clearStudyPlanPreview()">Fechar</button>`;
      return;
    }

    const subjectRows = (plan.subjects || [])
      .map(
        (item: any) =>
          `<div><strong>${escapeHtml(item.subjectName)}</strong><span>${formatPlanMinutes(item.minutes)} por semana</span></div>`
      )
      .join('');
    const topicRows = (plan.items || [])
      .map(
        (item: any) =>
          `<div class="study-plan-topic" tabindex="-1" data-plan-topic-id="${escapeAttr(item.topicId)}"><span><strong>${escapeHtml(item.subjectName)}</strong> — ${escapeHtml(item.topicName)}<small>${escapeHtml(item.reasonSummary || 'Prioridade calculada pelos fatores disponíveis')}</small>${item.examIntelligence?.usedHistory ? `<small>Histórico validado: ${item.examIntelligence.presentExamCount} de ${item.examIntelligence.analyzedExamCount} provas · confiança ${escapeHtml(item.examIntelligence.confidenceLabel.toLowerCase())}. Impacto estimado ${Math.round(item.examImpact)}/100.</small>` : ''}</span><span>${formatPlanMinutes(item.minutes)} · prioridade ${item.score}/100${item.covered ? ' · manutenção' : ''} · teoria ${formatPlanMinutes(item.activityMix.theory)} · questões ${formatPlanMinutes(item.activityMix.questions)} · revisões ${formatPlanMinutes(item.activityMix.reviews)}</span><button type="button" class="btn ghost small" data-analysis-nav="hoje" data-subject-id="${escapeAttr(item.subjectId)}" data-topic-id="${escapeAttr(item.topicId)}">Por que é prioridade?</button></div>`
      )
      .join('');

    container.innerHTML = `<div class="study-plan-summary"><div><strong>${formatPlanMinutes(plan.weeklyAvailableMinutes)}</strong><span>Capacidade semanal</span></div><div><strong>${formatPlanMinutes(plan.weeklyNeedMinutes)}</strong><span>Necessidade semanal</span></div><div><strong>${plan.weeklyBalanceMinutes < 0 ? '-' : '+'}${formatPlanMinutes(Math.abs(plan.weeklyBalanceMinutes))}</strong><span>Saldo · ${plan.paceState === 'deficit' ? 'ritmo insuficiente' : plan.paceState === 'surplus' ? 'capacidade disponível' : 'ritmo equilibrado'}</span></div><div><strong>${formatPlanMinutes(plan.weeklyPlannedMinutes)}</strong><span>Proposta semanal</span></div></div>${plan.paceState === 'deficit' ? `<p class="context-note context-note--attention">A necessidade estimada até a prova passa a sua capacidade em ${formatPlanMinutes(Math.abs(plan.weeklyBalanceMinutes))} por semana. A proposta distribui só o que cabe na disponibilidade atual. <a class="btn ghost small" href="#metasCapacity">Revisar disponibilidade</a></p>` : ''}<div class="study-plan-confidence">Dados disponíveis: ${Math.round(plan.confidence * 100)}% · força da evidência: ${plan.evidence?.evidenceLabel?.toLowerCase() || 'não avaliada'}${plan.missingEffort?.length ? ` · ${plan.missingEffort.length} tópico${plan.missingEffort.length === 1 ? '' : 's'} sem esforço estimado` : ''}</div>${blockedNote}<p class="confidence-note">Manutenção prevista: ${formatPlanMinutes(plan.maintenanceMinutes || 0)} nesta semana. Tópicos cobertos recebem questões e revisões. A prioridade usa os mesmos fatores da recomendação de estudo.</p><div class="study-plan-subjects">${subjectRows}</div><details class="study-plan-details"><summary>Ver divisão por tópico e atividade</summary>${topicRows}</details><div class="study-plan-actions"><button class="btn" data-delegated-click="confirmStudyPlan()">Confirmar e salvar plano</button><button class="btn ghost" data-delegated-click="clearStudyPlanPreview()">Descartar proposta</button></div>`;

    const phase = plan.examPhase;
    const advice = plan.adaptiveAdvice;
    const adaptiveHtml = renderAdaptiveAllocationAdvice(advice, {
      weeklyPlannedMinutes: plan.weeklyPlannedMinutes,
      weeklyAvailableMinutes: plan.weeklyAvailableMinutes,
      formatMinutes: formatPlanMinutes,
      escapeHtml,
    });
    container.insertAdjacentHTML(
      'afterbegin',
      `${renderExamPhase(phase, { escapeHtml })}${adaptiveHtml}`
    );
  }

  return {
    latestStudyPlan,
    getStudyPlanPreview,
    getDailyPlanPreview,
    clearStudyPlanPreviewState,
    clearDailyPlanPreviewState,
    invalidatePreviews,
    studyPlanCandidates,
    buildCurrentStudyPlanProposal,
    calculateStudyPlanPreview,
    clearStudyPlanPreview,
    confirmStudyPlan,
    useAdaptivePlanAdvice,
    rejectAdaptivePlanAdvice,
    revertAdaptivePlanningDecision,
    calculateDailyPlanPreview,
    clearDailyPlanPreview,
    confirmDailyPlanPreview,
    undoLatestDailyPlanGeneration,
    currentPhaseStrategy,
    previewPhaseStrategy,
    cancelPhaseStrategy,
    confirmPhaseStrategy,
    revertPhaseStrategy,
    savePhaseStrategyResult,
    renderStudyPlanBuilder,
    renderAdaptivePlanningHistory,
    phaseStrategyController,
  };
}
