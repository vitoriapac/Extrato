import { renderColumnChart } from '../primitives/charts/charts.js';
import { renderChartFrame } from '../chart-components.js';

interface WeekPoint {
  start: string;
  end: string;
  plannedMinutes: number;
  studiedMinutes: number;
}

const WEEKS_SHOWN = 4;

/** Estudado e agendado nas últimas 4 semanas concluídas; a tabela fica em "Ver dados". */
export function renderWeeklyCloseTrend({
  history = [],
  formatMinutes,
  formatDate,
  escapeHtml,
}: {
  history?: WeekPoint[];
  formatMinutes: (minutes: number) => string;
  formatDate: (iso: string) => string;
  escapeHtml: (value: unknown) => string;
}) {
  const weeks = history
    .filter(item => (item.studiedMinutes || 0) > 0 || (item.plannedMinutes || 0) > 0)
    .slice(-WEEKS_SHOWN);
  const short = (iso: string) => formatDate(iso).slice(0, 5);
  const name = (item: WeekPoint) => `${short(item.start)} a ${short(item.end)}`;
  const empty = weeks.length < 2;
  const chart = empty
    ? ''
    : renderColumnChart({
        label: `Agendado e estudado nas últimas ${weeks.length} semanas: ${weeks
          .map(
            item =>
              `${name(item)}, ${formatMinutes(item.plannedMinutes)} agendados e ${formatMinutes(item.studiedMinutes)} estudados`
          )
          .join('; ')}`,
        className: 'weekly-close-trend',
        height: 72,
        columns: weeks.flatMap((item, index) => [
          {
            value: item.plannedMinutes || 0,
            title: `${name(item)} · agendado ${formatMinutes(item.plannedMinutes)}`,
            tone: 'soft' as const,
            separated: index > 0,
          },
          {
            value: item.studiedMinutes || 0,
            title: `${name(item)} · estudado ${formatMinutes(item.studiedMinutes)}`,
            tone: 'primary' as const,
          },
        ]),
      });
  const axis = empty
    ? ''
    : `<div class="weekly-close-trend-axis" aria-hidden="true">${weeks
        .map(item => `<span>${escapeHtml(short(item.start))}</span>`)
        .join('')}</div>`;
  const rows = weeks
    .map(
      item =>
        `<tr><th scope="row">${escapeHtml(name(item))}</th><td>${escapeHtml(formatMinutes(item.plannedMinutes))}</td><td>${escapeHtml(formatMinutes(item.studiedMinutes))}</td></tr>`
    )
    .join('');
  return renderChartFrame({
    title: 'Últimas 4 semanas',
    description: 'Minutos agendados e estudados em cada semana concluída.',
    legend: [
      { label: 'Agendado', tone: 'soft' },
      { label: 'Estudado', tone: 'primary' },
    ],
    chart: chart + axis,
    emptyMessage: 'São necessárias duas semanas concluídas com estudo ou plano para mostrar a tendência.',
    records: empty
      ? ''
      : `<details class="chart-frame__data"><summary>Ver dados</summary><table class="plan-execution-table"><caption class="sr-only">Minutos agendados e estudados por semana</caption><thead><tr><th scope="col">Semana</th><th scope="col">Agendado</th><th scope="col">Estudado</th></tr></thead><tbody>${rows}</tbody></table></details>`,
  });
}

/** Sinais da semana em lista curta: o que funcionou e o que pede revisão. */
export function renderWeeklySignals({
  worked = [],
  attention = [],
  outcomesCount = 0,
  escapeHtml,
}: {
  worked?: string[];
  attention?: string[];
  outcomesCount?: number;
  escapeHtml: (value: unknown) => string;
}) {
  const items = [
    ...worked.slice(0, 2).map(text => ({ tone: 'ok', label: 'Funcionou', text })),
    ...attention.slice(0, 3).map(text => ({ tone: 'attention', label: 'Revisar', text })),
  ];
  if (outcomesCount > 0)
    items.push({
      tone: 'neutral',
      label: 'Decisões anteriores',
      text: `${outcomesCount} ${outcomesCount === 1 ? 'resultado medido' : 'resultados medidos'} desde o último fechamento.`,
    });
  return `<section class="weekly-signals" aria-labelledby="weeklySignalsTitle"><h4 id="weeklySignalsTitle">Sinais da semana</h4>${
    items.length
      ? `<ul class="weekly-signals__list">${items
          .map(
            item =>
              `<li class="weekly-signals__item is-${item.tone}"><b>${escapeHtml(item.label)}</b> ${escapeHtml(item.text)}</li>`
          )
          .join('')}</ul>`
      : '<p class="weekly-close-empty">Sem evidência suficiente para destacar um sinal nesta semana.</p>'
  }</section>`;
}
