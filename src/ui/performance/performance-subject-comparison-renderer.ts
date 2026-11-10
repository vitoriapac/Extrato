import { renderCopyBlockLink } from './block-link.js';
import { formatDecimal } from '../../core/format-number.js';
import { formatStudyMinutes } from '../format-study-time.js';
type Row = Record<string, any>;
const value = (number: number | null | undefined, suffix = '') =>
  number == null ? '—' : `${formatDecimal(number)}${suffix}`;
const signed = (number: number | null | undefined) =>
  number == null ? '—' : `${number > 0 ? '+' : ''}${formatDecimal(number)} p.p.`;
const options = [
  ['gap', 'Distância da meta'],
  ['accuracy', 'Precisão'],
  ['evolution', 'Evolução'],
  ['questions', 'Questões'],
  ['priority', 'Prioridade existente'],
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
  { escapeHtml, escapeAttr }: any = {}
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
  const first = model.rows.slice(0, 5),
    rest = model.rows.slice(5);
  const questionCount = model.rows.reduce((sum: any, item: any) => sum + item.questions, 0),
    belowGoal = model.rows.filter(
      (item: any) => item.state !== 'insufficient' && item.gap < 0
    ).length;
  const previews = first
    .map(
      (item: any) =>
        `<li><button type="button" class="performance-topic-link" data-performance-compare-subject="${escapeAttr(item.subjectId)}">${escapeHtml(item.name)}</button><span>${item.state === 'insufficient' ? `Amostra ${item.questions}/10` : value(item.accuracy, '%') + ' · meta ' + item.target + '%'}</span><span class="ui-progress" role="progressbar" aria-label="${escapeAttr(item.name)} · ${item.state === 'insufficient' ? 'amostra de questões' : 'precisão'}" aria-valuemin="0" aria-valuemax="${item.state === 'insufficient' ? 10 : 100}" aria-valuenow="${item.state === 'insufficient' ? Math.min(10, item.questions) : Math.min(100, Math.max(0, item.accuracy ?? 0))}"><i style="width:${item.state === 'insufficient' ? Math.min(100, item.questions * 10) : Math.min(100, Math.max(0, item.accuracy ?? 0))}%"></i></span><small>${item.balanceMinutes == null ? '' : `Plano: ${balance(item.balanceMinutes)} · `}${item.questions} questões${item.evolution == null ? ' · evolução sem base comparável' : ' · ' + signed(item.evolution) + ' frente ao período anterior'}</small></li>`
    )
    .join('');
  return `<section class="performance-block performance-subject-comparison" id="bloco-comparacao"><div class="performance-comparison-heading"><div><h3>Comparação entre disciplinas</h3>${renderCopyBlockLink('comparacao')}<p class="analytics-note">Precisão usa questões pessoais do período e exige 10 respostas. Evolução exige 10 respostas em cada período. Planejado e realizado são o tempo das atividades do plano e o estudo registrado no período; o saldo é a diferença. A sugestão é o tópico de maior prioridade já calculado para a disciplina.</p></div><label>Ordenar por <select class="select-control" data-performance-subject-sort>${options.map(([key, label]) => `<option value="${key}" ${model.sort === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div><p class="performance-comparison-summary"><strong>${model.measured} de ${model.rows.length}</strong> disciplinas com amostra · <strong>${questionCount}</strong> questões · <strong>${belowGoal}</strong> abaixo da meta com dados suficientes.</p><ul class="performance-subject-previews">${previews}</ul><details class="performance-more"><summary>Ver tabela detalhada</summary>${table(first, 'Disciplinas no concurso ativo')}${rest.length ? table(rest, 'Outras disciplinas no concurso ativo') : ''}</details></section>`;
}
