import { coverageEvidence, renderEvidenceBadge } from './evidence-badge.js';
import { formatDecimal, formatPercent, formatPoints } from '../../core/format-number.js';
import { formatStudyMinutes } from '../format-study-time.js';
import { renderBulletBar } from '../primitives/charts/charts.js';
type Row = Record<string, any>;
const value = (number: number | null | undefined, suffix = '') =>
  number == null
    ? 'Sem dados'
    : suffix === '%'
      ? formatPercent(number)
      : `${formatDecimal(number)}${suffix}`;
const signed = (number: number | null | undefined) => (number == null ? '—' : formatPoints(number));
const options = [
  ['gap', 'Distância da meta'],
  ['accuracy', 'Precisão'],
  ['evolution', 'Evolução'],
  ['questions', 'Questões'],
  ['priority', 'Prioridade no plano'],
  ['balance', 'Saldo do plano'],
];
const minutes = (number: number | null | undefined) =>
  number == null ? '—' : formatStudyMinutes(number);
const balance = (number: number | null | undefined) =>
  number == null
    ? '—'
    : number === 0
      ? '0 min'
      : `${number > 0 ? 'faltam ' : 'sobram '}${formatStudyMinutes(Math.abs(number))}`;

export function renderPerformanceSubjectComparison(
  model: Row,
  { escapeHtml, escapeAttr, view = 'table' }: any = {}
) {
  if (!model.rows.length) return '';
  const renderRows = (rows: Row[]) =>
    rows
      .map(
        (item: any) =>
          `<tr><th scope="row"><button type="button" class="performance-topic-link" data-performance-compare-subject="${escapeAttr(item.subjectId)}">${escapeHtml(item.name)}</button></th><td>${item.state === 'insufficient' ? '<span class="performance-sample-note">Amostra insuficiente</span>' : value(item.accuracy, '%')}</td><td>${signed(item.gap)}</td><td>${signed(item.evolution)}</td><td>${item.questions}</td><td>${minutes(item.plannedMinutes)}</td><td>${minutes(item.executedMinutes)}</td><td>${balance(item.balanceMinutes)}</td><td>${item.suggestion ? escapeHtml(item.suggestion) : '—'}</td></tr>`
      )
      .join('');
  const head =
    '<thead><tr><th scope="col">Disciplina</th><th scope="col">Precisão</th><th scope="col">Diferença para a meta</th><th scope="col">Evolução</th><th scope="col">Questões</th><th scope="col">Planejado</th><th scope="col">Realizado</th><th scope="col">Saldo do plano</th><th scope="col">Sugestão</th></tr></thead>';
  const table = (rows: Row[], caption: string) =>
    `<div class="performance-table-scroll"><table><caption>${caption}</caption>${head}<tbody>${renderRows(rows)}</tbody></table></div>`;
  const questionCount = model.rows.reduce((sum: any, item: any) => sum + item.questions, 0),
    belowGoal = model.rows.filter(
      (item: any) => item.state !== 'insufficient' && item.gap < 0
    ).length;
  // Barra de precisão com a marca da meta; com amostra insuficiente a barra mostra o progresso da amostra.
  const preview = (item: any) => {
    const insufficient = item.state === 'insufficient';
    const bar = insufficient
      ? `<span class="ui-progress" role="progressbar" aria-label="${escapeAttr(item.name)} · amostra de questões" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${Math.min(10, item.questions)}"><i style="width:${Math.min(100, item.questions * 10)}%"></i></span>`
      : renderBulletBar({
          value: item.accuracy,
          target: item.target,
          label: `${item.name} · precisão`,
          unit: '%',
          className: 'subject-precision-bar',
        });
    return `<li><button type="button" class="performance-topic-link" data-performance-compare-subject="${escapeAttr(item.subjectId)}">${escapeHtml(item.name)}</button><span>${insufficient ? `Amostra ${item.questions}/10` : value(item.accuracy, '%') + ' · meta de precisão ' + item.target + '%'}</span>${bar}<small>${item.balanceMinutes == null ? '' : `Plano: ${balance(item.balanceMinutes)} · `}${item.questions} questões${item.evolution == null ? ' · evolução sem base comparável' : ' · ' + signed(item.evolution) + ' frente ao período anterior'}</small></li>`;
  };
  const previews = model.rows.map(preview).join('');
  // Os mesmos dados, uma visão por vez: tabela (padrão) ou barras. Cinco linhas à vista; "Mostrar mais" é do montador de listas.
  const asBars = view === 'bars';
  const viewNav = `<div class="performance-modes performance-view-toggle" role="group" aria-label="Formato da comparação">${[
    ['table', 'Tabela'],
    ['bars', 'Barras'],
  ]
    .map(
      ([key, text]) =>
        `<button type="button" class="btn ghost small" data-performance-subject-view="${key}" aria-pressed="${(key === 'bars') === asBars}">${text}</button>`
    )
    .join('')}</div>`;
  const body = asBars
    ? `<ul class="performance-subject-previews">${previews}</ul>`
    : table(model.rows, 'Disciplinas no concurso ativo');
  return `<section class="performance-block performance-subject-comparison" id="bloco-comparacao"><div class="performance-comparison-heading"><div><h3>Comparação entre disciplinas</h3>${renderEvidenceBadge(coverageEvidence(model.measured, model.rows.length), `${model.measured} de ${model.rows.length} disciplinas com 10 questões ou mais no período`)}</div><label>Ordenar por <select class="select-control ui-select-field__control" data-performance-subject-sort>${options.map(([key, label]) => `<option value="${key}" ${model.sort === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div><p class="performance-comparison-summary"><strong>${model.measured} de ${model.rows.length}</strong> disciplinas com amostra · <strong>${questionCount}</strong> questões · <strong>${belowGoal}</strong> abaixo da meta com dados suficientes.</p>${viewNav}${body}</section>`;
}
