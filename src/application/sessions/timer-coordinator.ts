/**
 * Coordenador de casos de uso do cronômetro de estudos e ciclo de vida de sessões.
 *
 * Gerencia a ativação de atividades planejadas, encerramento de atividades em andamento,
 * formatação temporal de cronômetro e montagem de registros de sessão.
 *
 * Camada: Application (sem manipulação de DOM).
 */

import { formatBookmarkLabel, normalizeTopicBookmark } from '../../domain/topic-bookmark.js';

export const SESSION_BOOKMARK_FIELDS = Object.freeze({
  resourceType: 'sessionBookmarkType',
  label: 'sessionBookmarkLabel',
  currentUnit: 'sessionBookmarkCurrent',
  totalUnits: 'sessionBookmarkTotal',
  positionText: 'sessionBookmarkPosition',
});

/**
 * Formata um total de segundos em representação visual amigável:
 * 'MM:SS' para durações menores que 1 hora, ou 'HH:MM:SS' para durações iguais ou superiores.
 */
export function formatTimer(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return h > 0 ? `${String(h).padStart(2, '0')}:${m}:${s}` : `${m}:${s}`;
}

export interface DailyPlanItemMatch {
  plan: { id: string; updatedAt?: string | null; items: any[] };
  item: { id: string; status: string; executedSeconds: number; [key: string]: any };
}

/**
 * Localiza um item de planejamento diário específico através dos planos do estado.
 */
export function findDailyPlanItem(
  dailyPlans: Array<{ id: string; updatedAt?: string | null; items: any[] }>,
  itemId: string
): DailyPlanItemMatch | null {
  if (!itemId || !Array.isArray(dailyPlans)) return null;
  for (const plan of dailyPlans) {
    const item = plan.items?.find((candidate: any) => candidate.id === itemId);
    if (item) return { plan, item };
  }
  return null;
}

/**
 * Libera um item de plano diário ativo quando o cronômetro é zerado ou trocado,
 * atualizando seu status para 'partial' (se houve execução prévia) ou 'planned'.
 */
export function releaseActivePlanItem(
  dailyPlans: Array<{ id: string; updatedAt?: string | null; items: any[] }>,
  planItemId: string | null | undefined,
  nowISO: () => string
): boolean {
  if (!planItemId) return false;
  const found = findDailyPlanItem(dailyPlans, planItemId);
  if (found && found.item.status === 'in_progress') {
    found.item.status = found.item.executedSeconds > 0 ? 'partial' : 'planned';
    found.plan.updatedAt = nowISO();
    return true;
  }
  return false;
}

export interface StartPlannedActivityParams {
  itemId: string;
  dailyPlans: any[];
  executionItems: Array<{ id: string; remainingSeconds: number }>;
  activeTimer: Record<string, any>;
  nowISO: () => string;
  getSubjectById: (id: string) => any;
}

export interface StartPlannedActivityResult {
  ok: boolean;
  reason?: string;
  subjectId?: string | null;
  topicId?: string | null;
  planItemId?: string;
  targetMinutes?: number;
  strategy?: any;
  prioritySnapshot?: any;
}

/**
 * Valida e prepara a transição para iniciar uma atividade planejada no cronômetro.
 */
export function preparePlannedActivityStart(
  params: StartPlannedActivityParams
): StartPlannedActivityResult {
  const { itemId, dailyPlans, executionItems, activeTimer, nowISO, getSubjectById } = params;
  const found = findDailyPlanItem(dailyPlans, itemId);
  if (!found) {
    return { ok: false, reason: 'Esta atividade não está mais disponível no plano.' };
  }

  const execution = executionItems.find(item => item.id === itemId);
  if (!execution || execution.remainingSeconds <= 0) {
    return { ok: false, reason: 'Esta atividade não está disponível para iniciar.' };
  }

  // Libera qualquer item anterior ativo
  if (activeTimer.planItemId && activeTimer.planItemId !== itemId) {
    releaseActivePlanItem(dailyPlans, activeTimer.planItemId, nowISO);
  }

  found.item.status = 'in_progress';
  found.plan.updatedAt = nowISO();

  const subject = found.item.subjectId ? getSubjectById(found.item.subjectId) : null;
  const targetMinutes = Math.max(1, Math.round(execution.remainingSeconds / 60));

  return {
    ok: true,
    subjectId: subject ? subject.id : null,
    topicId: found.item.topicId || null,
    planItemId: found.item.id,
    targetMinutes,
    strategy: found.item.strategy || null,
    prioritySnapshot: found.item.prioritySnapshot ?? null,
  };
}

