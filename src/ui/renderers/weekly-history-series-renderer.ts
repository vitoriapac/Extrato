import { renderColumnChart } from '../primitives/charts/charts.js';
import { renderChartFrame } from '../chart-components.js';


interface GoalWeek {
  weekStart: string;
  weekEnd: string;
  current?: boolean;
  beforeStart?: boolean;
  semanalOk?: boolean;
  questoesOk?: boolean;
  simuladosOk?: boolean;
}

const GOALS = [
  { ok: 'semanalOk', target: 'semanal' },
  { ok: 'questoesOk', target: 'questoesSemanal' },
  { ok: 'simuladosOk', target: 'simuladosSemanal' },
] as const;

/**
 * Uma série semanal para o Histórico: agendado e estudado por semana, com as metas cumpridas
 * como marca embaixo de cada semana. A semana em andamento fica separada e tracejada, sem se
 * ligar às encerradas; os números dela vêm do mesmo cálculo do Resumo da semana.
 */
export function renderWeeklyHistorySeries({
  execution,
  goalWeeks = [],
  metas = {},
  formatMinutes,
  formatDate,
  escapeHtml,
}: {
  execution: { history?: any[]; days?: any[]; plannedMinutes?: number; studiedMinutes?: number };
  goalWeeks?: GoalWeek[];
  metas?: Record<string, any>;
  formatMinutes: (minutes: number) => string;
  formatDate: (iso: string) => string;
  escapeHtml: (value: unknown) => string;
}) {
  const closed = new Map((execution.history || []).map(item => [item.start, item]));
  const currentStart = execution.days?.[0]?.date;
  const targets = GOALS.filter(goal => Number(metas[goal.target]) > 0);
  const weeks = [...goalWeeks]
    .reverse()
    .filter(week => !week.beforeStart)
    .map(week => {
      const source = week.current
        ? { plannedMinutes: execution.plannedMinutes || 0, studiedMinutes: execution.studiedMinutes || 0 }
        : closed.get(week.weekStart);
      return {
        label: `${formatDate(week.weekStart).slice(0, 5)} a ${formatDate(week.weekEnd).slice(0, 5)}`,
        short: formatDate(week.weekStart).slice(0, 5),
        current: Boolean(week.current) || week.weekStart === currentStart,
        planned: Math.round(source?.plannedMinutes || 0),
        studied: Math.round(source?.studiedMinutes || 0),
        met: targets.filter(goal => week[goal.ok]).length,
      };
    })
    .filter(week => week.current || week.planned > 0 || week.studied > 0);
  const hasClosed = weeks.some(week => !week.current);
  const marks = (week: (typeof weeks)[number]) =>
    !targets.length
      ? '—'
      : week.current
        ? 'em andamento'
        : `${week.met}/${targets.length}`;
  const columns = weeks.flatMap((week, index) => [
    {
      value: week.planned,
      title: `${week.label} · agendado ${formatMinutes(week.planned)}${week.current ? ' (em andamento)' : ''}`,
      tone: 'soft' as const,
      separated: index > 0 && (week.current || weeks[index - 1].current),
      dashed: week.current,
    },
    {
      value: week.studied,
      title: `${week.label} · estudado ${formatMinutes(week.studied)}${week.current ? ' (em andamento)' : ''}`,
      tone: 'primary' as const,
      dashed: week.current,
    },
  ]);
  const chart = hasClosed
    ? renderColumnChart({
        label: `Agendado e estudado por semana: ${weeks
          .map(
            week =>
              `${week.label}, ${formatMinutes(week.planned)} agendados e ${formatMinutes(week.studied)} estudados${week.current ? ' (em andamento)' : ''}`
          )
          .join('; ')}.`,
        className: 'weekly-history-series__chart',
        height: 72,
        columns,
      }) +
      `<ol class="weekly-history-series__marks" style="--weeks:${weeks.length}" aria-hidden="true">${weeks
        .map(
          week =>
            `<li class="${week.current ? 'is-current' : ''}"><span>${escapeHtml(week.short)}</span><b>${escapeHtml(marks(week))}</b></li>`
        )
        .join('')}</ol>`
    : '';
  const rows = weeks
    .map(
      week =>
        `<tr><th scope="row">${escapeHtml(week.label)}${week.current ? ' · em andamento' : ''}</th><td>${escapeHtml(formatMinutes(week.planned))}</td><td>${escapeHtml(formatMinutes(week.studied))}</td><td>${targets.length ? (week.current ? '—' : `${week.met} de ${targets.length}`) : 'sem metas'}</td></tr>`
    )
    .join('');
  return renderChartFrame({
    title: 'Histórico semanal',
    description:
      'Minutos agendados e estudados em cada semana. Embaixo, as metas semanais cumpridas (tópicos, questões e simulados).',
    legend: [
      { label: 'Agendado', tone: 'soft' },
      { label: 'Estudado', tone: 'primary' },
    ],
    chart,
    emptyMessage:
      'As semanas encerradas aparecem aqui à medida que você agenda e registra estudo.',
    records: hasClosed
      ? `<details class="chart-frame__data"><summary>Ver dados</summary><table class="plan-execution-table"><caption class="sr-only">Agendado, estudado e metas cumpridas por semana</caption><thead><tr><th scope="col">Semana</th><th scope="col">Agendado</th><th scope="col">Estudado</th><th scope="col">Metas cumpridas</th></tr></thead><tbody>${rows}</tbody></table></details>`
      : '',
  });
}
