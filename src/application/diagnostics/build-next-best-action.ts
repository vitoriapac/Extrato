import {
  buildStudyAction,
  recommendationActionLabel,
} from '../recommendations/recommendation-action.js';
import { diagnosticSignalLabel } from '../../domain/diagnostics/diagnostic-vocabulary.js';
import { decisionReasonCode } from './decision-reason-codes.js';

export const NEXT_BEST_ACTION_STATES = Object.freeze({
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  ACTION_OPTIONAL: 'ACTION_OPTIONAL',
  MAINTAIN_PLAN: 'MAINTAIN_PLAN',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
  NO_ELIGIBLE_ACTION: 'NO_ELIGIBLE_ACTION',
});

// The recommendation producer owns ordering and eligibility. This adapter only adds context.
export function buildNextBestAction({
  recommendations = [],
  diagnosis = null,
  activePlan = null,
  weeklyCapacityMinutes = 0,
  projection = null,
  activeExamTags = [],
  queueOrder = null,
}: any = {}) {
  const normalizedExamTags = Array.isArray(activeExamTags)
    ? activeExamTags.map(tag => String(tag).trim()).filter(Boolean).sort()
    : [];
  const examScopeKey = normalizedExamTags.join('|') || 'all';

  // A sugestão é o primeiro da fila do Diagnóstico (T11/D-A): quem está na fila vem antes, na ordem dela.
  const queue: string[] | null = Array.isArray(queueOrder)
    ? queueOrder
    : Array.isArray(diagnosis?.topics)
      ? (diagnosis.topics as Array<{ primarySignal?: string; topicId: string }>)
          .filter(row => row.primarySignal)
          .map(row => row.topicId)
      : null;
  const position = new Map((queue || []).map((id, index) => [id, index] as const));
  const rank = (item: { topicId?: string }) => position.get(item.topicId as string) ?? position.size;
  const ordered = queue ? [...recommendations].sort((a, b) => rank(a) - rank(b)) : recommendations;

  for (const recommendation of ordered) {
    const action = buildStudyAction(recommendation, { source: 'diagnosis' });
    if (
      !action ||
      !action.topicId ||
      recommendation.available === false ||
      recommendation.eligible === false ||
      recommendation.canStudy === false ||
      (recommendation.status && recommendation.status !== 'pending')
    )
      continue;
    if (
      normalizedExamTags.length > 0 &&
      Array.isArray(recommendation.examTags) &&
      recommendation.examTags.length > 0 &&
      !recommendation.examTags.some((tag: string) => normalizedExamTags.includes(String(tag).trim()))
    ) {
      continue;
    }
    const row =
      diagnosis?.topics?.find(
        (item: any) => item.subjectId === action.subjectId && item.topicId === action.topicId
      ) || null;
    const allocation = activePlan?.items?.find((item: any) => item.topicId === action.topicId);
    const projectionRisk =
      projection?.status !== 'insufficient_data'
        ? (projection?.topicRisks || []).find(
            (item: any) => item.subjectId === action.subjectId && item.topicId === action.topicId
          )
        : null;
    const projectionReason = projectionRisk
      ? `Esta lacuna de alto impacto também aparece na trajetória ${projection.status === 'at_risk' ? 'em risco' : 'que exige atenção'} até a prova. Trata-se de evidência adicional, sem alterar a prioridade calculada.`
      : null;
    const state =
      row?.state === 'attention' && ['critical', 'important'].includes(row.severity)
        ? NEXT_BEST_ACTION_STATES.ACTION_REQUIRED
        : NEXT_BEST_ACTION_STATES.ACTION_OPTIONAL;
    const structuredReason = decisionReasonCode(recommendation.decisionReasonCode);
    return {
      state,
      action,
      decisionReasonCode:
        structuredReason !== 'unknown'
          ? structuredReason
          : action.activityType === 'review'
            ? 'scheduled_review'
            : 'unknown',
      label: recommendationActionLabel(action),
      subjectName: recommendation.subjectName || row?.subjectName || 'Disciplina',
      topicName: recommendation.topicName || row?.name || 'Tópico',
      diagnosis: row ? diagnosticSignalLabel(row.primarySignal) : null,
      evidence: row?.evidence?.label || action.evidence.label || 'Não avaliada',
      reasons: [...(action.reasons || [])].slice(0, 3),
      projectionReason,
      weeklyCapacityMinutes,
      weeklyPlannedMinutes: activePlan?.weeklyPlannedMinutes ?? null,
      currentAllocationMinutes: allocation?.minutes ?? null,
      activePlanId: activePlan?.id || null,
      examScopeKey,
    };
  }
  const rows = diagnosis?.rows || [...(diagnosis?.topics || []), ...(diagnosis?.subjects || [])];
  if (rows.some((item: any) => item.state === 'attention'))
    return {
      state: NEXT_BEST_ACTION_STATES.NO_ELIGIBLE_ACTION,
      reason:
        'Há um ponto de atenção, mas nenhuma ação está elegível agora. Confira disponibilidade, pré-requisitos e o plano.',
    };
  if (rows.some((item: any) => ['controlled', 'progress'].includes(item.state)))
    return {
      state: NEXT_BEST_ACTION_STATES.MAINTAIN_PLAN,
      reason: activePlan?.id
        ? 'Nenhuma intervenção prioritária agora. Continue executando o plano atual e acompanhe as revisões.'
        : 'Nenhuma intervenção prioritária agora. Mantenha sua rotina e acompanhe as revisões.',
    };
  if (recommendations.length)
    return {
      state: NEXT_BEST_ACTION_STATES.NO_ELIGIBLE_ACTION,
      reason:
        'As recomendações atuais não estão elegíveis para execução. Revise disponibilidade e pré-requisitos.',
    };
  return {
    state: NEXT_BEST_ACTION_STATES.INSUFFICIENT_EVIDENCE,
    reason:
      'Ainda não há evidência suficiente para indicar uma ação. Registre sessões, questões e revisões vinculadas a tópicos.',
  };
}

