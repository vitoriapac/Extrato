import { formatDecimal } from '../../core/format-number.js';
import { formatStudyMinutes } from '../format-study-time.js';
import { renderQuestionEvolution } from '../renderers/question-evolution-renderer.js';
import { renderPerformanceTopicDialog } from './performance-topic-renderer.js';
import {
  renderPerformanceStory,
  renderPerformanceSummary,
  renderPerformanceDetails,
} from './performance-story.js';
import { renderPerformanceSubjectComparison } from './performance-subject-comparison-renderer.js';
import { renderStabilityMap } from './stability-map-renderer.js';
import { renderPerformanceSampleState } from './performance-sample-state.js';
import { renderPedagogicalMatrixChart } from '../primitives/charts/charts.js';

type Row = Record<string, any>;
type Esc = (value: any) => string;
const value = (number: number | null | undefined, suffix = '') =>
  number == null ? '—' : `${formatDecimal(number)}${suffix}`;
const signed = (number: number | null | undefined) =>
  number == null ? 'Sem comparação' : `${number > 0 ? '+' : ''}${formatDecimal(number)} p.p.`;
const topicRows = (items: Row[], escapeHtml: Esc, escapeAttr: Esc) =>
  items
    .map(
      (row: any) =>
        `<li><button type="button" class="performance-topic-link" data-performance-topic="${escapeAttr(row.id)}">${escapeHtml(row.name)}</button><span>${value(row.accuracy, '%')} · ${row.questions} questões · ${row.delta == null ? 'tendência indisponível' : signed(row.delta)} · ${escapeHtml(row.state)}</span></li>`
    )
    .join('');

