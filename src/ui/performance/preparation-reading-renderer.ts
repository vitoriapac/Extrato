import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { PreparationReadingView } from './PreparationReadingView.js';
import type { PreparationReading } from '../../application/performance/build-preparation-reading.js';
import { escapePresentationText } from '../components/presentation.js';

export function renderPreparationReading(reading: PreparationReading | null | undefined): string {
  return reading ? render(h(PreparationReadingView, { reading })) : '';
}
const STATE_LABEL: Record<string, string> = {
  positive: 'Evidência de melhora',
  neutral: 'Sem melhora observável · estável',
  negative: 'Sem melhora observável · piora',
};

/** O que mudou depois das recomendações já medidas. Só observação: nenhuma causa é afirmada. */
export function renderRecommendationFollowupSummary(
  rows: Array<Record<string, any>> | null | undefined,
  { escapeHtml = escapePresentationText }: { escapeHtml?: (value: any) => string } = {}
): string {
  const measured = (rows || []).filter(row => STATE_LABEL[row.state]).slice(0, 3);
  if (!measured.length) return '';
  const items = measured
    .map(row => {
      const metric = (row.metrics || []).find(
        (item: Record<string, any>) => item.before != null && item.after != null
      );
      const change = metric ? ` · ${metric.label} de ${metric.before} para ${metric.after}` : '';
      return `<li><strong>${escapeHtml(row.topicName)}</strong> (${escapeHtml(row.action)}): ${escapeHtml(STATE_LABEL[row.state])}${escapeHtml(change)}.</li>`;
    })
    .join('');
  return `<details class="performance-followup chart-card mb-4" id="bloco-recomendacoes"><summary>O que mudou depois das recomendações (${measured.length})</summary><ul class="performance-reading__list">${items}</ul><p class="analytics-note m-0">Medição depois de recomendações concluídas. É uma observação: não indica que a recomendação causou a mudança.</p></details>`;
}
