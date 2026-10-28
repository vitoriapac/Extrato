import { escapeHtml as defaultEscapeHtml } from '../../core/utils.js';
export function renderRecommendationCalibrationModel(
  model: Record<string, any>,
  { escapeHtml = defaultEscapeHtml }: any = {}
) {
  const factorRows = model?.groups?.factor || [],
    strategyRows = model?.groups?.strategy || [];
  if (!factorRows.length && !strategyRows.length)
    return '<div class="upcoming-empty">Conclua recomendações e registre resultados para iniciar a calibração.</div>';
  const render = (item: Record<string, any>, kind: string) =>
    `<article><strong>${escapeHtml(item.label)}</strong><span>${item.total} resultados · ${item.positive} positivos</span><b>${item.positiveRate === null ? 'Amostra insuficiente' : item.positiveRate + '% positivos'}</b><small>${kind} · confiança ${escapeHtml(item.confidence.toLowerCase())}</small></article>`;
  return `${factorRows.length ? `<h4>Fatores dominantes</h4><div class="calibration-grid">${factorRows.map((item: any) => render(item, 'fator')).join('')}</div>` : ''}${strategyRows.length ? `<h4>Estratégias</h4><div class="calibration-grid">${strategyRows.map((item: any) => render(item, 'estratégia')).join('')}</div>` : ''}<p class="analytics-note">Amostra mínima: ${model.minimumSample} resultados atribuíveis por grupo · algoritmo ${model.algorithmVersion}. Pesos permanecem manuais.</p>`;
}
