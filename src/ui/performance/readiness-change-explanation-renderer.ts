import { renderIconSvg } from '../primitives/icon.js';

export function renderReadinessChangeExplanation(
  model: Record<string, any>,
  {
    formatDate,
    escapeHtml,
  }: { formatDate: (date: string) => string; escapeHtml: (value: any) => string }
) {
  const comparable = model.state === 'comparable';
  const heading = comparable
    ? 'Por que a Prontidão mudou?'
    : 'Por que não há comparação da Prontidão?';
  const period =
    model.previous && model.current
      ? `<p>${escapeHtml(formatDate(model.previous.date))}: ${model.previous.score}/100 → ${escapeHtml(formatDate(model.current.date))}: ${model.current.score}/100.</p>`
      : '';
  const factors = model.factors.length
    ? `<ul class="readiness-change-factors">${model.factors.map((item: any) => `<li><span>${renderIconSvg(item.direction === 'up' ? 'arrow-up' : 'arrow-down', { size: 14, className: 'inline-block align-text-bottom mr-1' })} ${escapeHtml(item.label)}</span><strong>${item.before} → ${item.after}/100</strong></li>`).join('')}</ul>`
    : '<p>Os fatores disponíveis permaneceram estáveis.</p>';
  return `<details class="readiness-change-explanation"><summary>${heading}${comparable ? ` · ${model.delta > 0 ? '+' : model.delta < 0 ? '−' : ''}${Math.abs(model.delta)} ${Math.abs(model.delta) === 1 ? 'ponto' : 'pontos'}` : ''}</summary>${period}${comparable ? `${factors}<details class="limits-disclosure"><summary>Como ler: limites</summary><p class="analytics-note">Os valores mostram a direção observada de cada fator; pequenas diferenças vêm do arredondamento do índice.</p></details>` : `<p class="analytics-note">${escapeHtml(model.reason)}</p>`}</details>`;
}