export function renderPerformanceSubjects(
  model: Row,
  {
    range,
    formatDate,
    escapeHtml,
    escapeAttr,
    topicDetail = null,
    comparison = null,
    stabilityMap = null,
    pedagogicalMatrix = null,
  }: any = {}
) {
  if (model.state === 'empty')
    return '<div class="empty-state empty-state--compact" role="status"><strong>Nenhuma disciplina no concurso ativo</strong><p>Cadastre ou selecione disciplinas e tópicos para acompanhar a evolução.</p></div>';

  const matrix = pedagogicalMatrix;
  let matrixSection = '';
  if (matrix && matrix.items && matrix.items.length > 0) {
    const matrixChart = renderPedagogicalMatrixChart({
      items: matrix.items,
      thresholdMastery: matrix.thresholdMastery,
      thresholdRetention: matrix.thresholdRetention,
    });
    const counts = matrix.quadrantCounts;
    // No celular a dispersão não cabe com rótulos legíveis: a lista ordena as disciplinas de menor domínio.
    const matrixRanked = `<ol class="matrix-ranked" aria-label="Disciplinas ordenadas por menor domínio">${[
      ...matrix.items,
    ]
      .sort((a: Row, b: Row) => a.mastery - b.mastery)
      .map(
        (item: Row) =>
          `<li><span>${escapeHtml(item.name)}</span><span>domínio ${value(item.mastery, '%')} · retenção ${value(item.retention, '%')}</span></li>`
      )
      .join('')}</ol>`;
    matrixSection = `<section class="performance-block" aria-label="Matriz de Domínio versus Retenção">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div class="min-w-0">
          <h3 class="m-0">Matriz Pedagógica: Domínio × Retenção</h3>
          <p class="analytics-note m-0">Dispersão em 4 quadrantes cruzando aproveitamento e memória. As esferas recebem a cor oficial e tamanho relativo às horas estudadas.</p>
        </div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro font-medium text-content-secondary">
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green inline-block"></span>Consolidadas: ${counts.consolidated}</span>
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber inline-block"></span>Atenção: ${counts.forgetting_risk + counts.building}</span>
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red inline-block"></span>Críticas: ${counts.critical}</span>
        </div>
      </div>
      <div class="matrix-chart-scroll mt-3 overflow-x-auto">${matrixChart}</div>${matrixRanked}
    </section>`;
  }

  const options = model.subjects
    .map(
      (subject: any) =>
        `<option value="${escapeAttr(subject.id)}" ${subject.id === model.subject.id ? 'selected' : ''}>${escapeHtml(subject.name)}</option>`
    )
    .join('');
  const selection = `<div class="performance-toolbar"><label>Disciplina <select class="select-control" data-performance-subject aria-label="Disciplina analisada">${options}</select></label><button type="button" class="btn ghost small" data-analysis-nav="hoje" data-subject-id="${escapeAttr(model.subject.id)}">Ver diagnóstico</button></div>`;
  const kpis = `<section class="performance-kpis" aria-label="Indicadores da disciplina"><article class="performance-kpi"><span>Precisão pessoal</span><strong>${value(model.accuracy, '%')}</strong><small>${model.activity.questions} questões · meta ${model.goal.target}%</small></article><article class="performance-kpi"><span>Domínio médio</span><strong>${value(model.mastery, '/100')}</strong><small>${model.masteryEvidence} tópicos com evidência</small></article><article class="performance-kpi"><span>Retenção média</span><strong>${value(model.retention, '/100')}</strong><small>${model.retentionEvidence} tópicos com evidência · estado atual</small></article><article class="performance-kpi"><span>Tendência de precisão</span><strong>${signed(model.trend)}</strong><small>${range.comparePrevious ? 'Exige 10 questões em cada período' : 'Comparação desativada'}</small></article></section>`;
  const activity = `<section class="performance-block"><h3>Atividade no período</h3><p>${formatStudyMinutes(model.activity.minutes)} estudados · ${model.activity.questions} questões resolvidas · ${model.activity.reviews} revisões concluídas.</p><p class="analytics-note">A precisão vem de questões pessoais; simulados detalhados são avaliados separadamente. Meta de precisão: ${model.goal.target}%.</p></section>`;
  const first = model.topics.slice(0, 5),
    remaining = model.topics.slice(5);
  const topics = `<section class="performance-block"><h3>Tópicos</h3>${first.length ? `<ul class="performance-changes performance-topic-list">${topicRows(first, escapeHtml, escapeAttr)}</ul>${remaining.length ? `<details class="performance-more"><summary>Mostrar mais · +${remaining.length}</summary><ul class="performance-changes performance-topic-list">${topicRows(remaining, escapeHtml, escapeAttr)}</ul></details>` : ''}` : '<p class="empty-state empty-state--compact">Nenhum tópico elegível nesta disciplina.</p>'}</section>`;
  const summary =
    model.activity.questions < 10
      ? `Amostra insuficiente: ${model.activity.questions} questões no período.`
      : `Precisão de ${value(model.accuracy, '%')} frente à meta de ${model.goal.target}%.`;
  return `${comparison ? renderPerformanceSubjectComparison(comparison, { escapeHtml, escapeAttr }) : ''}${stabilityMap ? renderStabilityMap(stabilityMap, { escapeHtml, escapeAttr }) : ''}${selection}${renderPerformanceSummary(renderPerformanceStory({ title: model.subject.name, summary, details: [model.trend == null ? 'Tendência sem base comparável.' : `Tendência: ${signed(model.trend)}`] }), kpis)}${model.activity.questions < 10 ? renderPerformanceSampleState({ name: model.subject.name, current: model.activity.questions, required: 10, message: 'comparar a precisão' }) : ''}<section class="performance-block"><h3>Evolução da precisão · ${escapeHtml(model.subject.name)}</h3>${renderQuestionEvolution(model.evolution, { formatDate })}</section>${renderPerformanceDetails('Atividade e tópicos', activity + topics)}${matrixSection}${renderPerformanceTopicDialog(topicDetail, { formatDate, escapeHtml })}<div id="performanceSubjectsSupplementalMount" class="space-y-4 mt-4"></div>`;
}
