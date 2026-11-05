import { escapeHtml as defaultEscapeHtml } from '../../core/utils.js';
import { formatDecimal } from '../../core/format-number.js';
import { buildErrorParetoVisual } from '../../domain/practice/practice-visual-models.js';
import { renderErrorParetoChart } from '../primitives/charts/charts.js';

export function renderErrorAnalysis(
  model: Record<string, any>,
  { toolbar = '', escapeHtml = defaultEscapeHtml }: any = {}
) {
  if (model.state === 'empty')
    return toolbar + '<div class="empty-state"><p>' + escapeHtml(model.message) + '</p></div>';

  const paretoVisual = buildErrorParetoVisual({
    items: model.items || [],
    totalErrors: model.totalErrors || 0,
    hasPrevious: Boolean(model.hasPrevious),
  });

  const chartHtml = renderErrorParetoChart({ visual: paretoVisual, className: 'my-3' });

  const diagnosis =
    '<section class="error-diagnosis ' +
    model.state +
    '"><div><span>Diagnóstico</span><strong>' +
    escapeHtml(model.diagnosis) +
    '</strong></div><div><span>Ação</span><strong>' +
    escapeHtml(model.action) +
    '</strong></div></section>';

  const metaHtml =
    '<div class="analytics-note mt-2 text-[11px] text-content-secondary">' +
    formatDecimal(model.coverage) +
    '% dos ' +
    model.totalErrors +
    ' erros estão categorizados · confiança ' +
    escapeHtml(model.confidence?.label?.toLowerCase() || 'em avaliação') +
    ' · ' +
    escapeHtml(model.periodLabel || 'recorte atual') +
    '.</div>';

  return toolbar + diagnosis + chartHtml + metaHtml;
}
