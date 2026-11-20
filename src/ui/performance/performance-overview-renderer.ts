import { formatInteger } from '../../core/format-number.js';
import { pluralize } from '../../core/utils.js';
import { renderWeekSummary } from './week-summary-renderer.js';
import { formatDecimal, formatDelta, formatPoints } from '../../core/format-number.js';
import { presentEvidence } from '../evidence-state.js';
import { formatStudyMinutes, formatStudyMinuteDelta } from '../format-study-time.js';
import { renderReadinessHistory } from '../renderers/readiness-history-renderer.js';
import { renderComparisonCriteria } from './performance-comparison-renderer.js';
import {
  renderPerformanceStory,
  renderPerformanceSummary,
  renderPerformanceDetails,
} from './performance-story.js';
import { renderReadinessChangeExplanation } from './readiness-change-explanation-renderer.js';
import { renderMetricCard } from '../components/presentation.js';
import { renderSparkline } from '../primitives/charts/charts.js';
import {
  renderPreparationReading,
  renderRecommendationFollowupSummary,
} from './preparation-reading-renderer.js';

const shown = (value: number | null | undefined) => (value == null ? '—' : formatDecimal(value));
const change = (value: number | null | undefined) =>
  value == null ? 'Sem base comparável' : formatDelta(value);
const card = (label: string, value: unknown, unit: string, detail: string, windowBadge = '', trend = '') =>
  renderMetricCard({ label, value: presentEvidence({ value, unit, format: shown }).text, detail, windowBadge, trend });
/** Tendência das últimas semanas; com menos de 3 semanas com atividade não há o que desenhar (só zeros é ruído). */
const kpiTrend = (values: Array<number | null>, label: string, unit: string) =>
  values.filter(value => value != null && value > 0).length < 3
    ? ''
    : `<span class="performance-kpi__trend">${renderSparkline({ values, label, unit, width: 120, height: 28 })}<small>tendência: ${values.length} semanas completas</small></span>`;

export function renderPerformanceOverview(
  model: Record<string, any>,
  {
    range,
    today,
    activeExamTags,
    formatDate,
    escapeHtml,
    weekSummary = null,
    preparationReading = null,
    recommendationFollowup = [],
    comparisonModel = null,
    readinessChange = null,
  }: any = {}
) {
  const current = model.current || {},
    previous = model.previous;
  const comparisonLabel = range.comparePrevious
    ? 'Comparação com período anterior'
    : 'Sem comparação';
  const trend: any[] = model.trend || [];
  const kpis = `<section class="performance-kpis ui-metric-group" aria-label="Estado atual no período selecionado">
    ${renderMetricCard({ label: 'Tempo estudado', trend: kpiTrend(trend.map((row: any) => Math.round((row.studiedMinutes / 60) * 10) / 10), 'Tempo estudado por semana completa', 'h'), value: formatStudyMinutes(current.studiedMinutes), detail: `${pluralize(current.sessionCount || 0, 'sessão', 'sessões')}${previous ? ' · ' + formatStudyMinuteDelta(current.studiedMinutes - previous.studiedMinutes) : ''}` })}
    ${card('Questões respondidas', current.resolved ?? 0, '', 'No período selecionado', '', kpiTrend(trend.map((row: any) => row.resolved), 'Questões por semana completa', 'questões'))}
    ${card('Precisão em questões', current.accuracy, '%', `${formatInteger(current.resolved || 0)} questões${current.resolved > 0 && current.resolved < 30 ? ' · amostra pequena' : ''}${previous && previous.resolved >= 30 && current.resolved >= 30 && previous.accuracy != null && current.accuracy != null ? ' · ' + change(current.accuracy - previous.accuracy) + ' p.p.' : ''}`, '', kpiTrend(trend.map((row: any) => row.accuracy), 'Precisão por semana completa (10 questões ou mais)', '%'))}
    ${current.pagesRead > 0 ? card('Páginas lidas', current.pagesRead, 'pág.', `${current.videoBlocksCompleted ? current.videoBlocksCompleted + ' aulas · ' : ''}Material teórico`) : ''}
  </section>`;
  const history = renderReadinessHistory(model.history, {
    formatDate,
    escapeHtml,
    current: model.readiness,
    today,
    activeExamTags,
    showComparisonDetails: false,
  });
  const changes = model.changes.length
    ? `<ul class="performance-changes">${model.changes.map((item: any) => `<li><strong>${escapeHtml(item.label)}</strong><span>${item.unit === 'min' ? formatStudyMinuteDelta(item.delta) : (item.unit === 'p.p.' ? formatPoints(item.delta) : `${item.delta > 0 ? '+' : item.delta < 0 ? '−' : ''}${shown(Math.abs(item.delta))} ${escapeHtml(item.unit)}`)}</span></li>`).join('')}</ul>`
    : '<p class="empty-state empty-state--compact">Ainda não há mudanças mensuráveis com base comparável neste período.</p>';
  const insights = (comparisonModel?.insights || []).slice(0, 3);
  // O resumo dos últimos 7 dias abre a página; aqui a frase só orienta a leitura dos indicadores, sem repetir o KPI.
  const summary = range.comparePrevious
    ? 'Cada indicador mostra a mudança frente ao período anterior.'
    : 'Indicadores do período escolhido.';
  const method = `<p class="performance-method-note">${comparisonLabel}. Precisão usa apenas questões respondidas por você. O índice atual não é uma probabilidade de aprovação.</p>`;
  const readingHtml = renderWeekSummary(weekSummary, { escapeHtml });
  const preparationHtml = renderPreparationReading(preparationReading);
  const followupHtml = renderRecommendationFollowupSummary(recommendationFollowup, { escapeHtml });
  return `${preparationHtml}${followupHtml}${readingHtml}${renderPerformanceSummary(renderPerformanceStory({ title: 'Como sua preparação evoluiu', summary, details: insights }), kpis, method)}${renderPerformanceDetails('Evolução da Prontidão', `${readinessChange ? renderReadinessChangeExplanation(readinessChange, { formatDate, escapeHtml }) : ''}<section class="performance-block"><h3>Prontidão ao longo do tempo</h3>${history}</section><div id="performanceReadinessMount"></div>`, 'performance-details performance-details--trajectory')}${renderPerformanceDetails('Principais mudanças', `<section class="performance-block">${changes}${range.comparePrevious ? renderComparisonCriteria() : ''}</section>`)}`;
}
