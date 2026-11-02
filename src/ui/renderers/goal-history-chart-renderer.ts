import { renderColumnChart } from '../primitives/charts/charts.js';

const METRICS = [
  { label: 'Tópicos concluídos', value: 'topicsConcl', ok: 'semanalOk', target: 'semanal' },
  { label: 'Questões resolvidas', value: 'questoesResolved', ok: 'questoesOk', target: 'questoesSemanal' },
  { label: 'Simulados', value: 'simuladosCount', ok: 'simuladosOk', target: 'simuladosSemanal' },
] as const;

/**
 * One column chart per weekly goal, oldest week first, with the goal as a dashed line.
 * Closed weeks below the goal take the attention tone and the caption counts them in text;
 * the current week stays neutral because it is still open.
 */
export function renderGoalHistoryCharts(
  weeks: Array<Record<string, any>> = [],
  metas: Record<string, any> = {},
  { formatDate = (iso: string) => iso }: { formatDate?: (iso: string) => string } = {}
) {
  if (!weeks.length) return '';
  const ordered = [...weeks].reverse();
  const charts = METRICS.map(metric => {
    const target = Math.max(0, Number(metas[metric.target]) || 0);
    const closed = ordered.filter(week => !week.current);
    const met = closed.filter(week => week[metric.ok]).length;
    const caption = !target
      ? 'sem meta definida'
      : closed.length
        ? `${met} de ${closed.length} ${closed.length === 1 ? 'semana encerrada' : 'semanas encerradas'} na meta`
        : 'nenhuma semana encerrada ainda';
    const columns = ordered.map(week => {
      const value = Number(week[metric.value]) || 0;
      return {
        value,
        title: `${formatDate(week.weekStart)}: ${value}${target ? ` de ${target}` : ''}${week.current ? ' (em andamento)' : ''}`,
        tone: week.current ? ('muted' as const) : target && !week[metric.ok] ? ('attention' as const) : ('primary' as const),
      };
    });
    const label = `${metric.label} por semana${target ? `, meta ${target}` : ''}: ${columns.map(column => column.title).join('; ')}. ${caption}.`;
    return `<figure class="goal-history-chart"><figcaption><strong>${metric.label}</strong><span class="${target && met < closed.length ? 'is-below' : ''}">${caption}</span></figcaption>${renderColumnChart({ columns, label, target: target || undefined, height: 40 })}</figure>`;
  }).join('');
  return `<div class="goal-history-charts">${charts}</div><p class="goal-history-legend">Da semana de ${formatDate(ordered[0].weekStart)} (à esquerda) até a atual (coluna clara). Linha tracejada: meta semanal.</p>`;
}
