import { formatStudyMinutes } from '../format-study-time.js';

export interface WeeklyPlanRecord {
  start: string;
  plannedMinutes: number;
  studiedMinutes: number;
  inProgress?: boolean;
}

export interface PlannedVsActualChartOptions {
  formatDate: (dateStr: string) => string;
  escapeHtml: (text: string) => string;
}

export function renderPlannedVsActualChart(
  weekly: WeeklyPlanRecord[],
  { formatDate, escapeHtml }: PlannedVsActualChartOptions
): string {
  if (!weekly || !weekly.length) return '';

  const validWeeks = weekly.filter(w => w.plannedMinutes > 0 || w.studiedMinutes > 0);
  if (!validWeeks.length) return '';

  const width = 540;
  const height = 150;
  const left = 44;
  const right = 16;
  const top = 22;
  const bottom = 26;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const rawMax = Math.max(...validWeeks.map(w => Math.max(w.plannedMinutes, w.studiedMinutes)));
  const maxMinutes = Math.max(60, Math.ceil(rawMax / 60) * 60);

  const yFor = (minutes: number) =>
    top + chartHeight - Math.min(1, Math.max(0, minutes / maxMinutes)) * chartHeight;

  const slotWidth = chartWidth / validWeeks.length;
  const barWidth = Math.min(22, Math.max(8, (slotWidth - 14) / 2));
  const barGap = 3;
  const groupWidth = barWidth * 2 + barGap;

  // Grade horizontal (0, 50%, 100%)
  const midMinutes = Math.round(maxMinutes / 2);
  const gridLines = [
    { y: yFor(maxMinutes), label: formatStudyMinutes(maxMinutes) },
    { y: yFor(midMinutes), label: formatStudyMinutes(midMinutes) },
    { y: yFor(0), label: '0' },
  ];

  const gridHtml = gridLines
    .map(
      line =>
        `<line x1="${left}" x2="${width - right}" y1="${line.y.toFixed(1)}" y2="${line.y.toFixed(1)}" class="chart-grid-line" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3"/><text x="${left - 6}" y="${(line.y + 3.5).toFixed(1)}" text-anchor="end" class="chart-axis-label" font-size="12">${escapeHtml(line.label)}</text>`
    )
    .join('');

  const barsHtml = validWeeks
    .map((week, index) => {
      const groupX = left + index * slotWidth + (slotWidth - groupWidth) / 2;
      const plannedX = groupX;
      const actualX = groupX + barWidth + barGap;

      const plannedY = yFor(week.plannedMinutes);
      const plannedH = Math.max(1, top + chartHeight - plannedY);

      const actualY = yFor(week.studiedMinutes);
      const actualH = Math.max(1, top + chartHeight - actualY);

      const dateLabel = formatDate(week.start);
      const pct = week.plannedMinutes
        ? `${Math.round((week.studiedMinutes / week.plannedMinutes) * 100)}%`
        : '—';
      const tooltip = `Semana de ${dateLabel}${week.inProgress ? ' (em andamento)' : ''}: Planejado ${formatStudyMinutes(week.plannedMinutes)} · Realizado ${formatStudyMinutes(week.studiedMinutes)} (${pct})`;

      const isAchieved = week.plannedMinutes > 0 && week.studiedMinutes >= week.plannedMinutes;
      const actualToneClass = isAchieved ? 'chart-bar-achieved' : 'chart-bar-actual';
      const actualFill = isAchieved
        ? 'var(--chart-series-primary, var(--color-primary, currentColor))'
        : 'var(--chart-series-secondary)';

      return `<g class="chart-week-group" tabindex="0" role="group" aria-label="${escapeHtml(tooltip)}">
        <title>${escapeHtml(tooltip)}</title>
        <rect x="${plannedX.toFixed(1)}" y="${plannedY.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${plannedH.toFixed(1)}" rx="2" class="chart-bar-planned" fill="currentColor" fill-opacity="0.25">
          <title>Planejado: ${formatStudyMinutes(week.plannedMinutes)}</title>
        </rect>
        <rect x="${actualX.toFixed(1)}" y="${actualY.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${actualH.toFixed(1)}" rx="2" class="${actualToneClass}" fill="${actualFill}">
          <title>Realizado: ${formatStudyMinutes(week.studiedMinutes)}</title>
        </rect>
        <text x="${(groupX + groupWidth / 2).toFixed(1)}" y="${(height - 8).toFixed(1)}" text-anchor="middle" class="chart-axis-label" font-size="12">${escapeHtml(dateLabel.split(' ')[0])}${week.inProgress ? '*' : ''}</text>
      </g>`;
    })
    .join('');

  return `<div class="planned-actual-chart" role="region" aria-label="Gráfico semanal de planejado e realizado">
    <div class="planned-actual-chart__legend flex items-center justify-end gap-4 text-xs text-content-secondary mb-2" aria-hidden="true">
      <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-xs bg-content-primary/25"></span> Planejado</span>
      <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-xs bg-primary"></span> Realizado (na meta)</span>
      <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-xs bg-warning-emphasis"></span> Em curso / abaixo</span>
    </div>
    <div class="planned-actual-chart__canvas overflow-x-auto">
      <svg viewBox="0 0 ${width} ${height}" class="w-full min-w-[540px] max-w-full" role="img" aria-label="Comparação semanal entre carga planejada e realizada">
        ${gridHtml}
        ${barsHtml}
      </svg>
    </div>
  </div>`;
}