export interface BuildSessionRecordInput {
  timerSeconds: number;
  timerStartedAt: string | null;
  activeTimer: Record<string, any>;
  formValues: {
    subjectId: string | null;
    topicId: string | null;
    type: string;
    resolved: number;
    correct: number;
    perceivedRetention: string | null;
    perceivedDifficulty: string | null;
    focusLevel: string | null;
    energyLevel: string | null;
    notes: string;
  };
  nowISO: () => string;
  localDateFromTimestamp: (ts?: string | number | null) => string | null;
  uid: (prefix: string) => string;
}

/**
 * Constrói o registro imutável da sessão concluída para persistência no repositório.
 */
export function buildCompletedSessionRecord(input: BuildSessionRecordInput) {
  const {
    timerSeconds,
    timerStartedAt,
    activeTimer,
    formValues,
    nowISO,
    localDateFromTimestamp,
    uid,
  } = input;

  const startedAt = timerStartedAt || nowISO();
  const endedAt = nowISO();
  const date = localDateFromTimestamp(startedAt);

  return {
    id: uid('session'),
    startedAt,
    endedAt,
    date,
    durationSeconds: timerSeconds,
    subjectId: formValues.subjectId,
    topicId: formValues.topicId,
    type: formValues.type,
    questionsResolved: formValues.resolved,
    correctAnswers: Math.min(formValues.correct, formValues.resolved),
    perceivedRetention: formValues.perceivedRetention,
    perceivedDifficulty: formValues.perceivedDifficulty,
    focusLevel: formValues.focusLevel,
    energyLevel: formValues.energyLevel,
    notes: formValues.notes,
    planItemId: activeTimer.planItemId || null,
    recommendationId: activeTimer.recommendationId || null,
    recommendationSource: activeTimer.recommendationSource || null,
    recommendationType: activeTimer.recommendationType || null,
    prioritySnapshot: activeTimer.prioritySnapshot ?? null,
  };
}

/**
 * Obtém o rótulo descritivo do ponto de parada (bookmark) de um tópico.
 */
export function topicResumeLabel(
  topicId: string | null | undefined,
  findTopic: (id: string) => { topic: { bookmark?: any } } | null
): string {
  if (!topicId) return '';
  const found = findTopic(topicId);
  return found ? formatBookmarkLabel(found.topic.bookmark) : '';
}

export interface ResolveSessionBookmarkParams {
  topicId: string | null;
  endedAt: string;
  isCleared: boolean;
  fieldValues: Record<string, string>;
  currentBookmark: any;
}

/**
 * Decide se o bookmark deve ser removido, atualizado ou preservado.
 */
export function resolveSessionBookmark(
  params: ResolveSessionBookmarkParams
): { shouldUpdate: boolean; nextBookmark: any } {
  const { topicId, endedAt, isCleared, fieldValues, currentBookmark } = params;
  if (!topicId) return { shouldUpdate: false, nextBookmark: null };

  if (isCleared) {
    return { shouldUpdate: Boolean(currentBookmark), nextBookmark: null };
  }

  const next = normalizeTopicBookmark({
    ...fieldValues,
    updatedAt: endedAt,
  });

  if (!next) return { shouldUpdate: false, nextBookmark: null };

  const normalizedCurrent = currentBookmark ? normalizeTopicBookmark(currentBookmark) : null;
  const isIdentical =
    normalizedCurrent &&
    Object.keys(SESSION_BOOKMARK_FIELDS).every(
      field => (normalizedCurrent as Record<string, any>)[field] === (next as Record<string, any>)[field]
    );

  if (isIdentical) {
    return { shouldUpdate: false, nextBookmark: currentBookmark };
  }

  return { shouldUpdate: true, nextBookmark: next };
}
