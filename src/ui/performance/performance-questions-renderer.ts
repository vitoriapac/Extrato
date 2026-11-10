import { formatDateBR } from '../../core/format-date.js';
import { formatDecimal } from '../../core/format-number.js';
import { renderQuestionEvolution } from '../renderers/question-evolution-renderer.js';
import { renderErrorProfileChart } from './error-profile-chart.js';
import { renderMultiLineChart } from '../primitives/charts/charts.js';
import {
  renderPerformanceStory,
  renderPerformanceSummary,
  renderPerformanceDetails,
} from './performance-story.js';

const percent = (value: number | null | undefined) =>
  value == null ? '—' : `${formatDecimal(value)}%`;
const delta = (value: number) =>
  value == null ? 'Sem base anterior' : `${value > 0 ? '+' : ''}${formatDecimal(value)} p.p.`;

export function renderPerformanceQuestions({
  evolution,
  analysis,
  previousAccuracy = null,
  multiSubjectPerformance = null,
  range,
  formatDate,
  escapeHtml,
}: any = {}) {
  if (!analysis.questionCount)
    return '<div class="empty-state empty-state--compact" role="status"><strong>Sem questões neste período</strong><p>Registre questões pessoais vinculadas a tópicos do concurso ativo para acompanhar precisão, volume e erros.</p><button type="button" class="btn ghost small" data-performance-open="questoes">Registrar questões</button></div>';
  const trend =
    range.comparePrevious && analysis.accuracy != null && previousAccuracy != null
      ? analysis.accuracy - previousAccuracy
      : null;
  const kpis = `<section class="performance-kpis" aria-label="Indicadores de questões">
    <article class="performance-kpi"><span>Questões resolvidas</span><strong>${analysis.questionCount}</strong><small>Respostas pessoais no período</small></article>
    <article class="performance-kpi"><span>Precisão</span><strong>${percent(analysis.accuracy)}</strong><small>Acertos ÷ questões resolvidas</small></article>
    <article class="performance-kpi"><span>Erros</span><strong>${analysis.errors}</strong><small>Inclui erros sem categoria</small></article>
    <article class="performance-kpi"><span>Evolução</span><strong>${delta(trend!)}</strong><small>${range.comparePrevious ? 'Precisão × período anterior' : 'Comparação desativada'}</small></article>
  </section>`;
  const buckets = evolution.buckets
    .map(
      (row: any) =>
        `<tr><th scope="row">${escapeHtml(formatDateBR(row.key))}</th><td>${row.resolved}</td><td>${row.correct}</td><td>${row.errors}</td><td>${percent(row.accuracy)}</td></tr>`
    )
    .join('');
  const volume = `<section class="performance-block"><h3>Volume × precisão</h3>${buckets ? `<div class="performance-table-scroll"><table><caption>Acertos, erros e precisão por período; a média móvel exige amostra mínima.</caption><thead><tr><th>Período</th><th>Questões</th><th>Acertos</th><th>Erros</th><th>Precisão</th></tr></thead><tbody>${buckets}</tbody></table></div>` : '<p class="empty-state empty-state--compact">Sem questões neste período.</p>'}</section>`;
  const categories = analysis.errorCategories.filter((item: any) => item.count > 0);
  const errorChart = renderErrorProfileChart({
    categories,
    uncategorizedCount: analysis.uncategorizedErrors,
    totalErrors: analysis.errors || 0,
    escapeHtml,
  });
  const errors = `<section class="performance-block"><h3>Perfil de erros</h3>${errorChart || '<p class="empty-state empty-state--compact">Nenhum erro categorizado neste período.</p>'}</section>`;
  const comparable = analysis.topics.filter((item: any) => item.delta != null);
  const grouped = (title: string, rows: Array<Record<string, any>>) =>
    `<div><h4>${title}</h4>${rows.length ? `<ul class="performance-changes">${rows.map((row: any) => `<li><strong>${escapeHtml(row.name)}</strong><span>${delta(row.delta)} · ${row.beforeTotal} → ${row.afterTotal} questões</span></li>`).join('')}</ul>` : '<p class="analytics-note">Nenhum tópico com 30 questões em cada metade do período.</p>'}</div>`;
  const topics = `<section class="performance-block"><h3>Tópicos em evolução</h3><p class="analytics-note">Comparação entre metades do período. Cada metade precisa de pelo menos 30 questões; a mudança na dificuldade das questões também pode afetar a precisão.</p><div class="performance-topic-groups">${grouped(
    'Maiores evoluções',
    comparable
      .filter((item: any) => item.delta > 0)
      .sort((a: any, b: any) => b.delta - a.delta)
      .slice(0, 5)
  )}${grouped(
    'Maiores quedas',
    comparable
      .filter((item: any) => item.delta < 0)
      .sort((a: any, b: any) => a.delta - b.delta)
      .slice(0, 5)
  )}</div></section>`;
  const summary =
    analysis.accuracy == null
      ? 'Ainda não há precisão calculável.'
      : `Precisão de ${formatDecimal(analysis.accuracy)}% em ${analysis.questionCount} questões respondidas.`;

  const msp = multiSubjectPerformance;
  let multiLineSection = '';
  if (msp && msp.series.length > 0 && msp.periods.length > 0) {
    // Doze linhas viram emaranhado: o gráfico traça as cinco de menor precisão e a lista ao lado traz todas.
    const chartLimit = 5;
    const chartSeries =
      msp.series.length > chartLimit
        ? [...msp.series]
            .sort((a: any, b: any) => (a.overallAccuracy ?? 101) - (b.overallAccuracy ?? 101))
            .slice(0, chartLimit)
        : msp.series;
    const multiChart = renderMultiLineChart({
      series: chartSeries,
      periodLabels: msp.periodLabels,
    });
    const subRows = msp.series
      .map(
        (s: any) =>
          `<li class="flex items-center justify-between gap-2 py-1 text-xs border-b border-border-subtle/50 last:border-b-0"><div class="flex items-center gap-1.5 min-w-0"><span class="subject-color-swatch subject-color-${s.colorSlot} shrink-0" aria-hidden="true"></span><span class="truncate font-medium">${escapeHtml(s.subjectName)}</span></div><div class="shrink-0 text-content-secondary font-data">${s.totalCorrect}/${s.totalResolved} <strong class="text-content-primary">(${s.overallAccuracy ?? '—'}%)</strong></div></li>`
      )
      .join('');

    multiLineSection = `<section class="performance-block" aria-label="Evolução da precisão por disciplina">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 class="m-0">Desempenho por disciplina</h3>
          <p class="analytics-note m-0">Evolução da taxa de acerto nas questões por período, nas cores de cada matéria.${msp.series.length > chartLimit ? ` O gráfico traça as ${chartLimit} de menor precisão; a lista traz as ${msp.series.length}.` : ''}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-3">
        <div class="lg:col-span-2 overflow-x-auto">
          ${multiChart}
        </div>
        <div class="bg-surface-subtle/50 p-4 rounded-default border-t border-border-subtle">
          <div class="mb-3">
            <span class="text-3xl font-semibold font-data text-content-primary">${msp.overallAccuracy ?? '—'}%</span>
            <p class="text-xs text-content-secondary m-0">${msp.totalResolved} questões · ${msp.totalCorrect} acertos</p>
            <span class="text-xs font-medium text-content-secondary mt-1 inline-block">Precisão geral no período</span>
          </div>
          <ul class="m-0 p-0 list-none space-y-1">
            ${subRows}
          </ul>
        </div>
      </div>
    </section>`;
  }

  return `${renderPerformanceSummary(renderPerformanceStory({ title: 'Resultado das questões', summary, details: [trend == null ? 'Evolução sem base comparável.' : `Variação de ${delta(trend)} frente ao período anterior.`, `${analysis.errors} erros no período.`] }), kpis)}${multiLineSection}<section class="performance-block"><h3>Evolução da precisão</h3>${renderQuestionEvolution(evolution, { formatDate })}</section>${renderPerformanceDetails('Volume, erros e tópicos', volume + errors + topics)}`;
}
