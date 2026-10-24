const TYPE_LABELS = {
  study: 'Teoria',
  review: 'Revisão',
  questions: 'Questões',
  simulation: 'Simulado',
};
const typeLabel = type => TYPE_LABELS[type] || 'Estudo';

// The pending plan item is the overview's single primary action; a different recommendation becomes one suggestion line.
export function renderPlannedAction(
  priority,
  {
    suggestion = null,
    escapeHtml,
    escapeAttr = escapeHtml,
    formatMinutes,
    timer = null,
    resumeLabel = '',
  } = {}
) {
  const next = priority?.nextItem;
  if (!next) return '';
  const own = Boolean(timer?.active && timer.planItemId === next.id);
  const button = own
    ? '<button type="button" class="btn" data-daily-resume>Retomar sessão</button>'
    : timer?.active
      ? '<button type="button" class="btn" title="Retome ou finalize a sessão em andamento antes de iniciar outra." disabled>Finalize a sessão atual</button>'
      : `<button type="button" class="btn" data-daily-start="${escapeAttr(next.id)}">Iniciar estudo</button>`;
  const matchesAction = Boolean(
    priority.action &&
    next.subjectId === priority.action.subjectId &&
    next.topicId === priority.action.topicId &&
    next.type === priority.action.activityType
  );
  const reasons = [
    ...(next.reason ? [next.reason] : matchesAction && priority.planned ? priority.reasons : []),
  ].slice(0, 3);
  const aligned =
    suggestion && suggestion.subjectId === next.subjectId && suggestion.topicId === next.topicId;
  const note =
    matchesAction || aligned
      ? '<p class="overview-action-suggestion">Prioridade principal prevista no plano.</p>'
      : suggestion
        ? `<p class="overview-action-suggestion">Sugestão fora do plano: ${escapeHtml(suggestion.subjectName)} · ${escapeHtml(suggestion.topicName)}${Number.isFinite(Number(suggestion.score)) ? ` (prioridade ${Math.round(Number(suggestion.score))}/100)` : ''}. <button class="btn ghost small" type="button" data-delegated-click="navigateKpi('hoje')">Ver por quê</button></p>`
        : '';
  return `<article class="card card--action overview-action-card${own ? ' is-in-progress' : ''}" data-decision-role="planned" data-plan-item-id="${escapeAttr(next.id)}"${suggestion?.actionId ? ` data-recommendation-action-id="${escapeAttr(suggestion.actionId)}"` : ''}><div><h3>${escapeHtml(next.subjectName || 'Disciplina')} · ${escapeHtml(next.topicName || 'Sem tópico')}</h3><p class="daily-execution-metadata"><strong>${formatMinutes(Math.ceil(next.remainingSeconds / 60))}</strong> · ${typeLabel(next.type)} · prevista no plano de hoje</p>${resumeLabel ? `<p class="overview-action-resume">Continuar de: ${escapeHtml(resumeLabel)}</p>` : ''}${own ? '<span class="active-study-status">Em andamento</span>' : ''}</div><div class="overview-action-buttons">${button}</div>${note}${reasons.length ? `<details class="daily-execution-reasons"><summary>Por que estudar isso agora?</summary><ul>${reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul></details>` : ''}</article>`;
}

export function renderDailyExecution(model, { escapeHtml, formatMinutes } = {}) {
  if (!model || model.state === 'invalid_date') return '';
  const { progress, priority } = model,
    next = priority.nextItem;
  const description = item =>
    `${escapeHtml(item.topicName || 'Sem tópico')} · ${typeLabel(item.type)} · ${formatMinutes(Math.ceil(item.remainingSeconds / 60))}`;
  const rows = items =>
    items
      .map(
        item =>
          `<li><strong>${escapeHtml(item.subjectName || 'Disciplina')}</strong> · ${description(item)}</li>`
      )
      .join('');
  const matchesAction = Boolean(
    next &&
    priority.action &&
    next.subjectId === priority.action.subjectId &&
    next.topicId === priority.action.topicId &&
    next.type === priority.action.activityType
  );
  return `<section class="daily-execution-card" aria-labelledby="dailyExecutionTitle"><h3 id="dailyExecutionTitle">Execução de hoje</h3><div class="daily-execution-summary">
    <div class="daily-execution-metrics"><div><strong>${formatMinutes(progress.plannedMinutes)}</strong><span>Planejado</span></div><div><strong>${formatMinutes(Math.round(progress.studiedMinutes))}</strong><span>Realizado hoje</span></div></div>
    ${progress.progress == null ? '' : `<p class="daily-execution-progress"><strong>${progress.progress}%</strong> de progresso do plano</p><progress value="${progress.progress}" max="100" aria-label="Progresso das atividades planejadas"></progress>`}
    <p class="daily-execution-completed">${progress.completedActivities} de ${model.items.length} atividade${model.items.length === 1 ? '' : 's'} concluída${model.items.length === 1 ? '' : 's'}</p>
    ${model.guidance ? `<p>${escapeHtml(model.guidance)}</p><button type="button" class="btn ghost small" data-delegated-click="navigateKpi('metas')">Abrir planejamento</button>` : ''}
    ${!next && model.items.length ? '<p role="status">Todas as atividades de hoje foram cumpridas.</p>' : ''}
    </div>${priority.action && !matchesAction && !priority.unplannedAction ? `<p>Recomendação estratégica: ${priority.executed ? 'executada' : priority.planned ? 'prevista no plano' : 'ainda não acomodada no plano'}.</p>` : ''}
    ${
      progress.additionalMinutes > 0 || progress.mismatchedMinutes > 0
        ? `<details class="daily-execution-context"><summary>Conferir tempo adicional e vínculos</summary>
    ${progress.additionalMinutes > 0 ? `<p class="analytics-note">${formatMinutes(Math.round(progress.additionalMinutes))} de estudo adicional, sem vínculo com uma atividade planejada.</p>` : ''}
    ${progress.mismatchedMinutes > 0 ? `<p class="context-note context-note--info">${formatMinutes(Math.round(progress.mismatchedMinutes))} com vínculo ou atividade diferente da planejada. Esse tempo não conclui a tarefa.</p>` : ''}
    </details>`
        : ''
    }
    ${model.needsPlanReview ? '<p class="context-note context-note--info">Há atividades geradas por uma versão anterior do plano semanal. Revise a distribuição após a mudança estratégica.</p>' : ''}
    ${priority.following.length ? `<details class="daily-execution-following"><summary>Depois · ${priority.following.length} ${priority.following.length === 1 ? 'atividade' : 'atividades'}</summary><ul>${rows(priority.following.slice(0, 5))}</ul>${priority.following.length > 5 ? `<details><summary>Mostrar mais</summary><ul>${rows(priority.following.slice(5))}</ul></details>` : ''}</details>` : ''}
    ${progress.pendingActivities ? `<footer class="daily-execution-footer"><span>${progress.pendingActivities} atividade${progress.pendingActivities === 1 ? '' : 's'} pendente${progress.pendingActivities === 1 ? '' : 's'}. <button type="button" class="btn ghost small" data-delegated-click="navigateKpi('hoje')">Revisar pendências</button></span></footer>` : ''}</section>`;
}
