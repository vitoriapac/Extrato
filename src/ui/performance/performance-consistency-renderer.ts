import { renderWindowBadge } from './window-badge.js';
import { pluralize } from '../../core/utils.js';
import { renderPerformanceDetails } from './performance-story.js';
import { renderAdherenceAnalysis } from '../renderers/adherence-renderer.js';
import { renderStackedColumnChart } from '../primitives/charts/charts.js';
import { renderPlannedVsActualChart } from './planned-actual-chart.js';
import { renderTimeBySubjectBars } from './time-by-subject-bars.js';
import { formatDecimal } from '../../core/format-number.js';
import { formatStudyMinutes } from '../format-study-time.js';

export function renderPerformanceConsistency(
  model: Record<string, any>,
  { formatDate, escapeHtml, range, capacityMinutes = null }: any = {}
) {
  // Linha do tempo com colunas empilhadas e cores das matérias
  const timeline = model.studyTimeline;
  let timelineHtml = '';
  if (timeline && timeline.days.length > 0) {
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
            <span class="text-2xl font-semibold font-display text-content-primary">${formatStudyMinutes(timeline.totalSeconds / 60)}</span>
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
    distributionHtml = `<section class="performance-block" aria-label="Distribuição do tempo de estudo">
      <div class="mb-3">
        <h3 class="m-0">Tempo de estudo por disciplina</h3>
        <p class="analytics-note m-0">Carga horária dedicada a cada matéria no período: as 8 com mais tempo e as demais somadas.</p>
      </div>
      ${renderTimeBySubjectBars(distribution, { escapeHtml })}
    </section>`;
  }

  // Síntese no topo: o mesmo critério do resumo semanal (tempo estudado frente ao planejado), agora na janela filtrada.
  const synthesis =
    model.plannedMinutes > 0 && model.adherence != null
      ? `<section class="performance-synthesis" id="bloco-sintese" aria-label="Síntese de ritmo e aderência"><p class="performance-synthesis__lead">${renderWindowBadge('period', range?.label || '')} ${escapeHtml(range?.label || 'No período')}: ${escapeHtml(formatStudyMinutes(model.studiedMinutes))} estudados de ${escapeHtml(formatStudyMinutes(model.plannedMinutes))} planejados (${formatDecimal(model.adherence)}% do tempo planejado), em ${pluralize(model.activeDays, 'dia', 'dias')} com estudo.</p><p class="analytics-note m-0">Inclui todo o tempo estudado; o cumprimento por tarefa fica em "Como o plano foi cumprido", logo abaixo.</p>${model.plannedMinutes > model.studiedMinutes ? `<p class="analytics-note m-0">Faltam ${escapeHtml(formatStudyMinutes(model.plannedMinutes - model.studiedMinutes))} para igualar o planejado neste período.</p><div class="performance-reading__actions"><button type="button" class="btn ghost small" data-performance-adjust-plan>Ajustar plano</button></div>` : ''}</section>`
      : '';
  const weeklyChart = renderPlannedVsActualChart(model.weekly || [], { formatDate, escapeHtml, capacityMinutes });
  const weeklyHtml = weeklyChart
    ? `<section class="performance-block" aria-label="Planejado e realizado por semana"><h3>Planejado × realizado por semana</h3><p class="analytics-note">Tempo estudado frente ao tempo planejado em cada semana${capacityMinutes > 0 ? ', com a capacidade semanal do plano como referência' : ''}.</p>${weeklyChart}</section>`
    : '';
  return `${synthesis}${weeklyHtml}${timelineHtml}${distributionHtml ? renderPerformanceDetails('Distribuição do tempo por disciplina', distributionHtml, 'performance-details', false) : ''}${renderPerformanceDetails('Como o plano foi cumprido: aderência, prioridade e tempo extra fora das tarefas', renderAdherenceAnalysis(model.adherenceAnalysis, { formatDate, escapeHtml, windowLabel: range?.label }), 'performance-details adherence-fold', false)}`;
}
