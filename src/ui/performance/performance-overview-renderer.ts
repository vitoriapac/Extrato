import { renderWindowBadge } from './window-badge.js';
import { renderEvidenceBadge, type EvidenceState } from './evidence-badge.js';
import { renderCopyBlockLink } from './block-link.js';
import { formatDecimal, formatDelta } from '../../core/format-number.js';
import { presentEvidence } from '../evidence-state.js';
import { formatStudyMinutes, formatStudyMinuteDelta } from '../format-study-time.js';
import { renderReadinessHistory } from '../renderers/readiness-history-renderer.js';
import { displayReadinessValue } from '../../application/analytics/build-header-view-model.js';
import { renderPerformanceComparison } from './performance-comparison-renderer.js';
import {
  renderPerformanceStory,
  renderPerformanceSummary,
  renderPerformanceDetails,
} from './performance-story.js';
import { renderReadinessChangeExplanation } from './readiness-change-explanation-renderer.js';
import { renderMetricCard, renderEmptyState } from '../components/presentation.js';
import { renderAchievementProjection } from './achievement-projection-renderer.js';
import { renderPlannedVsActualChart } from './planned-actual-chart.js';
import { renderWeeklyPerformanceBriefCard } from './weekly-performance-brief-renderer.js';
import { buildPerformanceExecutiveSummary } from '../../application/performance/build-performance-executive-summary.js';
import {
  renderPreparationReading,
  renderRecommendationFollowupSummary,
} from './preparation-reading-renderer.js';
import { renderPerformanceExecutiveSummary } from './performance-executive-summary-renderer.js';

const shown = (value: number | null | undefined) => (value == null ? '—' : formatDecimal(value));
const change = (value: number | null | undefined) =>
  value == null ? 'Sem base comparável' : formatDelta(value);
const card = (label: string, value: unknown, unit: string, detail: string) =>
  renderMetricCard({ label, value: presentEvidence({ value, unit, format: shown }).text, detail });

