import { pluralize } from '../../core/utils.js';
import { formatDecimal } from '../../core/format-number.js';
import { renderChartFrame, renderChartTooltip } from '../chart-components.js';
import {
  buildReadinessEvolution,
  compareReadinessSnapshots,
} from '../../application/analytics/build-readiness-evolution.js';

type Row = Record<string, any>;
const signed = (value: number) => `${value > 0 ? '+' : ''}${formatDecimal(value)}`;
const points = (value: number) => `${signed(value)} ${Math.abs(value) === 1 ? 'ponto' : 'pontos'}`;
const value = (item: Row | null | undefined) => (item ? `${item.score}/100` : '—');

export function renderReadinessHistory(
  items: Row[] = [],
  {
    formatDate,
    escapeHtml,
    current = null,
    today = null,
    activeExamTags = items[0]?.activeExamTags || [],
    showComparisonDetails = true,
  }: any = {}
) {
  const model = buildReadinessEvolution({ snapshots: items, activeExamTags, current, today });
  const currentDelta = model.currentComparison;
  const weekly = model.weeklyComparison;
  const summary = `<div class="readiness-history-summary"><div><span>Prontidão atual</span><strong>${value(model.current)}</strong><small>${model.current ? 'Cálculo atual · confiança do índice: ' + escapeHtml(model.current.confidenceLabel) : 'Aguardando dados atuais'}</small></div><div><span>Último registro salvo</span><strong>${value(model.latest)}</strong><small>${model.latest ? escapeHtml(formatDate(model.latest.date)) : 'Salve um fechamento semanal'}</small></div><div><span>Variação entre fechamentos</span><strong>${weekly.delta === null ? '—' : points(weekly.delta)}</strong><small>${model.weeklyPeriod ? escapeHtml(formatDate(model.weeklyPeriod.start) + ' a ' + formatDate(model.weeklyPeriod.end)) : 'São necessários dois fechamentos'}${weekly.state === 'comparable' ? ' · ' + weekly.trend : ''}</small></div><div><span>Melhor registro comparável</span><strong>${value(model.best)}</strong><small>${model.best ? escapeHtml(formatDate(model.best.date)) : 'Sem registro com a mesma base de cálculo'}</small></div></div>`;
  const notice =
    weekly.state !== 'comparable' && model.weeklyPeriod
      ? `<p class="context-note context-note--info">${escapeHtml(weekly.reason)}</p>`
      : '';
  const factors = (comparison: Row) => {
    if (comparison.state !== 'comparable')
      return `<p class="analytics-note">${escapeHtml(comparison.reason)}</p>`;
    const rows = comparison.factors.filter((item: any) => item.delta !== 0).slice(0, 5);
    return `<p class="analytics-note">${escapeHtml(comparison.reason)}</p>${rows.length ? `<ul class="readiness-factor-changes">${rows.map((item: any) => `<li><strong>${escapeHtml(item.label)} · ${item.delta > 0 ? 'subiu' : 'caiu'}</strong><span>${item.before} → ${item.after}/100 · contribuição ${points(item.contribution)}</span></li>`).join('')}</ul>` : '<p class="analytics-note">Os fatores disponíveis permaneceram estáveis.</p>'}`;
  };
  const explanation =
    model.latest && model.current
      ? `<details class="readiness-history-explanation"><summary>O que mudou desde o último registro?${currentDelta.delta === null ? '' : ' · ' + points(currentDelta.delta)}</summary>${factors(currentDelta)}</details>`
      : '';
  const weeklyFactors = model.weeklyPeriod
    ? `<details class="readiness-history-explanation"><summary>Fatores da variação entre fechamentos</summary>${factors(weekly)}</details>`
    : '';
  const rows = model.history.slice(-12),
    width = 640,
    height = 152,
    left = 32,
    right = 16,
    top = 12,
    bottom = 27,
    plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const x = (index: number) =>
    left + (rows.length === 1 ? plotWidth / 2 : (index * plotWidth) / (rows.length - 1));
  const y = (score: number) =>
    top + plotHeight - (Math.max(0, Math.min(100, Number(score))) / 100) * plotHeight;
  const grid = [0, 25, 50, 75, 100]
    .map(
      score =>
        `<line class="chart-grid" x1="${left}" y1="${y(score)}" x2="${width - right}" y2="${y(score)}"></line><text x="1" y="${y(score) + 3}">${score}</text>`
    )
    .join('');
  const lines = rows
    .slice(1)
    .map((item, index) =>
      compareReadinessSnapshots(rows[index], item).state === 'comparable'
        ? `<line class="chart-line" x1="${x(index)}" y1="${y(rows[index].score)}" x2="${x(index + 1)}" y2="${y(item.score)}"/>`
        : ''
    )
    .join('');
  const dots = rows
    .map(
      (item, index) =>
        `<circle class="chart-dot" cx="${x(index)}" cy="${y(item.score)}" r="4">${renderChartTooltip(formatDate(item.date) + ': ' + item.score + '/100 · algoritmo ' + (item.algorithmVersion ?? 'não informado') + ' · ' + (item.reason || 'Fechamento semanal'))}</circle>`
    )
    .join('');
  const chart = rows.length
    ? `<svg class="progress-chart-svg" aria-hidden="true" focusable="false" viewBox="0 0 ${width} ${height}">${grid}${lines}${dots}</svg>`
    : '';
  const records = rows.length
    ? `<ol class="simulation-trend-list readiness-history-records">${[...rows]
        .reverse()
        .map(
          item =>
            `<li><span>${escapeHtml(formatDate(item.date))} · ${escapeHtml(item.reason || 'Fechamento semanal')}</span><strong>${item.score}/100</strong><small>Algoritmo ${escapeHtml(item.algorithmVersion ?? 'não informado')} · confiança do índice: ${escapeHtml(item.confidenceLabel || 'não informada')}</small></li>`
        )
        .join('')}</ol>`
    : '';
  return (
    summary +
    notice +
    (showComparisonDetails ? explanation + weeklyFactors : '') +
    renderChartFrame({
      title: 'Evolução do Índice de Prontidão',
      description:
        'Cada ponto preserva o valor registrado. As linhas ligam apenas registros com o mesmo algoritmo, pesos e fatores disponíveis.',
      period: rows.length ? formatDate(rows[0].date) + ' a ' + formatDate(rows.at(-1)!.date) : '',
      evidence: rows.length
        ? rows.length +
          ' registros mais recentes em sequência · ' +
          model.history.length +
          ' no histórico' +
          (model.versionChanges
            ? ' · ' + pluralize(model.versionChanges, 'mudança') + ' de algoritmo'
            : '')
        : 'O histórico é separado por concurso. O valor atual não é salvo a cada atualização da tela.',
      legend: [{ label: 'Prontidão salva', tone: 'primary' }],
      chart,
      records,
      emptyMessage:
        'Salve um fechamento semanal para iniciar o histórico de prontidão deste concurso.',
    })
  );
}
