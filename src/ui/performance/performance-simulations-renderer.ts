import { renderWindowBadge } from './window-badge.js';
import { renderMetricCard } from '../components/presentation.js';
import { renderEvidenceBadge } from './evidence-badge.js';
import { renderAchievementProjection } from './achievement-projection-renderer.js';
import { formatPercent, formatPoints } from '../../core/format-number.js';
import { pluralize } from '../../core/utils.js';
import { scorePercent } from '../../domain/exams/simulation-score.js';
import { renderSimulationTrendChart } from '../renderers/simulations-renderer.js';
import { renderSimulationComparison } from '../renderers/simulation-comparison-renderer.js';
import { renderProjectionCalibration } from '../renderers/projection-calibration-renderer.js';
import {
  renderPerformanceStory,
  renderPerformanceSummary,
  renderPerformanceDetails,
} from './performance-story.js';
import { renderPerformanceSampleState } from './performance-sample-state.js';

const percent = (value: number | null | undefined) => formatPercent(value);
const signed = (value: number) => (value == null ? 'Sem comparação' : formatPoints(value));

/** Faixa calibrada com simulados comparáveis; sem ela, o gráfico fica só com notas e meta. */
const projectedBand = (model: Record<string, any> | null | undefined) => {
  const band = model?.projection?.calibratedSimulationBand;
  return Number.isFinite(band?.low) && Number.isFinite(band?.high)
    ? { low: band.low as number, high: band.high as number }
    : null;
};

export function renderPerformanceSimulations(
  model: Record<string, any>,
  {
    range,
    targetScore,
    formatDate,
    escapeHtml,
    escapeAttr = escapeHtml,
    projection = null,
  }: any = {}
) {
  // A faixa projetada e a projeção até a prova moram aqui; a Visão geral só traz a faixa numa linha com link.
  const projectionHtml = projection?.model
    ? renderAchievementProjection(projection.model, {
        history: projection.history,
        escapeHtml,
        escapeAttr,
        weeklyCapacityMinutes: projection.capacityMinutes,
        adherenceContext: projection.adherenceContext,
        recoveryPlan: projection.recoveryPlan,
      })
    : '';
  if (!model.count)
    return `<div class="empty-state empty-state--compact" role="status"><strong>Sem simulados neste período</strong><p>Registre simulados para acompanhar as notas. Duas provas com disciplinas detalhadas em comum permitem a comparação por disciplina.</p>${projectionHtml ? '' : '<button type="button" class="btn ghost small" data-performance-open="questoes">Registrar simulado</button>'}</div>${projectionHtml}`;
  const win = renderWindowBadge('period', range?.label || '');
  const kpis = `<section class="performance-kpis ui-metric-group" aria-label="Indicadores de simulados">
    ${renderMetricCard({ label: 'Último simulado', windowBadge: win, value: percent(model.latest), detail: `${pluralize(model.count, 'simulado', 'simulados')} · ${escapeHtml(range?.label || 'período escolhido')}` })}
    ${renderMetricCard({ label: 'Média', windowBadge: win, value: percent(model.mean), detail: range.comparePrevious && model.previousMean != null && model.mean != null ? signed(Math.round((model.mean - model.previousMean) * 10) / 10) + ' frente ao período anterior' : 'Cada simulado tem o mesmo peso' })}
    ${model.best === model.latest ? '' : renderMetricCard({ label: 'Melhor resultado', windowBadge: win, value: percent(model.best), detail: 'No período selecionado' })}
    ${renderMetricCard({ label: 'Tendência recente', windowBadge: win, value: signed(model.trend), detail: 'Último × penúltimo simulado' })}
  </section>`;
  const chart = renderSimulationTrendChart({
    items: model.items.slice(-12),
    scoreFor: (item: Record<string, any>) => Math.round(scorePercent(item, item.scoring) * 10) / 10,
    formatDate,
    escapeHtml,
    targetScore,
    band: projectedBand(projection?.model),
  });
  const comparison = renderSimulationComparison(model.comparison, { formatDate, escapeHtml });
  const calibration = renderProjectionCalibration(model.calibration);
  const story = renderPerformanceStory({
    title: 'Resultado dos simulados',
    summary: `Último resultado: ${percent(model.latest)} em ${pluralize(model.count, 'simulado', 'simulados')}, ${range?.label || 'no período escolhido'}.`,
  });
  const method =
    '<p class="performance-method-note">Resultados de provas com composição ou dificuldade diferentes não são diretamente equivalentes. A comparação por disciplina mostra somente áreas detalhadas em ambas as provas.</p>';
  const simulationsEvidence = model.count < 2 ? 'insufficient' : model.count < 3 ? 'small' : null;
  return `${simulationsEvidence ? `<p class="performance-evidence-row m-0">${renderEvidenceBadge(simulationsEvidence, `${model.count} simulados no período`)}</p>` : ''}${renderPerformanceSummary(story, kpis, method)}${projectionHtml}${model.count < 2 ? renderPerformanceSampleState({ name: 'A tendência recente', current: model.count, required: 2, message: 'comparar os dois resultados mais recentes', unit: 'simulados', singular: 'simulado', actionLabel: 'Registrar simulado' }) : ''}<div class="performance-block">${chart}</div>${renderPerformanceDetails('Comparação por disciplina e projeção', `<section class="performance-block"><h3>Comparação por disciplina</h3>${comparison}</section><section class="performance-block"><h3>Projeção × resultado</h3>${calibration}</section>`)}`;
}
