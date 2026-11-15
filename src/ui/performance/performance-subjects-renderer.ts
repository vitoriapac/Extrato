import { renderWindowBadge } from './window-badge.js';
import { formatDecimal, formatPoints } from '../../core/format-number.js';
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

type Row = Record<string, any>;
type Esc = (value: any) => string;
const value = (number: number | null | undefined, suffix = '') =>
  number == null ? '—' : `${formatDecimal(number)}${suffix}`;
const signed = (number: number | null | undefined) =>
  number == null ? 'Sem comparação' : formatPoints(number);
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
    compareMode = 'accuracy',
  }: any = {}
) {
  if (model.state === 'empty')
    return '<div class="empty-state empty-state--compact" role="status"><strong>Nenhuma disciplina no concurso ativo</strong><p>Cadastre ou selecione disciplinas e tópicos para acompanhar a evolução.</p></div>';

  const options = model.subjects
    .map(
      (subject: any) =>
        `<option value="${escapeAttr(subject.id)}" ${subject.id === model.subject.id ? 'selected' : ''}>${escapeHtml(subject.name)}</option>`
    )
    .join('');
  const selection = `<div class="performance-toolbar"><label>Disciplina <select class="select-control" data-performance-subject aria-label="Disciplina analisada">${options}</select></label><button type="button" class="btn ghost small" data-analysis-nav="hoje" data-subject-id="${escapeAttr(model.subject.id)}">Ver diagnóstico</button></div>`;
  const kpis = `<section class="performance-kpis" aria-label="Indicadores da disciplina"><article class="performance-kpi"><span>Precisão pessoal ${renderWindowBadge('period', 'Período escolhido')}</span><strong>${value(model.accuracy, '%')}</strong><small>${model.activity.questions} questões · meta de precisão ${model.goal.target}%</small></article><article class="performance-kpi"><span>Domínio médio ${renderWindowBadge('history', 'Estado atual, todo o histórico')}</span><strong>${value(model.mastery, '/100')}</strong><small>${model.masteryEvidence} tópicos com evidência</small></article><article class="performance-kpi"><span>Retenção média ${renderWindowBadge('history', 'Estado atual, todo o histórico')}</span><strong>${value(model.retention, '/100')}</strong><small>${model.retentionEvidence} tópicos com evidência · estado atual</small></article><article class="performance-kpi"><span>Tendência de precisão ${renderWindowBadge('period', 'Período escolhido')}</span><strong>${signed(model.trend)}</strong><small>${range.comparePrevious ? 'Exige 10 questões em cada período' : 'Comparação desativada'}</small></article></section>`;
  const activity = `<section class="performance-block"><h3>Atividade no período</h3><p>${formatStudyMinutes(model.activity.minutes)} estudados · ${model.activity.questions} questões resolvidas · ${model.activity.reviews} revisões concluídas.</p><p class="analytics-note">A precisão vem de questões pessoais; simulados detalhados são avaliados separadamente. Meta de precisão: ${model.goal.target}%.</p></section>`;
  const first = model.topics.slice(0, 5),
    remaining = model.topics.slice(5);
  const topics = `<section class="performance-block"><h3>Tópicos</h3>${first.length ? `<ul class="performance-changes performance-topic-list">${topicRows(first, escapeHtml, escapeAttr)}</ul>${remaining.length ? `<details class="performance-more"><summary>Mostrar mais · +${remaining.length}</summary><ul class="performance-changes performance-topic-list">${topicRows(remaining, escapeHtml, escapeAttr)}</ul></details>` : ''}` : '<p class="empty-state empty-state--compact">Nenhum tópico elegível nesta disciplina.</p>'}</section>`;
  const summary =
    model.activity.questions < 10
      ? `Amostra insuficiente: ${model.activity.questions} questões no período.`
      : `Precisão de ${value(model.accuracy, '%')} frente à meta de precisão de ${model.goal.target}%.`;
  // Quatro leituras da mesma comparação entre disciplinas, uma por vez: precisão (padrão), tendência
  // (antes × agora), progresso e radar.
  const modes: Array<[string, string]> = [
    ['accuracy', 'Precisão'],
    ['trend', 'Tendência'],
    ['progress', 'Progresso'],
    ['radar', 'Radar'],
  ];
  const modeNav = `<nav class="performance-modes" role="group" aria-label="Ver a comparação entre disciplinas por">${modes.map(([key, label]) => `<button type="button" class="btn ghost small" data-performance-compare-mode="${key}" aria-pressed="${key === compareMode}">${label}</button>`).join('')}</nav>`;
  const comparisonModes = `<div class="performance-compare-modes" data-mode="${escapeAttr(compareMode)}">${modeNav}<div data-compare-mode="accuracy">${comparison ? renderPerformanceSubjectComparison(comparison, { escapeHtml, escapeAttr }) : ''}</div><div data-compare-mode="trend">${stabilityMap ? renderStabilityMap(stabilityMap, { escapeHtml, escapeAttr, targets: Object.fromEntries((comparison?.rows || []).filter((row: any) => row.target != null).map((row: any) => [row.subjectId, row.target])) }) : ''}</div><div data-compare-mode="progress" id="compareModeProgressMount"></div><div data-compare-mode="radar" id="compareModeRadarMount"></div></div>`;
  return `${comparisonModes}${selection}${renderPerformanceSummary(renderPerformanceStory({ title: model.subject.name, summary, details: [model.trend == null ? 'Tendência sem base comparável.' : `Tendência: ${signed(model.trend)}`] }), kpis)}${model.activity.questions < 10 ? renderPerformanceSampleState({ name: model.subject.name, current: model.activity.questions, required: 10, message: 'comparar a precisão' }) : ''}<section class="performance-block"><h3>Evolução da precisão · ${escapeHtml(model.subject.name)}</h3>${renderQuestionEvolution(model.evolution, { formatDate })}</section>${renderPerformanceDetails('Atividade e tópicos', activity + topics)}${renderPerformanceTopicDialog(topicDetail, { formatDate, escapeHtml })}<div id="performanceSubjectsSupplementalMount" class="space-y-4 mt-4"></div>`;
}
