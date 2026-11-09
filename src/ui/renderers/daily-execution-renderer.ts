import { renderRingGauge } from '../primitives/charts/charts.js';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { PlannedActionCard } from '../tabs/dashboard/PlannedActionCard.js';

const TYPE_LABELS: Record<string, any> = {
  study: 'Teoria',
  review: 'Revisão',
  questions: 'Questões',
  simulation: 'Simulado',
};
const typeLabel = (type: string) => TYPE_LABELS[type] || 'Estudo';

// The pending plan item is the overview's single primary action; a different recommendation becomes one suggestion line.
export function renderPlannedAction(
  priority: Record<string, any>,
  {
    suggestion = null,
    formatMinutes,
    timer = null,
    resumeLabel = '',
  }: any = {}
) {
  const next = priority?.nextItem;
  if (!next) return '';
  const own = Boolean(timer?.active && timer.planItemId === next.id);
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
  return render(h(PlannedActionCard, {
    next, own, blocked: Boolean(timer?.active && !own),
    minutes: formatMinutes(Math.ceil(next.remainingSeconds / 60)),
    typeLabel: typeLabel(next.type), reasons, suggestion,
    aligned: Boolean(aligned), matchesAction, resumeLabel,
  }));
}

export function renderDailyExecution(
  model: Record<string, any>,
  { escapeHtml, formatMinutes }: any = {}
) {
  if (!model || model.state === 'invalid_date') return '';
  const { progress, priority } = model,
    next = priority.nextItem;
  const description = (item: Record<string, any>) =>
    `${escapeHtml(item.topicName || 'Sem tópico')} · ${typeLabel(item.type)} · ${formatMinutes(Math.ceil(item.remainingSeconds / 60))}`;
  const rows = (items: any[]) =>
    items
      .map(
        (item: any) =>
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
    <div class="daily-execution-metrics"><div><strong>${formatMinutes(progress.plannedMinutes)}</strong><span>Plano de hoje</span></div><div><strong>${formatMinutes(Math.round(progress.studiedMinutes))}</strong><span>Estudado hoje</span></div></div>
    ${progress.progress == null ? '' : `<div class="daily-execution-progress">${renderRingGauge({ value: progress.progress, label: 'Progresso das atividades planejadas', size: 44, stroke: 7, showValue: false })}<p><strong>${formatMinutes(Math.round(progress.plannedMinutes - progress.remainingMinutes))} de ${formatMinutes(progress.plannedMinutes)}</strong> do plano · ${progress.progress}%</p></div>`}
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
    ${model.needsPlanReview ? '<p class="context-note context-note--info">Há atividades que não estão vinculadas ao plano semanal atual. Elas foram preservadas; revise a distribuição em Planejamento.</p>' : ''}
    ${priority.following.length ? `<details class="daily-execution-following"><summary>Depois · ${priority.following.length} ${priority.following.length === 1 ? 'atividade' : 'atividades'}</summary><ul>${rows(priority.following.slice(0, 5))}</ul>${priority.following.length > 5 ? `<details><summary>Mostrar mais</summary><ul>${rows(priority.following.slice(5))}</ul></details>` : ''}</details>` : ''}
    ${progress.pendingActivities ? `<footer class="daily-execution-footer"><span>${progress.pendingActivities} atividade${progress.pendingActivities === 1 ? '' : 's'} pendente${progress.pendingActivities === 1 ? '' : 's'}. <button type="button" class="btn ghost small" data-delegated-click="navigateKpi('hoje')">Revisar pendências</button></span></footer>` : ''}</section>`;
}
