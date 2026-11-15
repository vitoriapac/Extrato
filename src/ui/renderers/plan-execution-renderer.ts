import { renderStrategicExecution } from './strategic-execution-renderer.js';
import { renderColumnChart } from '../primitives/charts/charts.js';
import { renderChartFrame } from '../chart-components.js';
import { renderEmptyState } from '../components/presentation.js';
import { renderActionCard } from '../components/analytical-presentation.js';
import { h } from 'preact';
import { formatPlanMinutes } from '../../core/format-duration.js';
import { render } from 'preact-render-to-string';
import { WeekReconciliationSummary } from '../tabs/goals/WeekReconciliationSummary.js';
import { buildWeekReconciliationFromExecution } from '../tabs/goals/week-reconciliation.js';
const fmt = formatPlanMinutes;

export function renderPlanExecution(model: Record<string, any>, { formatDate }: any) {
  const range = (start: string, end: string) =>
    `${formatDate(start).slice(0, 5)} a ${formatDate(end).slice(0, 5)}`;
  const periodLabel = model.days.length
    ? range(model.days[0].date, model.days.at(-1).date)
    : 'esta semana';
  const summary = render(
    h(WeekReconciliationSummary, { data: buildWeekReconciliationFromExecution(model, formatDate) })
  );
  const unplanned =
    model.state === 'unplanned'
      ? renderActionCard({
          contentHTML: renderEmptyState({
            title: 'Você ainda não possui um plano para esta semana.',
            message: `${model.capacityInformed === false ? 'Informe as horas por dia e m' : `Capacidade disponível: ${fmt(model.capacityMinutes)}. M`}onte o plano semanal e distribua os dias para acompanhar a execução.`,
          }),
          actions: [
            { href: '#metasPlanning', label: 'Montar planejamento', className: 'btn ghost small' },
          ],
          className: 'plan-execution-next-step',
        })
      : '';
  const dayText = (item: any) =>
    `${formatDate(item.date).slice(0, 5)}: capacidade ${fmt(item.capacityMinutes || 0)}, ${item.plannedMinutes === null ? 'sem tarefa marcada' : 'com tarefa marcada ' + fmt(item.plannedMinutes)}, estudado ${item.future ? '—' : fmt(item.studiedMinutes)}`;
  const dayRows = model.days
    .map(
      (item: any) =>
        `<tr><th scope="row">${formatDate(item.date).slice(0, 5)}${item.future ? ' · futuro' : ''}</th><td>${fmt(item.capacityMinutes || 0)}</td><td>${item.plannedMinutes === null ? 'Sem tarefa marcada' : fmt(item.plannedMinutes)}</td><td>${item.future ? '—' : item.studiedMinutes ? fmt(item.studiedMinutes) : 'Sem estudo'}</td></tr>`
    )
    .join('');
  const daysTable = `<details class="chart-frame__data"><summary>Ver dados</summary><table class="plan-execution-table"><caption class="sr-only">Capacidade, tarefa marcada e estudado por dia</caption><thead><tr><th scope="col">Dia</th><th scope="col">Capacidade</th><th scope="col">Com tarefa marcada</th><th scope="col">Estudado</th></tr></thead><tbody>${dayRows}</tbody></table></details>`;
  // Hoje é o último dia que já começou; os dias por vir ficam esmaecidos.
  const todayIndex = model.days.reduce(
    (last: number, item: any, index: number) => (item.future ? last : index),
    -1
  );
  // Three columns per day: capacity, planned (amber only when it exceeds capacity) and studied.
  const dayChart = renderColumnChart({
    label: `Capacidade, tarefa marcada e estudado por dia: ${model.days.map(dayText).join('; ')}`,
    className: 'plan-execution-columns',
    height: 64,
    columns: model.days.flatMap((item: any, index: number) => [
      {
        value: item.capacityMinutes || 0,
        title: `${formatDate(item.date).slice(0, 5)} · capacidade ${fmt(item.capacityMinutes || 0)}`,
        tone: 'muted' as const,
        separated: index > 0,
        faded: item.future,
      },
      {
        value: item.plannedMinutes || 0,
        title: `${formatDate(item.date).slice(0, 5)} · ${item.plannedMinutes === null ? 'sem tarefa marcada' : 'com tarefa marcada ' + fmt(item.plannedMinutes)}`,
        faded: item.future,
        tone:
          (item.plannedMinutes || 0) > (item.capacityMinutes || 0)
            ? ('attention' as const)
            : ('soft' as const),
      },
      {
        value: item.future ? 0 : item.studiedMinutes,
        title: `${formatDate(item.date).slice(0, 5)} · estudado ${item.future ? '—' : fmt(item.studiedMinutes)}`,
        tone: 'primary' as const,
        faded: item.future,
      },
    ]),
  });
  const axis = `<div class="plan-execution-axis" aria-hidden="true">${model.days.map((item: any, index: number) => `<span${index === todayIndex ? ' class="is-today"' : item.future ? ' class="is-future"' : ''}>${formatDate(item.date).slice(0, 5)}${index === todayIndex ? '<small>hoje</small>' : ''}</span>`).join('')}</div>`;
  // Sem plano, sem estudo e sem semanas medidas, o histórico só repetiria zeros: o bloco não aparece.
  const showHistory = !(
    model.state === 'unplanned' &&
    !(model.studiedMinutes || 0) &&
    !model.history.some((item: any) => item.adherence !== null)
  );
  const dailyChart = showHistory
    ? renderChartFrame({
        title: 'Estudo por dia nesta semana',
        description:
          'Sessões registradas incluem estudo fora do plano. Dias sem tarefa marcada permanecem sem percentual.',
        period: model.days.length
          ? formatDate(model.days[0].date) + ' a ' + formatDate(model.days.at(-1).date)
          : '',
        legend: [
          { label: 'Capacidade', tone: 'muted' },
          { label: 'Com tarefa marcada', tone: 'soft' },
          { label: 'Estudado', tone: 'primary' },
        ],
        chart: dayChart + axis,
        records: daysTable,
      })
    : '';
  // Sem plano e sem estudo, o Resumo e o Replanejamento só mostrariam zeros: o CSS os esconde por este marcador.
  const emptyMarker =
    model.state === 'unplanned' && !(model.studiedMinutes || 0)
      ? '<span class="plan-execution--empty" hidden></span>'
      : '';
  return (
    emptyMarker +
    summary +
    unplanned +
    renderStrategicExecution(model.strategic, periodLabel) +
    dailyChart
  );
}
