import { pluralize } from '../../core/utils.js';
import { renderPerformanceDetails } from './performance-story.js';
import { renderAdherenceAnalysis } from '../renderers/adherence-renderer.js';
import { renderBulletBar } from '../primitives/charts/charts.js';

// Share of rated sessions with deep focus per shift; a shift without rated sessions shows "sem sessões", never 0%.
export function renderFocusByShift(analysis: Record<string, any> | null | undefined) {
  if (!analysis?.shifts) return '';
  const rows = (['morning', 'afternoon', 'night'] as const)
    .map(key => {
      const shift = analysis.shifts[key],
        rated = shift.focusRatedCount || 0;
      const label = String(shift.shiftLabel || key).split(' ')[0];
      return `<li><span class="focus-shift__name">${label}</span>${renderBulletBar({ value: rated ? shift.deepFocusPercent : null, label: `Foco profundo de ${label.toLowerCase()}`, className: 'focus-shift__bar' })}<small>${rated ? pluralize(rated, 'sessão avaliada', 'sessões avaliadas') : 'sem sessões avaliadas'}</small></li>`;
    })
    .join('');
  const note = analysis.isSampleSufficient
    ? analysis.peakShiftLabel
      ? `${analysis.shifts[analysis.peakShift]?.averageAccuracy != null ? 'Maior acerto em questões' : 'Mais foco profundo'}: ${String(analysis.peakShiftLabel).toLowerCase()}.`
      : ''
    : `Ainda há poucas sessões avaliadas; a partir de 5 o diagnóstico por turno fica disponível.`;
  return `<section class="performance-block focus-shift" aria-label="Foco profundo por turno"><h3>Foco profundo por turno</h3><p class="analytics-note">Percentual das sessões avaliadas no encerramento com foco profundo. ${note}</p><ul class="focus-shift__list">${rows}</ul></section>`;
}

export function renderPerformanceConsistency(
  model: Record<string, any>,
  { formatDate, escapeHtml }: any = {}
) {
  const cells = model.heatmap
    .map((day: any) => {
      const level = day.minutes === 0 ? 0 : day.minutes < 30 ? 1 : day.minutes < 90 ? 2 : 3;
      return `<span class="performance-heatmap-day level-${level}" role="img" title="${escapeHtml(formatDate(day.date))}: ${day.minutes} min" aria-label="${escapeHtml(formatDate(day.date))}: ${day.minutes} minutos estudados">${day.minutes > 0 ? '●' : '·'}</span>`;
    })
    .join('');
  const heatmap = `<section class="performance-block"><h3>Calendário de estudo</h3><p class="analytics-note">${pluralize(model.activeDays, 'dia', 'dias')} com estudo no período. ${model.heatmapLimited ? 'Últimos 90 dias do período.' : 'Dias do período.'} Cada dia informa os minutos em texto acessível.</p><div class="performance-heatmap" role="group" aria-label="Minutos estudados por dia">${cells}</div></section>`;
  return `${renderAdherenceAnalysis(model.adherenceAnalysis, { formatDate, escapeHtml })}${renderFocusByShift(model.focusByShift)}${renderPerformanceDetails('Calendário de estudo', heatmap)}`;
}
