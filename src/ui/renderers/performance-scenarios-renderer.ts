export function renderPerformanceScenarios(
  model,
  { escapeHtml = value => String(value) }: any = {}
) {
  if (!model?.available) return '';
  return `<div class="forecast-scenarios">${model.scenarios.map(item => `<span><strong>${escapeHtml(item.label)}</strong>${item.low}–${item.high}%</span>`).join('')}</div>`;
}
