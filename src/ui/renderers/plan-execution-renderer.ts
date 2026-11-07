import { renderStrategicExecution } from './strategic-execution-renderer.js';
import { renderColumnChart } from '../primitives/charts/charts.js';
import { renderChartFrame, renderChartTooltip } from '../chart-components.js';
import { renderEmptyState } from '../components/presentation.js';
import { renderActionCard } from '../components/analytical-presentation.js';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { WeekReconciliationSummary } from '../tabs/goals/WeekReconciliationSummary.js';
import { buildWeekReconciliation } from '../tabs/goals/week-reconciliation.js';
const fmt = (value: number) => `${Math.floor(value / 60)}h${String(value % 60).padStart(2, '0')}`;

export function renderPlanExecution(model: Record<string, any>, { formatDate }: any) {
  const range = (start: string, end: string) => `${formatDate(start).slice(0, 5)} a ${formatDate(end).slice(0, 5)}`;
  const periodLabel = model.days.length ? range(model.days[0].date, model.days.at(-1).date) : 'esta semana';
  const summary = render(
    h(WeekReconciliationSummary, {
      data: buildWeekReconciliation({
        capacityMin: model.capacityMinutes,
        plannedMin: model.plannedMinutes,
        studiedMin: model.studiedMinutes,
        periodLabel,
      }),
    })
  );
  const warning =
    model.plannedMinutes > model.capacityMinutes
      ? '<aside class="context-note context-note--attention"><strong>Atenção</strong><p>O tempo planejado nos dias supera a capacidade semanal informada. Revise a distribuição antes de confirmar novos planos.</p></aside>'
      : '';
  const unplanned =
    model.state === 'unplanned'
      ? renderActionCard({
          contentHTML: renderEmptyState({
            title: 'Você ainda não possui um plano para esta semana.',
            message: `Capacidade disponível: ${fmt(model.capacityMinutes)}. Monte o plano semanal e distribua os dias para acompanhar a execução.`,
          }),
          actions: [
            { href: '#metasPlanning', label: 'Montar planejamento', className: 'btn small' },
          ],
          className: 'plan-execution-next-step',
        })
      : '';
  const dayText = (item: any) =>
    `${formatDate(item.date).slice(0, 5)}: capacidade ${fmt(item.capacityMinutes || 0)}, ${item.plannedMinutes === null ? 'sem plano' : 'planejado ' + fmt(item.plannedMinutes)}, estudado ${item.future ? '—' : fmt(item.studiedMinutes)}`;
  const days = model.days
    .map(
      (item: any) =>
        `<li><span>${formatDate(item.date).slice(0, 5)}${item.future ? ' · futuro' : ''}</span><small>Capacidade ${fmt(item.capacityMinutes || 0)}</small><strong>${item.plannedMinutes === null ? 'Sem plano' : fmt(item.plannedMinutes)} / ${item.future ? '—' : fmt(item.studiedMinutes)}</strong></li>`
    )
    .join('');
  // Three columns per day: capacity, planned (amber only when it exceeds capacity) and studied.
  const dayChart = renderColumnChart({
    label: `Capacidade, planejado e estudado por dia: ${model.days.map(dayText).join('; ')}`,
    className: 'plan-execution-columns',
    height: 64,
    columns: model.days.flatMap((item: any, index: number) => [
      { value: item.capacityMinutes || 0, title: `${formatDate(item.date).slice(0, 5)} · capacidade ${fmt(item.capacityMinutes || 0)}`, tone: 'muted' as const, separated: index > 0 },
      { value: item.plannedMinutes || 0, title: `${formatDate(item.date).slice(0, 5)} · ${item.plannedMinutes === null ? 'sem plano' : 'planejado ' + fmt(item.plannedMinutes)}`, tone: (item.plannedMinutes || 0) > (item.capacityMinutes || 0) ? ('attention' as const) : ('soft' as const) },
      { value: item.future ? 0 : item.studiedMinutes, title: `${formatDate(item.date).slice(0, 5)} · estudado ${item.future ? '—' : fmt(item.studiedMinutes)}`, tone: 'primary' as const },
    ]),
  });
  const axis = `<div class="plan-execution-axis" aria-hidden="true">${model.days.map((item: any) => `<span>${formatDate(item.date).slice(0, 5)}</span>`).join('')}</div>`;
  const measured = model.history.filter((item: any) => item.adherence !== null);
  let trend = '';
  if (measured.length >= 2) {
    const width = 480,
      height = 136,
      max = Math.max(
        100,
        Math.ceil(Math.max(...measured.map((item: any) => item.adherence)) / 50) * 50
      );
    const x = (index: number) => 25 + (index / (measured.length - 1)) * 440,
      y = (value: number) => 104 - (value / max) * 86;
    const segments = measured
      .slice(1)
      .map(
        (item: any, index: any) =>
          `<line x1="${x(index)}" y1="${y(measured[index].adherence)}" x2="${x(index + 1)}" y2="${y(item.adherence)}"/>`
      )
      .join('');
    const points = measured
      .map(
        (item: any, index: any) =>
          `<circle cx="${x(index)}" cy="${y(item.adherence)}" r="4">${renderChartTooltip(formatDate(item.start) + ' a ' + formatDate(item.end) + ': ' + item.adherence + '% de cumprimento')}</circle>`
      )
      .join('');
    trend = `<svg class="plan-adherence-chart" aria-hidden="true" focusable="false" viewBox="0 0 ${width} ${height}"><line class="plan-adherence-grid" x1="25" x2="465" y1="${y(100)}" y2="${y(100)}"/><g class="plan-adherence-line">${segments}</g><g class="plan-adherence-point">${points}</g></svg>`;
  }
  const weeks = model.history
    .map(
      (item: any) =>
        `<li><span>${formatDate(item.start).slice(0, 5)} a ${formatDate(item.end).slice(0, 5)}</span><strong>${item.adherence === null ? 'Sem plano' : item.adherence + '%'}</strong><small>${fmt(item.studiedMinutes)} estudados${item.strategic ? ' · aderência estratégica ' + (item.strategic.strategicAdherence === null ? 'sem base' : item.strategic.strategicAdherence + '%') : ''} · ${item.plannedMinutes ? fmt(item.plannedMinutes) + ' planejados' : 'nenhum plano registrado'}</small></li>`
    )
    .join('');
  return (
    summary +
    warning +
    unplanned +
    renderStrategicExecution(model.strategic, periodLabel) +
    `<details class="metas-execution-history"><summary>Ver execução diária e histórico</summary>` +
    renderChartFrame({
      title: 'Planejado × realizado nesta semana',
      description:
        'Sessões registradas incluem estudo fora do plano. Dias sem plano permanecem sem percentual.',
      period: model.days.length
        ? formatDate(model.days[0].date) + ' a ' + formatDate(model.days.at(-1).date)
        : '',
      legend: [
        { label: 'Capacidade', tone: 'muted' },
        { label: 'Planejado', tone: 'soft' },
        { label: 'Estudado', tone: 'primary' },
      ],
      chart: dayChart + axis,
      records: '<ol class="plan-execution-days">' + days + '</ol>',
    }) +
    renderChartFrame({
      title: 'Cumprimento nas semanas concluídas',
      description:
        'Minutos estudados ÷ minutos planejados nos dias. Semanas sem plano não entram na tendência.',
      evidence: measured.length + ' semanas concluídas com plano · período atual em andamento',
      legend: [
        { label: 'Cumprimento', tone: 'primary' },
        { label: 'Referência de 100%', tone: 'target' },
      ],
      chart: trend,
      emptyMessage: 'São necessárias duas semanas concluídas com plano para mostrar a tendência.',
      records: '<ol class="plan-adherence-list">' + weeks + '</ol>',
    }) +
    '</details>'
  );
}
