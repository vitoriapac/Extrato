import { NEXT_BEST_ACTION_STATES } from '../../application/diagnostics/build-next-best-action.js';
import { formatStudyMinutes as formatPlanMinutes } from '../format-study-time.js';

const minutes = (value: number | null | undefined) =>
  value == null ? 'Não estimado' : formatPlanMinutes(value);
export function renderNextBestAction(
  model: Record<string, any>,
  { escapeHtml, escapeAttr, dailyPriority = null }: any
) {
  const actionable = [
    NEXT_BEST_ACTION_STATES.ACTION_REQUIRED,
    NEXT_BEST_ACTION_STATES.ACTION_OPTIONAL,
  ].includes(model.state);
  if (!actionable)
    return `<section class="next-best-action" aria-label="Sugestão do diagnóstico" data-action-state="${escapeAttr(model.state)}"><span class="diagnostic-kicker">SUGESTÃO DO DIAGNÓSTICO</span><h4>${escapeHtml(({ MAINTAIN_PLAN: 'Manter o plano', INSUFFICIENT_EVIDENCE: 'Reunir evidências', NO_ELIGIBLE_ACTION: 'Nenhuma ação elegível agora' } as Record<string, any>)[model.state] || 'Sugestão do diagnóstico indisponível')}</h4><p>${escapeHtml(model.reason)}</p></section>`;
  const action = model.action;
  const outside = Boolean(dailyPriority?.unplannedAction && dailyPriority.action?.id === action.id);
  const optional = outside || model.state === NEXT_BEST_ACTION_STATES.ACTION_OPTIONAL;
  // Seguir o plano ou dispensar a sugestão se decide no cartão "Sugestão de estudo" de Hoje; aqui só a explicação.
  const planChoice =
    outside && !dailyPriority?.nextItem
      ? '<p class="context-note">Não há atividade pendente elegível no plano atual.</p>'
      : '';
  return `<section class="next-best-action" aria-label="Sugestão do diagnóstico" data-decision-role="recommendation" data-action-state="${escapeAttr(model.state)}"><span class="diagnostic-kicker">${outside ? 'SUGESTÃO DO DIAGNÓSTICO · FORA DO PLANO' : optional ? 'SUGESTÃO DO DIAGNÓSTICO' : 'SUGESTÃO DO DIAGNÓSTICO'}</span><h4>${escapeHtml(model.label)} · ${escapeHtml(model.topicName)}</h4><p>${escapeHtml(model.subjectName)} · ${minutes(action.suggestedMinutes)}</p><p><strong>Por quê?</strong> ${escapeHtml([model.diagnosis, ...model.reasons].filter(Boolean).join(' · ') || 'Prioridade calculada pelos dados disponíveis.')}</p>${model.projectionReason ? `<details class="limits-disclosure"><summary>Também na projeção até a prova</summary><p class="context-note context-note--info">${escapeHtml(model.projectionReason)}</p></details>` : ''}<p class="diagnostic-quality">Evidência: ${escapeHtml(model.evidence)}</p><p class="next-best-action__plan">${model.activePlanId ? `Plano confirmado: ${minutes(model.currentAllocationMinutes)} neste tópico · ${minutes(model.weeklyPlannedMinutes)} planejados por semana.` : 'Nenhum plano semanal confirmado para comparar esta ação.'} Capacidade semanal: ${minutes(model.weeklyCapacityMinutes)}.</p>${planChoice}<div class="diagnostic-row-buttons"><button class="btn ${optional ? 'ghost ' : ''}small" type="button" data-study-action-source="${escapeAttr(action.source)}" data-study-action-id="${escapeAttr(action.id)}" data-activity-type="${escapeAttr(action.activityType)}" data-delegated-click="executeStudyRecommendation('${escapeAttr(action.id)}','${escapeAttr(action.source)}')">${escapeHtml(outside ? 'Estudar como atividade adicional' : model.label)}</button><button class="btn ghost small" type="button" data-next-best-preview="${escapeAttr(action.id)}">Pré-visualizar no plano</button><button class="btn ghost small" type="button" data-performance-jump="subjects" data-performance-subject-id="${escapeAttr(action.subjectId)}" data-performance-topic-id="${escapeAttr(action.topicId)}">Ver evolução</button></div></section>`;
}

export function renderPlanRecommendationChoice(
  action: Record<string, any>,
  priority: Record<string, any>,
  { escapeHtml, escapeAttr, withExtras = true }: any
) {
  if (!priority?.unplannedAction || priority.action?.id !== action.id) return '';
  const item = priority.nextItem;
  const planTopic = item
    ? `${item.subjectName || 'Disciplina'} · ${item.topicName || 'Tópico'}`
    : '';
  // O cartão fala da sugestão; o plano é outra atividade, então o texto diz qual é antes do botão.
  // Com borda, não sólido: a ação principal de Hoje é a do plano, que já tem o seu botão em "Plano de hoje".
  return (
    '<section class="plan-recommendation-choice" aria-label="Plano e sugestão"><p class="context-note">Sugestão do diagnóstico fora do Plano de hoje.' +
    (item ? ' O plano segue com ' + escapeHtml(planTopic) + '.' : '') +
    '</p>' +
    (item
      ? '<button class="btn ghost" type="button" data-daily-start="' +
        escapeAttr(item.id) +
        '" aria-label="' +
        escapeAttr('Seguir plano de hoje: ' + planTopic) +
        '">Seguir plano de hoje</button>'
      : '<p>Não há atividade pendente elegível no plano atual.</p>') +
    (withExtras ? renderPlanRecommendationExtras(action, { escapeAttr }) : '') +
    '</section>'
  );
}
// Secondary plan-choice actions, kept separate so the study card can tuck them under "Outras opções".
export function renderPlanRecommendationExtras(action: Record<string, any>, { escapeAttr }: any) {
  return (
    '<button class="btn ghost small" type="button" data-next-best-preview="' +
    escapeAttr(action.id) +
    '">Pré-visualizar no plano</button><button class="btn ghost small" type="button" data-ignore-outside-suggestion>Dispensar esta sugestão agora</button>'
  );
}
