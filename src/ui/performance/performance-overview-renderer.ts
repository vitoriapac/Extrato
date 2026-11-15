import { renderWindowBadge } from './window-badge.js';
import { renderWeekSummary } from './week-summary-renderer.js';
import { formatDecimal, formatDelta, formatPoints } from '../../core/format-number.js';
import { presentEvidence } from '../evidence-state.js';
import { formatStudyMinutes, formatStudyMinuteDelta } from '../format-study-time.js';
import { renderReadinessHistory } from '../renderers/readiness-history-renderer.js';
import { renderPerformanceComparison } from './performance-comparison-renderer.js';
import {
  renderPerformanceStory,
  renderPerformanceSummary,
  renderPerformanceDetails,
} from './performance-story.js';
import { renderReadinessChangeExplanation } from './readiness-change-explanation-renderer.js';
import { renderMetricCard, renderEmptyState } from '../components/presentation.js';
import { renderSparkline } from '../primitives/charts/charts.js';
import { renderPlannedVsActualChart } from './planned-actual-chart.js';
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
    : `<span class="performance-kpi__trend">${renderSparkline({ values, label, unit, width: 120, height: 28 })}<small>${values.length} semanas completas</small></span>`;

const glossaryItems: Array<[string, string]> = [
  [
    'Prontidão',
    'Índice de 0 a 100 que combina cobertura, domínio, retenção, consistência e simulados. Não é probabilidade de aprovação.',
  ],
  ['Domínio', 'Desempenho pessoal medido em um tópico ou disciplina, de 0 a 100.'],
  ['Retenção', 'Estimativa de quanto o conteúdo se mantém na memória ao longo das revisões, de 0 a 100.'],
  ['Cobertura', 'Quanto do edital já foi estudado, de 0 a 100 (tópicos concluídos sobre o total).'],
  ['Evidência', 'Quanto confiar em um número do seu estudo: Alta, Média ou Baixa, conforme a quantidade e a variedade de registros. "Base histórica" é a evidência das provas da banca, e "Confiança" é só da faixa projetada.'],
  ['Confiança', 'Só da faixa projetada: o quanto a faixa de nota se apoia em simulados comparáveis.'],
  ['Execução prioritária', 'Parte do tempo planejado para tópicos prioritários que foi executada em sessões vinculadas ao plano.'],
  [
    'Aderência',
    'Tempo realizado que tem crédito compatível com uma atividade do plano. Difere do tempo total estudado.',
  ],
  ['Incidência', 'Percentual das provas do histórico em que o tópico aparece.'],
  [
    'Volume de carga',
    'Minutos estudados divididos pelos minutos planejados no mesmo intervalo. Pode superar 100%.',
  ],
  [
    'Amostra',
    'Dois mínimos, cada um com o seu nome. Amostra da disciplina: 10 respostas para a precisão e 10 em cada período para a evolução. Amostra do tópico e da série: 30 questões para a média móvel e para comparar as metades de um período.',
  ],
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
  const periodBadge = renderWindowBadge('period', range?.label || '');
  const trend: any[] = model.trend || [];
  const kpis = `<p class="performance-kpi-window">${renderWindowBadge('period', range?.label || '')}<span>Os indicadores abaixo seguem o período escolhido.</span></p><section class="performance-kpis ui-metric-group" aria-label="Estado atual no período selecionado">
    ${renderMetricCard({ label: 'Tempo estudado', windowBadge: periodBadge, trend: kpiTrend(trend.map((row: any) => Math.round((row.studiedMinutes / 60) * 10) / 10), 'Tempo estudado por semana completa', 'h'), value: formatStudyMinutes(current.studiedMinutes), detail: `${current.sessionCount || 0} sessões${previous ? ' · ' + formatStudyMinuteDelta(current.studiedMinutes - previous.studiedMinutes) : ''}` })}
    ${card('Questões respondidas', current.resolved ?? 0, '', 'No período selecionado', periodBadge, kpiTrend(trend.map((row: any) => row.resolved), 'Questões por semana completa', 'questões'))}
    ${card('Precisão em questões', current.accuracy, '%', `${current.resolved || 0} questões${current.resolved > 0 && current.resolved < 30 ? ' · amostra pequena' : ''}${previous && previous.resolved >= 30 && current.resolved >= 30 && previous.accuracy != null && current.accuracy != null ? ' · ' + change(current.accuracy - previous.accuracy) + ' p.p.' : ''}`, periodBadge, kpiTrend(trend.map((row: any) => row.accuracy), 'Precisão por semana completa (10 questões ou mais)', '%'))}
    ${current.pagesRead > 0 ? card('Páginas lidas', current.pagesRead, 'pág.', `${current.videoBlocksCompleted ? current.videoBlocksCompleted + ' aulas · ' : ''}Material teórico`, periodBadge) : ''}
  </section>`;
  // A Prontidão aparece uma vez só, na Leitura da preparação; a carga do período fica em "Planejado × realizado".
  const secondaryKpis = `<p class="performance-kpi-window">${renderWindowBadge('period', range?.label || '')}<span>Volume de carga no período escolhido. O dos últimos 7 dias aparece na Leitura da preparação.</span></p><section class="performance-kpis ui-metric-group" aria-label="Carga no período">
    ${card('Volume de carga', current.adherence, '%', current.adherence == null ? 'Sem plano no período' : `${formatStudyMinutes(current.studiedMinutes)} de ${formatStudyMinutes(current.plannedMinutes)} planejados`, periodBadge)}
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
  const plan = `<section class="performance-block"><h3>Planejado × realizado</h3><p class="analytics-note">Volume de carga compara minutos estudados com minutos planejados. Pode superar 100%.</p>${secondaryKpis}${planChart}${weekRows ? `<details class="performance-more mt-3"><summary>Ver tabela semanal detalhada</summary><div class="performance-table-scroll ui-data-table mt-2" tabindex="0" role="region" aria-label="Tabela semanal de planejado e realizado"><table><caption>Semanas com plano ou estudo no período</caption><thead><tr><th scope="col">Semana de</th><th scope="col">Planejado</th><th scope="col">Realizado</th><th scope="col">Volume</th></tr></thead><tbody>${weekRows}</tbody></table></div></details>` : renderEmptyState({ title: 'Sem plano ou estudo no período', message: 'Distribua um plano ou registre uma sessão para comparar planejado e realizado.' })}${model.strategic?.strategicAdherence != null ? `<p class="context-note context-note--info">Execução prioritária: ${formatDecimal(model.strategic.strategicAdherence)}% do tempo prioritário planejado foi executado em sessões vinculadas.</p>` : ''}</section>`;
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
  return `${preparationHtml}${followupHtml}${readingHtml}${renderPerformanceSummary(renderPerformanceStory({ title: 'Como sua preparação evoluiu', summary, details: insights }), kpis, method)}${renderPerformanceDetails('Prontidão, trajetória e carga', `${readinessChange ? renderReadinessChangeExplanation(readinessChange, { formatDate, escapeHtml }) : ''}<section class="performance-block"><h3>Prontidão ao longo do tempo</h3>${history}</section><div id="performanceReadinessMount"></div>`, 'performance-details performance-details--trajectory')}${renderPerformanceDetails('Comparação, plano e outras mudanças', `${renderPerformanceComparison(comparisonModel || { state: 'disabled' }, { escapeHtml })}${plan}<section class="performance-block"><h3>Principais mudanças</h3>${changes}</section>`)}${renderPerformanceDetails('Como ler: termos desta aba', renderGlossary(escapeHtml))}`;
}