const glossaryItems: Array<[string, string]> = [
  [
    'Prontidão',
    'Índice de 0 a 100 que combina cobertura, domínio, retenção, consistência e simulados. Não é probabilidade de aprovação.',
  ],
  ['Domínio', 'Desempenho pessoal medido em um tópico ou disciplina, de 0 a 100.'],
  ['Retenção', 'Estimativa de quanto o conteúdo se mantém na memória ao longo das revisões.'],
  [
    'Aderência',
    'Tempo realizado que tem crédito compatível com uma atividade do plano. Difere do tempo total estudado.',
  ],
  ['Incidência', 'Percentual das provas do histórico em que o tópico aparece.'],
];
const renderGlossary = (escapeHtml: (value: any) => string) =>
  `<p class="m-0"><button type="button" class="btn ghost small" data-performance-open="instrucoes">Abrir a Ajuda</button></p><dl class="performance-glossary">${glossaryItems.map(([term, text]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(text)}</dd></div>`).join('')}</dl>`;

export function renderPerformanceOverview(
  model: Record<string, any>,
  {
    range,
    today,
    activeExamTags,
    formatDate,
    escapeHtml,
    escapeAttr = escapeHtml,
    weeklyBrief = null,
    preparationReading = null,
    recommendationFollowup = [],
    comparisonModel = null,
    readinessChange = null,
    achievementProjection = null,
    achievementHistory = [],
    achievementCapacityMinutes = 0,
    adherenceContext = null,
    recoveryPlan = null,
  }: any = {}
) {
  const current = model.current || {},
    previous = model.previous;
  const comparisonLabel = range.comparePrevious
    ? 'Comparação com período anterior'
    : 'Sem comparação';
  const kpis = `<p class="performance-kpi-window">${renderWindowBadge('period', range?.label || '')}<span>Os indicadores abaixo seguem o período escolhido.</span></p><section class="performance-kpis ui-metric-group" aria-label="Estado atual no período selecionado">
    ${renderMetricCard({ label: 'Tempo estudado', value: formatStudyMinutes(current.studiedMinutes), detail: `${current.sessionCount || 0} sessões${previous ? ' · ' + formatStudyMinuteDelta(current.studiedMinutes - previous.studiedMinutes) : ''}` })}
    ${card('Questões resolvidas', current.resolved ?? 0, '', 'No período selecionado')}
    ${card('Precisão em questões', current.accuracy, '%', `${current.resolved || 0} questões${current.resolved > 0 && current.resolved < 30 ? ' · amostra pequena' : ''}${previous && previous.resolved >= 30 && current.resolved >= 30 && previous.accuracy != null && current.accuracy != null ? ' · ' + change(current.accuracy - previous.accuracy) + ' p.p.' : ''}`)}
    ${current.pagesRead > 0 ? card('Páginas lidas', current.pagesRead, 'pág.', `${current.videoBlocksCompleted ? current.videoBlocksCompleted + ' aulas · ' : ''}Material teórico`) : ''}
  </section>`;
  const secondaryKpis = `<section class="performance-kpis ui-metric-group" aria-label="Prontidão e carga no período">
    ${card('Índice de Prontidão', displayReadinessValue(model.readiness), '/100', model.readinessDelta == null ? 'Histórico comparável indisponível' : 'Calculado agora; o último fechamento e a variação estão na Leitura da preparação')}
    ${card('Volume de carga', current.adherence, '%', current.adherence == null ? 'Sem plano no período' : `${formatStudyMinutes(current.studiedMinutes)} de ${formatStudyMinutes(current.plannedMinutes)} planejados`)}
  </section>`;
  const history = renderReadinessHistory(model.history, {
    formatDate,
    escapeHtml,
    current: model.readiness,
    today,
    activeExamTags,
    showComparisonDetails: false,
  });
  const weekRows = model.weekly
    .map((row: any) => {
      const maximum = Math.max(1, row.plannedMinutes, row.studiedMinutes);
      return `<tr><th scope="row">${escapeHtml(formatDate(row.start))}${row.inProgress ? ' · em andamento' : ''}</th><td><span class="performance-week-bar planned" style="width:${Math.round((row.plannedMinutes / maximum) * 100)}%"></span>${formatStudyMinutes(row.plannedMinutes)}</td><td><span class="performance-week-bar actual" style="width:${Math.round((row.studiedMinutes / maximum) * 100)}%"></span>${formatStudyMinutes(row.studiedMinutes)}</td><td>${row.plannedMinutes ? shown((row.studiedMinutes / row.plannedMinutes) * 100) + '%' : '—'}</td></tr>`;
    })
    .join('');
  const planChart = renderPlannedVsActualChart(model.weekly || [], { formatDate, escapeHtml });
  const plan = `<section class="performance-block"><h3>Planejado × realizado</h3><p class="analytics-note">Volume de carga compara minutos estudados com minutos planejados. Pode superar 100%.</p>${planChart}${weekRows ? `<details class="performance-more mt-3"><summary>Ver tabela semanal detalhada</summary><div class="performance-table-scroll ui-data-table mt-2" tabindex="0" role="region" aria-label="Tabela semanal de planejado e realizado"><table><caption>Semanas com plano ou estudo no período</caption><thead><tr><th scope="col">Semana de</th><th scope="col">Planejado</th><th scope="col">Realizado</th><th scope="col">Volume</th></tr></thead><tbody>${weekRows}</tbody></table></div></details>` : renderEmptyState({ title: 'Sem plano ou estudo no período', message: 'Distribua um plano ou registre uma sessão para comparar planejado e realizado.' })}${model.strategic?.strategicAdherence != null ? `<p class="context-note context-note--info">Aderência estratégica: ${formatDecimal(model.strategic.strategicAdherence)}% do tempo prioritário planejado foi executado em sessões vinculadas.</p>` : ''}</section>`;
  const changes = model.changes.length
    ? `<ul class="performance-changes">${model.changes.map((item: any) => `<li><strong>${escapeHtml(item.label)}</strong><span>${item.unit === 'min' ? formatStudyMinuteDelta(item.delta) : `${item.delta > 0 ? '+' : ''}${shown(item.delta)} ${escapeHtml(item.unit)}`}</span></li>`).join('')}</ul>`
    : '<p class="empty-state empty-state--compact">Ainda não há mudanças mensuráveis com base comparável neste período.</p>';
  const insights = (comparisonModel?.insights || []).slice(0, 3);
  // A principal mudança já abre a página no resumo executivo: aqui entra a segunda, sem repetir a notícia.
  const secondChange = model.changes[1];
  const summary = secondChange
    ? `${secondChange.label}: ${change(secondChange.delta)} ${secondChange.unit} frente ao período anterior.`
    : model.changes[0]
      ? 'Os detalhes por indicador e o histórico de prontidão estão abaixo.'
      : 'Ainda não há mudança mensurável com base comparável. Continue registrando estudo e questões.';
  const method = `<p class="performance-method-note">${comparisonLabel}. Precisão usa apenas questões respondidas por você. O índice atual não é uma probabilidade de aprovação.</p>`;
  const weeklyBriefHtml = renderWeeklyPerformanceBriefCard(weeklyBrief || model.weeklyBrief, {
    escapeHtml,
    escapeAttr,
    embedded: true,
  });
  // Resumo executivo do período e leitura da semana antecedem as métricas; o comparativo semanal visual fica em Início.
  const executiveSummary = buildPerformanceExecutiveSummary({
    model,
    range,
    projection: achievementProjection,
  });
  const executiveHtml = renderPerformanceExecutiveSummary(executiveSummary, {
    escapeHtml,
    embedded: true,
  });
  const summaryEvidence: EvidenceState | null =
    ['none', 'insufficient_data'].includes(executiveSummary.situation.status) ||
    executiveSummary.situation.confidence === 'insufficient'
      ? 'insufficient'
      : executiveSummary.situation.confidence === 'low'
        ? 'low'
        : executiveSummary.base.smallSample
          ? 'small'
          : null;
  const readingHtml = `<section class="performance-executive chart-card mb-4" id="bloco-resumo" aria-label="Resumo do período e da última semana"><header class="module-heading module-heading--compact mb-3"><div class="flex flex-wrap items-center justify-between gap-2"><h3 class="module-heading__title">Resumo do período</h3>${renderEvidenceBadge(summaryEvidence)}${renderCopyBlockLink('resumo')}${range?.label ? `<span class="text-xs font-medium text-content-secondary bg-surface-subtle px-2.5 py-1 rounded-xs">${escapeHtml(range.label)}</span>` : ''}</div></header>${executiveHtml}${weeklyBriefHtml}</section>`;
  const preparationHtml = renderPreparationReading(preparationReading, {
    escapeHtml,
    escapeAttr,
    rangeLabel: range?.label,
  });
  const followupHtml = renderRecommendationFollowupSummary(recommendationFollowup, { escapeHtml });
  return `${preparationHtml}${followupHtml}${readingHtml}${renderPerformanceSummary(renderPerformanceStory({ title: 'Como sua preparação evoluiu', summary, details: insights }) + secondaryKpis, kpis, method)}${renderPerformanceDetails('Prontidão, trajetória e carga', `${renderAchievementProjection(achievementProjection, { history: achievementHistory, escapeHtml, escapeAttr, weeklyCapacityMinutes: achievementCapacityMinutes, adherenceContext, recoveryPlan })}${readinessChange ? renderReadinessChangeExplanation(readinessChange, { formatDate, escapeHtml }) : ''}<section class="performance-block"><h3>Prontidão ao longo do tempo</h3>${history}</section><div id="performanceReadinessMount"></div>`, 'performance-details performance-details--trajectory')}${renderPerformanceDetails('Comparação, plano e outras mudanças', `${renderPerformanceComparison(comparisonModel || { state: 'disabled' }, { escapeHtml })}${plan}<section class="performance-block"><h3>Principais mudanças</h3>${changes}</section>`)}${renderPerformanceDetails('Como calculamos: termos desta aba', renderGlossary(escapeHtml))}`;
}
