import { escapeHtml as defaultEscapeHtml } from '../../core/utils.js';
import { formatDecimal } from '../../core/format-number.js';
import { renderIconSvg } from '../primitives/icon.js';
export function renderErrorAnalysis(
  model: Record<string, any>,
  { toolbar = '', escapeHtml = defaultEscapeHtml }: any = {}
) {
  if (model.state === 'empty')
    return toolbar + '<div class="empty-state"><p>' + escapeHtml(model.message) + '</p></div>';
  // Pareto: largest first, with the running share of all errors after each category.
  let running = 0;
  const sorted = model.items
    .filter((item: any) => item.value > 0)
    .sort((a: any, b: any) => b.value - a.value)
    .map((item: any) => {
      running += item.value;
      return { ...item, cumulative: Math.round((running / model.totalErrors) * 100) };
    });
  const vital = sorted.findIndex((item: any) => item.cumulative >= 80) + 1;
  const items = sorted
    .map((item: any) => {
      const share = Math.round((item.value / model.totalErrors) * 100);
      const iconMarkup = item.icon ? renderIconSvg(item.icon, { size: 14, className: 'inline-block align-middle mr-1' }) : '';
      return (
        '<li class="error-profile-item"><span class="error-profile-label">' +
        iconMarkup +
        ' ' +
        escapeHtml(item.label) +
        '</span><span class="error-profile-track" aria-hidden="true"><span style="width:' +
        share +
        '%"></span><i class="error-profile-cumulative" style="left:' +
        item.cumulative +
        '%"></i></span><strong class="error-profile-value">' +
        item.value +
        ' · ' +
        formatDecimal(share) +
        '%</strong><small class="error-profile-cumulative-text">acumulado ' +
        item.cumulative +
        '%</small><small class="error-profile-delta">' +
        (model.hasPrevious
          ? (item.delta >= 0 ? '+' : '') +
            item.delta +
            (Math.abs(item.delta) === 1 ? ' erro' : ' erros') +
            ' vs. período anterior'
          : 'Sem período anterior') +
        '</small></li>'
      );
    })
    .join('');
  const diagnosis =
    '<section class="error-diagnosis ' +
    model.state +
    '"><div><span>Diagnóstico</span><strong>' +
    escapeHtml(model.diagnosis) +
    '</strong></div><div><span>Ação</span><strong>' +
    escapeHtml(model.action) +
    '</strong></div></section>';
  return (
    toolbar +
    diagnosis +
    '<p class="analytics-note">Cada barra mostra a parcela dos ' +
    model.totalErrors +
    ' erros registrados no recorte; o traço marca o acumulado até aquela categoria.' +
    (vital && vital < sorted.length
      ? ' <strong>' +
        (vital === 1 ? 'A primeira categoria soma' : 'As ' + vital + ' primeiras categorias somam') +
        ' ' +
        sorted[vital - 1].cumulative +
        '% dos erros.</strong>'
      : '') +
    '</p><ul class="error-profile-grid">' +
    items +
    '</ul><div class="analytics-note">' +
    formatDecimal(model.coverage) +
    '% dos ' +
    model.totalErrors +
    ' erros estão categorizados · confiança ' +
    escapeHtml(model.confidence.label.toLowerCase()) +
    ' · ' +
    escapeHtml(model.periodLabel) +
    '.</div>'
  );
}
