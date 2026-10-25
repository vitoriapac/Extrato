/**
 * Controller e utilitários puros para Apresentação e Gestão de Recomendações de Estudo.
 */

export interface RecommendationItem {
  id: string;
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  score?: number;
  remainingMinutes?: number | null;
  examImpact?: number | null;
  covered?: boolean;
  completed?: boolean;
  blockedPrerequisites?: string[];
  reasons?: string[];
  evidence?: any;
  explanation?: any;
}

export interface RecommendationFeedbackItem {
  recommendationId: string;
  topicId?: string | null;
  completed?: boolean;
  useful?: boolean | null;
  accepted?: boolean;
}

export interface ExcludedCandidateState {
  id: string;
  subjectName: string;
  topicName: string;
  stateIcon: string;
  stateText: string;
}

export function buildExcludedCandidates(
  candidates: RecommendationItem[],
  visibleIds: Set<string>,
  dismissedIds: Set<string>,
  getTopicName: (id: string) => string,
  needsMaintenanceFn?: (item: RecommendationItem) => boolean
): ExcludedCandidateState[] {
  return candidates
    .filter(item => !visibleIds.has(item.id))
    .map(item => {
      if (item.blockedPrerequisites && item.blockedPrerequisites.length > 0) {
        return {
          id: item.id,
          subjectName: item.subjectName,
          topicName: item.topicName,
          stateIcon: '🔒',
          stateText:
            'Aguarda ' + item.blockedPrerequisites.map(id => getTopicName(id) || id).join(', '),
        };
      }
      if (item.completed) {
        return {
          id: item.id,
          subjectName: item.subjectName,
          topicName: item.topicName,
          stateIcon: '✓',
          stateText: 'Atividade já realizada hoje',
        };
      }
      if (item.covered && (!needsMaintenanceFn || !needsMaintenanceFn(item))) {
        return {
          id: item.id,
          subjectName: item.subjectName,
          topicName: item.topicName,
          stateIcon: '✓',
          stateText: 'Concluído e consolidado',
        };
      }
      if (item.remainingMinutes === null && !item.covered) {
        return {
          id: item.id,
          subjectName: item.subjectName,
          topicName: item.topicName,
          stateIcon: '○',
          stateText: 'Carga de estudo ainda não configurada',
        };
      }
      if (dismissedIds.has(item.id)) {
        return {
          id: item.id,
          subjectName: item.subjectName,
          topicName: item.topicName,
          stateIcon: '○',
          stateText: 'Ocultado nesta sessão',
        };
      }
      return {
        id: item.id,
        subjectName: item.subjectName,
        topicName: item.topicName,
        stateIcon: item.examImpact != null && item.examImpact < 30 ? '○' : '★',
        stateText:
          item.examImpact != null && item.examImpact < 30
            ? 'Baixa relevância configurada para a prova'
            : 'Prioridade inferior às três recomendações atuais',
      };
    })
    .slice(0, 6);
}

export function renderExcludedCandidatesHtml(
  excluded: ExcludedCandidateState[],
  escapeHtml: (s: string) => string = s => s
): string {
  if (!excluded || !excluded.length) return '';
  return `<details class="recommendation-exclusions"><summary>Por que outros tópicos não aparecem?</summary>${excluded
    .map(
      item =>
        `<div><span>${item.stateIcon}</span><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(
          item.topicName
        )}</strong><small>${escapeHtml(item.stateText)}</small></div>`
    )
    .join('')}</details>`;
}

export function renderPendingOutcomeHtml(
  feedbackList: RecommendationFeedbackItem[],
  getTopicName: (id: string) => string,
  escapeHtml: (s: string) => string = s => s,
  escapeAttr: (s: string) => string = s => s
): string {
  const pending = (feedbackList || []).find(
    feedback => feedback.completed && feedback.useful === null
  );
  if (!pending) return '';

  const label = pending.topicId
    ? `O estudo de ${escapeHtml(getTopicName(pending.topicId))} ajudou?`
    : 'Esta recomendação ajudou?';

  return `<div class="recommendation-outcome" role="group" aria-label="Avaliação do resultado da recomendação"><strong>${label}</strong><button class="btn small" data-delegated-click="rateRecommendationOutcome('${escapeAttr(
    pending.recommendationId
  )}',true)">Sim</button><button class="btn ghost small" data-delegated-click="rateRecommendationOutcome('${escapeAttr(
    pending.recommendationId
  )}',false)">Não</button></div>`;
}

export interface RecommendationHistorySummary {
  shown: number;
  accepted: number;
  completed: number;
  rated: number;
  useful: number;
  acceptanceRate: number;
  completionRate: number;
  usefulnessRate: number;
}

export function formatRecommendationHistoryLabel(summary: RecommendationHistorySummary): string {
  if (!summary || !summary.shown) return '';
  const ratedPart = summary.rated ? ` · ${summary.usefulnessRate}% úteis` : '';
  return `Histórico: ${summary.acceptanceRate}% aceitas · ${summary.completionRate ?? 0}% concluídas${ratedPart}`;
}

export interface RecommendationsControllerContext {
  getState: () => any;
  getTopicName: (id: string) => string;
  getSubjectName: (id: string) => string;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
  formatMinutes?: (minutes: number) => string;
}

export function createRecommendationsController(ctx: RecommendationsControllerContext) {
  const escapeHtml = ctx.escapeHtml || (s => s);
  const escapeAttr = ctx.escapeAttr || (s => s);

  function getPendingOutcome(): string {
    const state = ctx.getState();
    return renderPendingOutcomeHtml(
      state.recommendationFeedback || [],
      ctx.getTopicName,
      escapeHtml,
      escapeAttr
    );
  }

  function getExcluded(
    candidates: RecommendationItem[],
    visibleIds: Set<string>,
    dismissedIds: Set<string>,
    needsMaintenanceFn?: (item: RecommendationItem) => boolean
  ): ExcludedCandidateState[] {
    return buildExcludedCandidates(
      candidates,
      visibleIds,
      dismissedIds,
      ctx.getTopicName,
      needsMaintenanceFn
    );
  }

  return {
    getPendingOutcome,
    getExcluded,
    renderExcludedHtml: (excluded: ExcludedCandidateState[]) =>
      renderExcludedCandidatesHtml(excluded, escapeHtml),
    formatHistory: formatRecommendationHistoryLabel,
  };
}
