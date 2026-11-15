import { formatPoints } from '../../core/format-number.js';
import { formatPeriodBR } from '../../core/format-date.js';
import { planMin, planMinDelta } from './adherence-labels.js';
export function renderPeriodComparisonDetail(model: Record<string, any>, { escapeHtml }: any = {}) {
  const format = (metric: Record<string, any>, value: number | null | undefined) =>
    value == null
      ? 'Sem evidência'
      : metric.unit === 'min'
        ? planMin(value)
        : metric.unit === 'percentage_points'
          ? `${value}%`
          : String(value);
  const delta = (metric: Record<string, any>) =>
    metric.key === 'accuracy' && model.insights.confidence !== 'moderate'
      ? 'Amostra insuficiente'
      : metric.delta == null
        ? 'Sem comparação'
        : metric.unit === 'percentage_points'
          ? formatPoints(metric.delta)
          : metric.unit === 'min'
            ? planMinDelta(metric.delta)
            : `${metric.delta > 0 ? '+' : ''}${metric.delta}`;
  return `<p class="period-comparison-caption"><strong>${escapeHtml(model.currentPeriod.label)}</strong> · ${escapeHtml(formatPeriodBR(model.currentPeriod.start, model.currentPeriod.end))} <span>comparado com ${escapeHtml(formatPeriodBR(model.previousPeriod.start, model.previousPeriod.end))}</span></p><div class="period-comparison result-period-comparison"><div class="comparison-head"><span>Métrica</span><span>Anterior</span><span>Atual</span><span>Variação</span></div>${model.metrics.map((metric: any) => `<div><span>${escapeHtml(metric.label)}</span><b>${format(metric, metric.previous)}</b><b>${format(metric, metric.current)}</b><b class="comparison-delta ${metric.key === 'accuracy' && model.insights.confidence !== 'moderate' ? 'insufficient' : metric.state}">${delta(metric)}</b></div>`).join('')}</div><aside class="comparison-insight" aria-label="Leitura da comparação">${model.insights.combinedMessage ? `<p class="comparison-insight-combined">${escapeHtml(model.insights.combinedMessage)}</p>` : ''}<p>${escapeHtml(model.insights.accuracyMessage)}</p><small>${escapeHtml(model.insights.caveat)}</small></aside>`;
}
