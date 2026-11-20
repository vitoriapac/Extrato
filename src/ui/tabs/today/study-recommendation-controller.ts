import { createRecommendationOutcomeRecorder } from './recommendation-outcome-recorder.js';
import { createOverviewNextActionRenderer } from './overview-next-action-renderer.js';
import { recommendStudy } from '../../../application/recommend-study.js';
import { PRIORITY_ALGORITHM_VERSION } from '../../../domain/analytics/priority-score.js';
import {
  canReuseRecommendationPresentation,
  createRecommendationPresentation,
  rateRecommendationFeedback,
  summarizeRecommendationFeedback,
} from '../../../application/recommendations/recommendation-feedback.js';
import {
  reusableRecommendationRecord,
  syncRecommendationHistory,
} from '../../../application/recommendations/recommendation-history.js';
import { buildRecommendationOutcomeViewModel } from '../../../application/recommendations/build-recommendation-outcome-view-model.js';
import {
  buildStudyAction,
  recommendationActionKind,
  recommendationActionLabel,
} from '../../../application/recommendations/recommendation-action.js';
import { revalidateNextBestAction } from '../../../application/diagnostics/build-next-best-action.js';
import { createRecommendationController } from '../../../application/recommendations/recommendation-controller.js';
import { createReplanController } from '../../../application/planning/replan-controller.js';
import { renderIconSvg } from '../../primitives/icon.js';
import { renderReplanProposal } from '../../../features/replan/replan-renderer.js';
import {
  buildExcludedCandidates,
  renderExcludedCandidatesHtml,
  renderPendingOutcomeHtml,
  formatRecommendationHistoryLabel,
} from '../../controllers/recommendations-controller.js';
import {
  renderPlanRecommendationChoice,
  renderPlanRecommendationExtras,
} from '../../renderers/next-best-action-renderer.js';
import { buildPriorityViewModel } from '../../view-models/priority-view-model.js';
import { buildRecommendationExplanation } from '../../../application/recommendations/build-recommendation-explanation.js';
import { renderRecommendationExplanation } from '../../renderers/recommendation-explanation-renderer.js';
import { buildStudyStrategy } from '../../../domain/recommendations/study-strategy.js';
import { capturePlanPriority } from '../../../domain/planning/plan-priority-snapshot.js';

export interface StudyRecommendationControllerDeps {
  document: any;
  getState: () => any;
  metaHoursToday: () => number;
  intelligenceCandidates: () => any[];
  todayISO: () => string;
  nowISO: () => string;
  uid: (prefix?: string) => string;
  localDateISO: (d?: any) => string;
  formatPlanMinutes: (m: number) => string;
  formatDatePt: (d: string) => string;
  escapeHtml: (s: string) => string;
  escapeAttr: (s: string) => string;
  pluralize: (n: number, s: string, p?: string) => string;
  showToast: (msg: string) => void;
  showPrompt: (msg: string, opts: any, cb: (res: string) => void) => void;
  scheduleSave: () => void;
  renderRecommendationHistorySummary: () => void;
  getTopicName: (id: string) => string;
  getSubjectName: (id: string) => string;
  getTopicById: (id: string) => any;
  getTopicPerformance: (id: string) => any;
  needsMaintenance: (topic: any) => boolean;
  activeTopics: () => any[];
  dailyExecutionController: { build: (action?: any) => any };
  hasStartedStudyTimer: () => boolean;
  activeTimerMatchesRecommendation: (item: any) => boolean;
  renderActiveStudyTimerNotice: (item?: any) => string;
  openStudyTimerFocus: () => void;
  topicResumeLabel: (topicId: string) => string;
  guidedStudyService: { next: (payload: any) => void; start: () => void };
  todayDailyStudyPlan: () => any;
  freezePlanExecution: (item: any, ctx: any) => void;
  startPlannedActivity: (planItemId: string) => void;
  addQuestaoRow: (payload: any) => any;
  activateTab: (tab: string) => void;
  reviewService: { createManualReview: (payload: any) => any };
  completeAgendaReview: (reviewId: string) => void;
  validQuestionRecords: () => any[];
  renderFinalStretchBanner: () => void;
  renderAlertasInteligentes: () => void;
  renderPlanoHoje: () => void;
  replanService: any;
  planningRepository: any;
  metaHoursForDate: (date: string) => number;
  startOfWeek: (iso: string) => string;
  addDays: (iso: string, n: number) => string;
  diasParaRevisao: (date: string) => number | null;
  localDateFromTimestamp: (ts: any) => string;
}