export interface RevalidateNextBestActionInput {
  action: Record<string, any> | null | undefined;
  expectedExamScopeKey?: string | null;
  activeExamTags?: string[];
  recommendations?: Array<Record<string, any>>;
  dismissedIds?: Iterable<string>;
}

export interface RevalidateNextBestActionResult {
  valid: boolean;
  reason: string | null;
  refreshedAction: Record<string, any> | null;
}

/**
 * Revalida uma ação de recomendação no momento do clique (Ciclo 1.1),
 * impedindo execução de recomendação recusada, expirada ou de outro concurso.
 */
export function revalidateNextBestAction({
  action,
  expectedExamScopeKey = null,
  activeExamTags = [],
  recommendations = [],
  dismissedIds = [],
}: RevalidateNextBestActionInput): RevalidateNextBestActionResult {
  if (!action || !action.id || !action.topicId) {
    return { valid: false, reason: 'Ação inválida ou sem tópico associado.', refreshedAction: null };
  }

  const currentScopeKey =
    (Array.isArray(activeExamTags)
      ? activeExamTags.map(tag => String(tag).trim()).filter(Boolean).sort().join('|')
      : '') || 'all';
  if (expectedExamScopeKey && expectedExamScopeKey !== currentScopeKey) {
    return {
      valid: false,
      reason: 'O concurso ativo foi alterado. Atualize a recomendação antes de iniciar.',
      refreshedAction: null,
    };
  }

  const dismissed = new Set(Array.from(dismissedIds, id => String(id)));
  const recId = String(action.recommendationId || action.id);
  if (dismissed.has(recId) || dismissed.has(String(action.id))) {
    return {
      valid: false,
      reason: 'Esta recomendação já foi recusada ou encerrada.',
      refreshedAction: null,
    };
  }

  if (recommendations.length > 0) {
    const match = recommendations.find(rec => {
      const candidateId = String(rec.recommendationId || rec.id || '');
      return candidateId === recId || (rec.subjectId === action.subjectId && rec.topicId === action.topicId);
    });
    if (
      !match ||
      match.available === false ||
      match.eligible === false ||
      match.canStudy === false ||
      (match.status && match.status !== 'pending')
    ) {
      return {
        valid: false,
        reason: 'Esta recomendação não está mais elegível no momento.',
        refreshedAction: null,
      };
    }
    const refreshed = buildStudyAction(match, { source: action.source || 'diagnosis' });
    return { valid: Boolean(refreshed), reason: refreshed ? null : 'Ação indisponível.', refreshedAction: refreshed };
  }

  return { valid: true, reason: null, refreshedAction: action };
}
