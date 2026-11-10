import { renderWindowBadge } from './window-badge.js';
import { renderCopyBlockLink } from './block-link.js';
import { pluralize } from '../../core/utils.js';
import { renderPerformanceDetails } from './performance-story.js';
import { renderAdherenceAnalysis } from '../renderers/adherence-renderer.js';
import {
  renderBulletBar,
  renderStackedColumnChart,
  renderDonutChart,
} from '../primitives/charts/charts.js';
import { formatDecimal } from '../../core/format-number.js';
import { formatStudyMinutes } from '../format-study-time.js';

// Share of rated sessions with deep focus per shift; a shift without rated sessions shows "sem sessões", never 0%.
export function renderFocusByShift(
  analysis: Record<string, any> | null | undefined,
  windowLabel = ''
) {
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
  return `<section class="performance-block focus-shift" aria-label="Foco profundo por turno"><h4>Foco profundo por turno ${renderWindowBadge('period', windowLabel)}</h4><p class="analytics-note">Percentual das sessões avaliadas no encerramento com foco profundo${windowLabel ? `, no período escolhido (${windowLabel})` : ''}. ${note}</p><ul class="focus-shift__list">${rows}</ul></section>`;
}

export function renderPerformanceConsistency(
  model: Record<string, any>,
  { formatDate, escapeHtml, range }: any = {}
) {
  const cells = model.heatmap
    .map((day: any) => {
      const level = day.minutes === 0 ? 0 : day.minutes < 30 ? 1 : day.minutes < 90 ? 2 : 3;
      return `<span class="performance-heatmap-day level-${level} rounded-xs transition-transform hover:scale-110" role="img" title="${escapeHtml(formatDate(day.date))}: ${day.minutes} min" aria-label="${escapeHtml(formatDate(day.date))}: ${day.minutes} minutos estudados"></span>`;
    })
    .join('');
  const heatmap = `<section class="performance-block"><h3>Calendário de estudo</h3><p class="analytics-note">${pluralize(model.activeDays, 'dia', 'dias')} com estudo no período. ${model.heatmapLimited ? 'Últimos 90 dias do período.' : 'Dias do período.'} Cada dia informa os minutos em texto acessível.</p><div class="performance-heatmap" role="group" aria-label="Minutos estudados por dia">${cells}</div><div class="heatmap-legend flex items-center justify-end gap-1.5 text-xs text-content-secondary mt-3" aria-hidden="true"><span>Menos</span><span class="performance-heatmap-day level-0 w-3.5 h-3.5 rounded-xs inline-block" title="0 min"></span><span class="performance-heatmap-day level-1 w-3.5 h-3.5 rounded-xs inline-block" title="<30 min"></span><span class="performance-heatmap-day level-2 w-3.5 h-3.5 rounded-xs inline-block" title="<90 min"></span><span class="performance-heatmap-day level-3 w-3.5 h-3.5 rounded-xs inline-block" title="≥90 min"></span><span>Mais</span></div></section>`;

  // Linha do tempo com colunas empilhadas e cores das matérias
  const timeline = model.studyTimeline;
  let timelineHtml = '';
  if (timeline && timeline.days.length > 0) {
    const totalHours = formatDecimal(timeline.totalSeconds / 3600);
    // Teto da escala em horas "redondas" (a metade também): evita rótulos como 0 / 1,9h / 3,8h.
    const maxHours = Math.max(
      0,
      ...timeline.days.map((day: any) => (day.totalSeconds || 0) / 3600)
    );
    const niceMaxHours =
      [1, 2, 4, 6, 8, 10, 12, 16, 20, 24].find(value => value >= maxHours) || Math.ceil(maxHours);
    const chart = renderStackedColumnChart({
      days: timeline.days,
      minYMax: niceMaxHours * 3600,
    });
    timelineHtml = `<section class="performance-block" aria-label="Linha do tempo de estudos">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 class="m-0">Linha do tempo diária</h3>
          <p class="analytics-note m-0">Horas estudadas por dia segmentadas pelas cores oficiais das disciplinas.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-3">
        <div class="lg:col-span-2 overflow-x-auto">
          ${chart}
        </div>
        <div class="bg-surface-subtle/50 p-4 rounded-default border-t border-border-subtle">
          <div class="mb-3">
            <span class="text-2xl font-semibold font-data text-content-primary">${totalHours}h</span>
            <p class="text-xs text-content-secondary m-0">Tempo total no período selecionado</p>
          </div>
          <p class="text-xs text-content-secondary m-0">A divisão por disciplina está em "Tempo de estudo por disciplina", logo abaixo.</p>
        </div>
      </div>
    </section>`;
  }

  // Distribuição do tempo de estudo por matéria (Donut chart)
  const distribution = model.studyDistribution;
  let distributionHtml = '';
  if (distribution && distribution.slices.length > 0) {
    const donut = renderDonutChart({
      slices: distribution.slices,
      totalSeconds: distribution.totalSeconds,
      size: 200,
    });
    const legend = distribution.slices
      .map(
        (slice: any) =>
          `<li class="flex items-center justify-between gap-2 py-1 text-xs border-b border-border-subtle/50 last:border-b-0"><div class="flex items-center gap-1.5 min-w-0"><span class="subject-color-swatch subject-color-${slice.colorSlot} shrink-0" aria-hidden="true"></span><span class="truncate font-medium">${escapeHtml(slice.subjectName)}</span></div><div class="shrink-0 text-content-secondary font-data">${formatDecimal(slice.seconds / 3600)}h <span class="text-micro font-sans text-content-secondary">(${formatDecimal(slice.percentage)}%)</span></div></li>`
      )
      .join('');

    distributionHtml = `<section class="performance-block" aria-label="Distribuição do tempo de estudo">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 class="m-0">Tempo de estudo por disciplina</h3>
          <p class="analytics-note m-0">Distribuição percentual da carga horária dedicada a cada matéria no período.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-3">
        <div class="flex justify-center p-3">
          ${donut}
        </div>
        <div class="bg-surface-subtle/50 p-4 rounded-default border-t border-border-subtle">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-content-secondary mb-3">Divisão da carga horária</h4>
          <ul class="m-0 p-0 list-none space-y-1">
            ${legend}
          </ul>
        </div>
      </div>
    </section>`;
  }

  // Síntese no topo: o mesmo critério do resumo semanal (tempo estudado frente ao planejado), agora na janela filtrada.
  const synthesis =
    model.plannedMinutes > 0 && model.adherence != null
      ? `<section class="performance-synthesis" id="bloco-sintese" aria-label="Síntese da consistência">${renderCopyBlockLink('sintese')}<p class="performance-synthesis__lead">${renderWindowBadge('period', range?.label || '')} ${escapeHtml(range?.label || 'No período')}: ${escapeHtml(formatStudyMinutes(model.studiedMinutes))} estudados de ${escapeHtml(formatStudyMinutes(model.plannedMinutes))} planejados (${formatDecimal(model.adherence)}% do tempo planejado), em ${pluralize(model.activeDays, 'dia', 'dias')} com estudo.</p><p class="analytics-note m-0">É tempo total, sem exigir vínculo com o plano. Aderência ao plano, execução prioritária e crédito semanal usam outras bases e ficam em "Como o plano foi cumprido", logo abaixo, cada uma com a sua janela.</p>${model.plannedMinutes > model.studiedMinutes ? `<p class="analytics-note m-0">Faltam ${escapeHtml(formatStudyMinutes(model.plannedMinutes - model.studiedMinutes))} para igualar o planejado neste período.</p><div class="performance-reading__actions"><button type="button" class="btn ghost small" data-performance-adjust-plan>Ajustar plano</button></div>` : ''}</section>`
      : '';
  return `${synthesis}${timelineHtml}${distributionHtml ? renderPerformanceDetails('Distribuição do tempo por disciplina', distributionHtml) : ''}${renderPerformanceDetails('Como o plano foi cumprido: aderência, execução prioritária e crédito semanal', renderAdherenceAnalysis(model.adherenceAnalysis, { formatDate, escapeHtml }), 'performance-details adherence-fold')}<div class="performance-shift mt-4" id="bloco-turno"><h3>Turno de estudo</h3><p class="analytics-note">Duas leituras do mesmo assunto: o rendimento em todo o histórico e o foco profundo no período escolhido. Cada número traz a sua janela.</p><div id="shiftEnergyMount" class="mt-3">${renderFocusByShift(model.focusByShift, range?.label)}</div></div>${renderPerformanceDetails('Calendário de estudo', heatmap)}`;
}