export function createStudyRecommendationController(deps: StudyRecommendationControllerDeps) {
  const {
    document,
    getState,
    metaHoursToday,
    intelligenceCandidates,
    todayISO,
    nowISO,
    uid,
    localDateISO,
    formatPlanMinutes,
    formatDatePt,
    escapeHtml,
    escapeAttr,
    pluralize,
    showToast,
    showPrompt,
    scheduleSave,
    renderRecommendationHistorySummary,
    getTopicName,
    getSubjectName,
    getTopicById,
    needsMaintenance,
    activeTopics,
    dailyExecutionController,
    hasStartedStudyTimer,
    activeTimerMatchesRecommendation,
    renderActiveStudyTimerNotice,
    openStudyTimerFocus: _openStudyTimerFocus,
    guidedStudyService,
    todayDailyStudyPlan,
    freezePlanExecution,
    startPlannedActivity,
    addQuestaoRow,
    activateTab,
    reviewService,
    completeAgendaReview,
    renderFinalStretchBanner,
    renderAlertasInteligentes,
    renderPlanoHoje,
    replanService,
    planningRepository,
    metaHoursForDate,
    startOfWeek,
    addDays,
  } = deps;

  const dismissedRecommendationIds = new Set<string>();
  let currentStudyRecommendations: any[] = [];

  function getDismissedRecommendationIds() {
    return dismissedRecommendationIds;
  }

  function getCurrentRecommendations() {
    return currentStudyRecommendations;
  }

  function setCurrentRecommendations(recs: any[]) {
    currentStudyRecommendations = recs;
  }

  const { recommendationBaseline, recordRecommendationFeedback, measureRecommendationResults } =
    createRecommendationOutcomeRecorder(deps);

  const { renderOverviewNextAction } = createOverviewNextActionRenderer({
    ...deps,
    getCurrentRecommendations,
  });

  function renderRecommendationImpact(model: Record<string, any>) {
    if (!model.available) return '';
    const metrics = model.metrics
      .map(
        (metric: any) =>
          `<div><span>${escapeHtml(metric.label)}</span><strong>${metric.before} → ${metric.after}</strong><small class="${metric.delta >= 0 ? 'positive' : 'negative'}">${metric.delta >= 0 ? '+' : ''}${metric.delta} ${metric.key === 'risk' ? 'de melhora' : metric.key === 'mastery' ? 'pontos' : 'p.p.'}</small></div>`
      )
      .join('');
    const reasons = model.reasons.length
      ? `<small class="recommendation-impact-reasons">${escapeHtml(model.reasons.join(' · '))}</small>`
      : '';
    return `<section class="recommendation-impact ${escapeAttr(model.state)}"><header><span>Resultado da recomendação</span><strong>${escapeHtml(model.title)}</strong><small>Evidência da medição: ${escapeHtml((model.confidenceLabel || 'não calculada').toLowerCase())} · ${model.questionVolume} questões</small></header><div class="recommendation-impact-metrics">${metrics || '<p>Indicadores comparáveis ainda indisponíveis.</p>'}</div>${reasons}</section>`;
  }

  function refreshStudyRecommendationItems({
    recordHistory = true,
  }: { recordHistory?: boolean } = {}) {
    const state = getState();
    const availableMinutes = Math.max(0, Math.round(metaHoursToday() * 60));
    const candidates = intelligenceCandidates();
    const previous = new Map(currentStudyRecommendations.map(item => [item.id, item]));
    currentStudyRecommendations = recommendStudy(candidates, {
      availableMinutes,
      excludedIds: [...dismissedRecommendationIds],
    }).map(item => {
      const old = previous.get(item.id);
      const record = state.recommendationHistory.find(
        (entry: any) => entry.id === old?.recommendationId
      );
      const reusablePresentation = canReuseRecommendationPresentation(old, item, {
        record,
        today: todayISO(),
        activeExamTags: state.examBlueprint.activeExamTags || [],
        toLocalDate: localDateISO,
      });
      const presentation = reusablePresentation
        ? createRecommendationPresentation(item, {
            id: old.recommendationId,
            shownAt: old.shownAt,
            algorithmVersion: PRIORITY_ALGORITHM_VERSION,
          })
        : (() => {
            const reusable = reusableRecommendationRecord(
              state.recommendationHistory,
              item,
              todayISO(),
              state.examBlueprint.activeExamTags || []
            );
            return createRecommendationPresentation(item, {
              id: reusable?.id || uid('recommendation'),
              shownAt: reusable?.createdAt || nowISO(),
              algorithmVersion: PRIORITY_ALGORITHM_VERSION,
            });
          })();
      return { ...presentation, activeExamTags: [...(state.examBlueprint.activeExamTags || [])] };
    });
    if (
      recordHistory &&
      syncRecommendationHistory(state.recommendationHistory, currentStudyRecommendations, {
        now: nowISO(),
        today: todayISO(),
        idGenerator: uid,
        activeExamTags: state.examBlueprint.activeExamTags || [],
      })
    ) {
      scheduleSave();
      renderRecommendationHistorySummary();
    }
    return { availableMinutes, candidates };
  }

  function renderPendingRecommendationOutcome() {
    const state = getState();
    return renderPendingOutcomeHtml(
      state.recommendationFeedback,
      getTopicName,
      escapeHtml,
      escapeAttr
    );
  }

  function renderOverviewDecisionArea() {
    const { availableMinutes } = refreshStudyRecommendationItems();
    renderFinalStretchBanner();
    renderOverviewNextAction(availableMinutes);
    renderAlertasInteligentes();
  }

  function renderStudyRecommendation() {
    const container = document.getElementById('studyRecommendation');
    if (!container) return;
    const state = getState();
    const { availableMinutes, candidates } = refreshStudyRecommendationItems();
    renderOverviewNextAction(availableMinutes);
    const visible = currentStudyRecommendations.slice(0, 3);
    const summary = summarizeRecommendationFeedback(state.recommendationFeedback),
      impact = renderRecommendationImpact(
        buildRecommendationOutcomeViewModel(state.recommendationFeedback)
      );
    const outcome = impact + renderPendingRecommendationOutcome();
    const history = summary.shown
      ? `<small class="recommendation-history">${formatRecommendationHistoryLabel(summary)}</small>`
      : '';
    const visibleIds = new Set(visible.map(item => item.id));
    const excluded = buildExcludedCandidates(
      candidates,
      visibleIds,
      dismissedRecommendationIds,
      getTopicName,
      needsMaintenance
    );
    const excludedHtml = renderExcludedCandidatesHtml(excluded, escapeHtml);
    if (!visible.length) {
      const hasContent = activeTopics().length > 0,
        tab = availableMinutes < 15 || !hasContent ? 'metas' : 'disciplinas',
        label =
          availableMinutes < 15
            ? 'Ajustar disponibilidade'
            : !hasContent
              ? 'Configurar disciplinas e tópicos'
              : 'Revisar elegibilidade e pré-requisitos';
      const message =
        availableMinutes < 15
          ? 'Defina pelo menos 15 minutos disponíveis para hoje.'
          : !hasContent
            ? 'Cadastre ou importe disciplinas e tópicos para gerar uma recomendação.'
            : 'Não há atividade elegível agora. Confira pré-requisitos, esforço e itens já concluídos.';
      container.innerHTML = `${renderActiveStudyTimerNotice(null)}${outcome}<div class="empty-state empty-state--compact recommendation-empty-state" role="status"><strong>Nenhuma recomendação disponível</strong><p>${escapeHtml(message)}</p><button class="btn ghost small" data-delegated-click="navigateKpi('${tab}')">${escapeHtml(label)}</button></div>${excludedHtml}${history}`;
      return;
    }
    const dailyPriority = dailyExecutionController.build().priority;
    const cards = visible.map((item, index) => {
      const action = buildStudyAction(item, { source: 'today' }),
        model = buildPriorityViewModel(item, index + 1),
        label = recommendationActionLabel(action!),
        minutes =
          action!.suggestedMinutes == null
            ? 'Tempo não estimado'
            : formatPlanMinutes(action!.suggestedMinutes);
      // A mesma tarefa já tem o "Iniciar" do Plano de hoje como ação principal.
      const sameAsPlan =
        dailyPriority?.nextItem?.subjectId === item.subjectId &&
        dailyPriority?.nextItem?.topicId === item.topicId;
      const effectiveMinutesLabel =
        sameAsPlan && Number(dailyPriority?.nextItem?.plannedMinutes) > 0
          ? `${formatPlanMinutes(dailyPriority!.nextItem!.plannedMinutes)} no plano de hoje`
          : minutes;
      const inProgress = activeTimerMatchesRecommendation(item),
        blocked = hasStartedStudyTimer() && !inProgress,
        sessionLabel = state.activeTimer?.isRunning ? 'Cronômetro rodando' : 'Sessão pausada';
      const contributionRows = model.contributionRows
        .map(
          row =>
            `<div><span>${escapeHtml(row.label)}</span><span class="contribution-track"><i style="width:${Math.min(100, row.value * 4)}%"></i></span><strong>+${row.value}</strong></div>`
        )
        .join('');
      const stateIconName =
        {
          review: 'refresh',
          limited: 'alert-triangle',
          high: 'star',
          calculated: 'circle',
          blocked: 'lock',
        }[model.state] || 'circle';
      const stateIconHtml = renderIconSvg(stateIconName, {
        size: 12,
        className: 'inline-block align-middle',
      });
      const planChoice =
          index === 0
            ? renderPlanRecommendationChoice(action!, dailyPriority!, {
                escapeHtml,
                escapeAttr,
                withExtras: false,
              })
            : '',
        planExtras = planChoice ? renderPlanRecommendationExtras(action!, { escapeAttr }) : '';
      const actionButton = inProgress
        ? `<button class="btn" data-delegated-click="openStudyTimerFocus()">Retomar sessão</button>`
        : blocked
          ? '<button class="btn" disabled title="Retome ou finalize a sessão em andamento antes de iniciar outra.">Finalize a sessão atual</button>'
          : `<button class="btn ${planChoice || sameAsPlan ? 'ghost' : index > 0 ? 'tonal' : ''}" data-delegated-click="executeStudyRecommendation('${escapeAttr(action!.id)}','${action!.source}')">${escapeHtml(planChoice ? 'Estudar como atividade adicional' : label)}</button>`;
      return `<article class="study-recommendation ${index === 0 ? 'is-primary' : ''} ${inProgress ? 'is-in-progress' : ''}" data-study-action-source="${action!.source}" data-study-action-id="${escapeAttr(action!.id)}" data-activity-type="${action!.activityType}"><div class="priority-score-gauge" style="--priority:${model.score}"><strong>${model.score}</strong><span>/100</span></div><div class="recommendation-content"><span class="recommendation-rank">${planChoice ? 'Fora do plano de hoje · ' : sameAsPlan ? 'Alinhada ao 1º item do plano de hoje · ' : ''}#${model.position} entre as sugestões${index === 0 && visible[1] && Math.round(Number(visible[1].score)) === Math.round(Number(item.score)) ? ` · empate técnico com a 2ª sugestão (${Math.round(Number(item.score))})` : ''}</span><h4>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</h4><strong>${escapeHtml(item.action || 'Estudar agora')}</strong><p>${effectiveMinutesLabel}${item.recommendedQuestions ? ` · ${pluralize(item.recommendedQuestions, 'questão', 'questões')}` : ''} · ${stateIconHtml} ${escapeHtml(model.stateLabel)}</p>${inProgress ? `<span class="active-study-status">Em andamento · ${sessionLabel}</span>` : ''}<div class="priority-reasons">${action!.reasons
        .slice(0, 4)
        .map(reason => `<span>+ ${escapeHtml(reason)}</span>`)
        .join(
          ''
        )}</div>${renderRecommendationExplanation(item.explanation || buildRecommendationExplanation(item))}<details class="recommendation-explanation"><summary>Prova × Você · composição da prioridade</summary><p><strong>Prova:</strong> ${escapeHtml(model.examExplanation)}</p><p><strong>Você:</strong> ${escapeHtml(model.personalExplanation)}</p><p><strong>Ação:</strong> ${escapeHtml(label)}</p><p>Dados disponíveis: ${model.completeness}% · força da evidência: ${escapeHtml(action!.evidence.label || model.evidenceLabel).toLowerCase()}. Algoritmo v${action!.algorithmVersion || item.algorithmVersion}.</p><div class="recommendation-contributions">${contributionRows}<div class="recommendation-total"><span>Prioridade final</span><strong>${action!.priority ?? model.score}/100</strong></div></div>${item.missingFactors.length ? `<small>${item.missingFactors.length} fator${item.missingFactors.length === 1 ? '' : 'es'} sem dados; os pesos disponíveis foram redistribuídos.</small>` : ''}</details></div><div class="recommendation-actions">${planChoice}${actionButton}<details class="recommendation-more-options"><summary>Outras opções</summary><div class="recommendation-more-actions">${planExtras}<button class="btn ghost small" data-delegated-click="dismissStudyRecommendation('${escapeAttr(item.id)}')">Trocar</button><button class="btn ghost small" data-delegated-click="markRecommendationNotUseful('${escapeAttr(item.id)}')">Não foi útil</button></div></details></div></article>`;
    });
    const moreCards = cards.slice(1).join(''),
      moreRecommendations = moreCards
        ? `<details class="study-recommendation-more"><summary>Ver outras ${cards.length - 1} prioridades</summary><div class="study-recommendation-list">${moreCards}</div></details>`
        : '';
    // Só a sugestão e a pergunta pendente ficam à vista; o contexto da sugestão fica recolhido.
    container.innerHTML = `${renderActiveStudyTimerNotice(visible[0])}${cards[0]}${moreRecommendations}${renderPendingRecommendationOutcome()}<details class="recommendation-context editorial-disclosure"><summary>Resultado anterior, capacidade e histórico</summary>${impact}<div class="recommendation-capacity"><strong>${formatPlanMinutes(availableMinutes)}</strong><span> disponíveis hoje · ${visible.length} ${visible.length === 1 ? 'prioridade elegível' : 'prioridades elegíveis'}</span></div>${excludedHtml}${history}</details>`;
  }

  function dismissStudyRecommendation(id: string) {
    const recommendation = currentStudyRecommendations.find(item => item.id === id);
    if (!recommendation) return;
    showPrompt(
      'Por que trocar esta recomendação?',
      {
        label: 'Motivo opcional',
        placeholder: 'Ex.: não tenho tempo hoje',
        confirmLabel: 'Trocar',
        required: false,
      },
      (reason: string) => {
        recordRecommendationFeedback(recommendation, {
          accepted: false,
          reasonSkipped: reason?.trim() || 'swapped',
        });
        dismissedRecommendationIds.add(id);
        scheduleSave();
        renderStudyRecommendation();
      }
    );
  }

  function markRecommendationNotUseful(id: string) {
    const recommendation = currentStudyRecommendations.find(item => item.id === id);
    if (recommendation) {
      const feedback = recordRecommendationFeedback(recommendation, {
        accepted: false,
        reasonSkipped: 'not_useful',
      });
      feedback.useful = false;
      scheduleSave();
    }
    dismissedRecommendationIds.add(id);
    renderStudyRecommendation();
  }

  function rateRecommendationOutcome(recommendationId: string, useful: boolean) {
    const state = getState();
    if (
      rateRecommendationFeedback(state.recommendationFeedback, recommendationId, {
        useful,
        ratedAt: nowISO(),
      })
    ) {
      scheduleSave();
      renderStudyRecommendation();
      showToast('Obrigado. Esse retorno melhora a avaliação das recomendações.');
    }
  }

  function startStudyRecommendation(id: string, source = 'today') {
    const state = getState();
    const recommendation = currentStudyRecommendations.find(
      item => item.id === id || item.recommendationId === id
    );
    if (!recommendation) return;
    const fresh = recommendStudy(intelligenceCandidates(), {
      availableMinutes: Math.round(metaHoursToday() * 60),
    }).find(
      item =>
        item.id === id || item.recommendationId === id || item.topicId === recommendation.topicId
    );
    if (!fresh) {
      renderStudyRecommendation();
      showToast('As condições mudaram. Confira a recomendação atual.');
      return;
    }
    Object.assign(recommendation, fresh);
    const recommendedType = recommendationActionKind(recommendation);
    guidedStudyService.next({ id, source, type: recommendedType });
    guidedStudyService.start();
    recommendation.strategy = buildStudyStrategy(recommendation, {
      availableMinutes: recommendation.estimatedMinutes,
    });
    recordRecommendationFeedback(recommendation, { accepted: true, source });
    let plan = todayDailyStudyPlan();
    if (!plan) {
      plan = {
        id: uid('plan'),
        date: todayISO(),
        availableMinutes: Math.round(metaHoursToday() * 60),
        plannedMinutes: 0,
        flexMinutes: 0,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        items: [],
      };
      state.dailyPlans.push(plan);
    }
    let item = plan.items.find(
      (candidate: any) =>
        candidate.topicId === recommendation.topicId &&
        !['completed', 'skipped'].includes(candidate.status)
    );
    if (item) {
      item.recommendationId = recommendation.recommendationId;
      item.type = recommendation.studyType || item.type || 'study';
    }
    if (!item) {
      item = {
        id: uid('plan-item'),
        subjectId: recommendation.subjectId,
        topicId: recommendation.topicId,
        subjectName: recommendation.subjectName,
        topicName: recommendation.topicName,
        type: recommendation.studyType || 'study',
        plannedMinutes: recommendation.estimatedMinutes,
        executedSeconds: 0,
        status: 'planned',
        sessionIds: [],
        score: recommendation.score,
        tier: recommendation.score >= 70 ? 'Alta' : recommendation.score >= 40 ? 'Média' : 'Baixa',
        position: plan.items.length + 1,
        statusIcon: 'target',
        statusLabel: 'Recomendação inteligente',
        prioritySnapshot: capturePlanPriority(recommendation, {
          capturedAt: nowISO(),
          algorithmVersion: state.algorithmVersions.recommendations,
        }),
        reason: (recommendation.reasons || []).join(' · '),
        action: recommendation.action,
        recommendedQuestions: 0,
        originalDate: todayISO(),
        currentDate: todayISO(),
        rescheduleCount: 0,
        skippedReason: null,
        recommendationId: recommendation.recommendationId,
        createdAt: nowISO(),
      };
      freezePlanExecution(item, {
        date: todayISO(),
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        capturedAt: nowISO(),
      });
      plan.items.push(item);
      plan.plannedMinutes += item.plannedMinutes;
      plan.updatedAt = nowISO();
      scheduleSave();
    }
    Object.assign(state.activeTimer, {
      recommendationId: recommendation.recommendationId || recommendation.id,
      recommendationSource: source,
      recommendationType: recommendedType,
      prioritySnapshot: Number.isFinite(Number(recommendation.score))
        ? Number(recommendation.score)
        : null,
      strategy: structuredClone(recommendation.strategy),
      strategyStep: 0,
    });
    startPlannedActivity(item.id);
  }

  const recommendationController = createRecommendationController({
    getRecommendations: () => currentStudyRecommendations,
    actionKind: recommendationActionKind,
    onQuestions: (
      recommendation: Record<string, any>,
      kind: string,
      context: { source?: string } = {}
    ) => {
      const feedback = recordRecommendationFeedback(recommendation, {
          accepted: true,
          source: context.source,
        }),
        question = addQuestaoRow({
          subjectId: recommendation.subjectId,
          topicId: recommendation.topicId,
          recommendationId: recommendation.recommendationId,
        });
      feedback.actionKind = kind;
      feedback.resultingQuestionId = question.id;
      scheduleSave();
      activateTab('questoes');
      showToast('Registro de questões aberto e vinculado à recomendação.');
      return question;
    },
    onReview: (
      recommendation: Record<string, any>,
      kind: string,
      context: { source?: string } = {}
    ) => {
      const state = getState();
      const feedback = recordRecommendationFeedback(recommendation, {
        accepted: true,
        source: context.source,
      });
      let review = state.reviewAgenda.find(
        (item: any) =>
          (item.topicId || item.topicRef) === recommendation.topicId && item.status !== 'Concluído'
      );
      if (!review)
        review = reviewService.createManualReview({
          subjectId: recommendation.subjectId,
          topicId: recommendation.topicId,
          date: todayISO(),
          suggestedDate: todayISO(),
          baseIntervalDays: 1,
          adaptive: true,
          manualDate: false,
          tipo: 'Revisão livre',
        });
      feedback.actionKind = kind;
      feedback.resultingReviewId = review!.id;
      scheduleSave();
      activateTab('agenda');
      completeAgendaReview(review!.id);
      return review;
    },
    onPrerequisite: (
      recommendation: Record<string, any>,
      kind: string,
      context: { source?: string } = {}
    ) => {
      const blocker = getTopicById(recommendation.blockedPrerequisites?.[0]);
      if (!blocker) return null;
      const feedback = recordRecommendationFeedback(recommendation, {
        accepted: true,
        source: context.source,
      });
      feedback.actionKind = kind;
      feedback.targetTopicId = blocker.topic.id;
      scheduleSave();
      activateTab('disciplinas');
      showToast(`Pré-requisito selecionado: ${blocker.subject.name} — ${blocker.topic.name}.`);
      return blocker.topic;
    },
    onStudy: (
      recommendation: Record<string, any>,
      _kind: string,
      context: { source?: string } = {}
    ) =>
      startStudyRecommendation(
        recommendation.id || recommendation.recommendationId,
        context.source
      ),
  });

  function executeStudyRecommendation(id: string, source = 'today') {
    const state = getState();
    const dismissedIds = (state.recommendationFeedback || [])
      .filter((fb: any) => fb?.decision === 'dismissed' || fb?.decision === 'rejected')
      .map((fb: any) => String(fb.recommendationId || fb.id || ''))
      .filter(Boolean);

    const dailyPriority = dailyExecutionController?.build?.()?.priority;
    if (
      dailyPriority?.unplannedAction &&
      (dailyPriority.action?.id === id || dailyPriority.action?.recommendationId === id)
    ) {
      const check = revalidateNextBestAction({
        action: dailyPriority.action,
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        dismissedIds,
      });
      if (!check.valid) {
        showToast(check.reason || 'Recomendação indisponível no contexto atual.');
        return false;
      }
      return startStudyRecommendation(id, source);
    }
    return recommendationController.execute(id, { source });
  }

  const replanController = createReplanController({
    service: replanService,
    repository: planningRepository,
    getState,
    clock: { today: todayISO, startOfWeek, addDays },
    getDailyCapacity: (date: string) => metaHoursForDate(date) * 60,
    onChanged: renderWeeklyReplan,
    onConfirmed: (result: any) => {
      scheduleSave();
      renderWeeklyReplan();
      renderPlanoHoje();
      showToast(
        `${pluralize(result?.createdItems || 0, 'atividade')} redistribuída${result?.createdItems === 1 ? '' : 's'} para os próximos dias.`
      );
    },
    onUndone: (result: Record<string, any>) => {
      scheduleSave();
      renderWeeklyReplan();
      renderPlanoHoje();
      showToast(
        result.protectedItems.length
          ? 'Itens já executados foram preservados; os demais retornaram à origem.'
          : 'Redistribuição desfeita com segurança.'
      );
    },
  });

  function calculateReplanPreview() {
    return replanController.calculate();
  }
  function clearReplanPreview() {
    return replanController.clear();
  }
  function confirmReplan() {
    return replanController.confirm();
  }
  function undoPlanAdjustment(id: string) {
    return replanController.undo(id);
  }

  function renderWeeklyReplan() {
    const container = document.getElementById('weeklyReplan');
    if (!container) return;
    const state = getState();
    const latest = [...(state.planAdjustments || [])].sort((a, b) =>
      (b.confirmedAt || '').localeCompare(a.confirmedAt || '')
    )[0];
    const preview = replanController.view();
    if (!preview) {
      container.innerHTML = `${latest ? `<div class="confirmed-plan-note"><strong>Último ajuste ${latest.undoneAt ? 'desfeito' : 'aplicado'}</strong><span>${formatPlanMinutes(latest.redistributedMinutes!)} redistribuídos · ${formatPlanMinutes(latest.discardedMinutes!)} sem capacidade</span></div>` : ''}<div class="study-plan-actions"><button class="btn ghost" data-delegated-click="calculateReplanPreview()">${renderIconSvg('refresh', { size: 14, className: 'icon-inline' })} Redistribuir saldo pendente</button>${latest && !latest.undoneAt && latest.status !== 'undone' && latest.changes?.length ? `<button class="btn ghost" data-delegated-click="undoPlanAdjustment('${latest.id}')">Desfazer redistribuição</button>` : ''}</div>`;
      return;
    }
    if (preview.state === 'balanced') {
      container.innerHTML =
        '<div class="upcoming-empty">Sua semana está em equilíbrio. Não há déficit de execução nos planos registrados nesta semana.</div><button class="btn ghost small" data-delegated-click="clearReplanPreview()">Fechar</button>';
      return;
    }
    container.innerHTML = `${renderReplanProposal(preview, { escapeHtml, formatDate: formatDatePt, formatMinutes: formatPlanMinutes, subjectName: getSubjectName, topicName: getTopicName })}<div class="study-plan-actions">${preview.allocations.length ? `<button class="btn" data-delegated-click="confirmReplan()">${renderIconSvg('check', { size: 14, className: 'icon-inline' })}Confirmar redistribuição da semana real</button>` : ''}<button class="btn ghost" data-delegated-click="clearReplanPreview()">${preview.allocations.length ? 'Cancelar' : 'Fechar'}</button></div>`;
  }

  return {
    getDismissedRecommendationIds,
    getCurrentRecommendations,
    setCurrentRecommendations,
    renderRecommendationImpact,
    refreshStudyRecommendationItems,
    renderPendingRecommendationOutcome,
    renderOverviewNextAction,
    renderOverviewDecisionArea,
    renderStudyRecommendation,
    recommendationBaseline,
    recordRecommendationFeedback,
    measureRecommendationResults,
    dismissStudyRecommendation,
    markRecommendationNotUseful,
    rateRecommendationOutcome,
    startStudyRecommendation,
    executeStudyRecommendation,
    recommendationController,
    replanController,
    calculateReplanPreview,
    clearReplanPreview,
    confirmReplan,
    undoPlanAdjustment,
    renderWeeklyReplan,
  };
}
