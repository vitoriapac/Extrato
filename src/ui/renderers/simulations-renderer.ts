import { formatDecimal } from '../../core/format-number.js';
import { chartSize } from '../primitives/charts/chart-size.js';
import { renderChartFrame } from '../chart-components.js';
import { renderIconSvg } from '../primitives/icon.js';

type Row = Record<string, any>;
type Esc = (value: any) => string;
export function renderSimulationRead({
  item,
  view,
  mobile,
  expanded,
  escapeHtml,
  breakdownHtml = '',
}: {
  item: Row;
  view: Row;
  mobile: boolean;
  expanded: boolean;
  escapeHtml: Esc;
  breakdownHtml?: string;
}) {
  const hasBreakdown = Boolean(item.breakdown?.length);
  const details = `<button class="btn ghost small ${hasBreakdown ? 'has-notes' : ''}" data-delegated-click="toggleBreakdown('${item.id}')">${expanded ? 'Ocultar detalhes' : 'Ver desempenho'}</button>`;
  if (mobile)
    return `<tr class="mobile-history-row" data-id="${item.id}"><td colspan="7"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(view.date)}</div><div class="mobile-card-title">${escapeHtml(view.name)}</div></div><button class="btn ghost small" data-delegated-click="editSimulation('${item.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${view.correct} / ${view.total}</span><strong>Nota ${formatDecimal(view.score)}%</strong>${details}</div></article></td></tr>${expanded ? breakdownHtml : ''}`;
  return `<tr class="history-read-row history-desktop-row" data-id="${item.id}"><td>${escapeHtml(view.date)}</td><td><div class="row-primary">${escapeHtml(view.name)}</div></td><td class="number-cell">${view.correct}</td><td class="number-cell">${view.total}</td><td class="number-cell">${formatDecimal(view.score)}%</td><td>${details}</td><td><button class="btn ghost small" data-delegated-click="editSimulation('${item.id}')">Editar</button></td></tr>${expanded ? breakdownHtml : ''}`;
}

export function renderSimulationBreakdown({
  item,
  subjectOptions,
  subjectIdOf,
  escapeHtml,
  escapeAttr,
}: {
  item: Row;
  subjectOptions: (subjectId: string | null) => Row[];
  subjectIdOf: (row: Row) => string | null;
  escapeHtml: Esc;
  escapeAttr: Esc;
}) {
  const rows = (item.breakdown || [])
    .map((row: any) => {
      const total = Number(row.total) || 0,
        correct = Number(row.correct) || 0,
        subjectId = subjectIdOf(row),
        accuracy = total ? Math.round((correct / total) * 100) : null;
      return `<div class="breakdown-line"><label class="breakdown-subject"><span>Disciplina</span><select class="select-control" data-delegated-change="updateBreakdownRow('${item.id}','${row.id}','subjectId',this.value)"><option value="">Selecione</option>${subjectOptions(
        subjectId
      )
        .map(
          (subject: any) =>
            `<option value="${escapeAttr(subject.id)}" ${subject.id === subjectId ? 'selected' : ''}>${escapeHtml(subject.name)}</option>`
        )
        .join(
          ''
        )}</select></label><label><span>Acertos</span><input type="number" min="0" max="${total || 999}" value="${correct}" placeholder="0" data-delegated-blur="updateBreakdownRow('${item.id}','${row.id}','correct',this.value)"></label><label><span>Questões</span><input type="number" min="0" value="${total}" placeholder="0" data-delegated-blur="updateBreakdownRow('${item.id}','${row.id}','total',this.value)"></label><div class="breakdown-result"><span>Aproveitamento</span><strong>${accuracy == null ? '—' : accuracy + '%'}</strong></div><button class="icon-btn" aria-label="Excluir disciplina do simulado" data-delegated-click="deleteBreakdownRow('${item.id}','${row.id}')">${renderIconSvg('x', { size: 14 })}</button></div>`;
    })
    .join('');
  return `<tr class="breakdown-row"><td colspan="7"><div class="breakdown-box"><strong class="breakdown-title">Desempenho por disciplina</strong><div class="breakdown-list">${rows}</div><button class="btn ghost small breakdown-add-btn" data-delegated-click="addBreakdownRow('${item.id}')">${renderIconSvg('plus', { size: 14, className: 'icon-inline' })}Adicionar disciplina</button></div></td></tr>`;
}

export function renderSimulationEdit({
  item,
  draft,
  escapeAttr,
}: {
  item: Row;
  draft: Row;
  escapeAttr: Esc;
}) {
  const hasBreakdown = Boolean(draft.breakdown?.length);
  return `<tr class="row-editing" data-id="${item.id}"><td colspan="7"><div class="inline-edit-form"><label>Data<input type="date" value="${draft.date || ''}" data-delegated-change="updateSimulationDraft('date',this.value)"></label><label>Nome<input type="text" value="${escapeAttr(draft.nome || '')}" data-delegated-input="updateSimulationDraft('nome',this.value)"></label><label>Acertos<input type="number" min="0" value="${Number(draft.correct) || 0}" ${hasBreakdown ? 'disabled' : ''} data-delegated-input="updateSimulationDraft('correct',this.value)"></label><label>Total<input type="number" min="0" value="${Number(draft.total) || 0}" ${hasBreakdown ? 'disabled' : ''} data-delegated-input="updateSimulationDraft('total',this.value)"></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelSimulationEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveSimulationEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteSimuladoRow('${item.id}')">Excluir</button></div></div></td></tr>`;
}

export function renderSimulationTrendChart({
  items = [],
  scoreFor,
  formatDate,
  escapeHtml,
  targetScore = null,
}: {
  items?: Row[];
  scoreFor: (item: Row) => number;
  formatDate: (date: string) => string;
  escapeHtml: Esc;
  targetScore?: number | string | null;
}) {
  const { width, height } = chartSize(640, 160),
    padLeft = 30,
    padRight = 12,
    padTop = 12,
    padBottom = 26;
  const plotWidth = width - padLeft - padRight,
    plotHeight = height - padTop - padBottom,
    count = items.length;
  const xFor = (index: number) => padLeft + (count === 1 ? 0 : (index / (count - 1)) * plotWidth);
  const scores = items.map(scoreFor);
  // Escala ajustada aos dados (0–100 achatava a linha); a meta entra no intervalo para não sair do gráfico.
  const goalValue =
    Number.isFinite(Number(targetScore)) && targetScore !== null && targetScore !== ''
      ? Math.max(0, Math.min(100, Number(targetScore)))
      : null;
  const known = goalValue === null ? scores : [...scores, goalValue];
  const rawLow = known.length ? Math.min(...known) : 0,
    rawHigh = known.length ? Math.max(...known) : 100;
  const low = Math.max(0, Math.floor((rawLow - 5) / 10) * 10),
    high = Math.min(100, Math.max(low + 20, Math.ceil((rawHigh + 5) / 10) * 10));
  const yFor = (score: number) => padTop + plotHeight - ((score - low) / (high - low)) * plotHeight;
  const gridValues = [0, 1, 2, 3, 4].map(step => low + ((high - low) * step) / 4);
  const points = scores.map((score, index) => `${xFor(index)},${yFor(score)}`).join(' ');
  const grid = gridValues
    .map(
      value =>
        `<line class="chart-grid" x1="${padLeft}" y1="${yFor(value)}" x2="${width - padRight}" y2="${yFor(value)}"></line><text x="2" y="${yFor(value) + 3}">${formatDecimal(value)}%</text>`
    )
    .join('');
  const dots = items
    .map(
      (item, index) =>
        `<circle class="chart-dot" cx="${xFor(index)}" cy="${yFor(scores[index])}" r="3"><title>${escapeHtml(item.nome || 'Simulado')} (${formatDate(item.date)}): ${formatDecimal(scores[index])}%</title></circle>`
    )
    .join('');
  const labels = items
    .map((item: Row, index: number) =>
      // Datas curtas (dd/mm); com muitos pontos, alterna para os rótulos não se sobreporem.
      count > 6 && index % 2 === count % 2
        ? ''
        : `<text x="${xFor(index)}" y="${height - 6}" text-anchor="middle">${escapeHtml(String(formatDate(item.date)).replace(/\/\d{4}$/, ''))}</text>`
    )
    .join('');
  const goal = goalValue;
  const goalLine =
    goal === null
      ? ''
      : `<line class="simulation-goal-line" x1="${padLeft}" x2="${width - padRight}" y1="${yFor(goal)}" y2="${yFor(goal)}"/>`;
  const history = items
    .map(
      (item, index) =>
        `<li><span>${escapeHtml(item.nome || 'Simulado')} · ${formatDate(item.date)}</span><strong>${formatDecimal(scores[index])}%</strong></li>`
    )
    .join('');
  return renderChartFrame({
    title: 'Evolução dos simulados',
    description:
      'Nota registrada em cada prova. O histórico textual apresenta os mesmos resultados.',
    period: items.length ? formatDate(items[0].date) + ' a ' + formatDate(items.at(-1)!.date) : '',
    evidence:
      'Últimos ' +
      items.length +
      ' simulados' +
      (goal === null ? '' : ' · meta configurada ' + goal + '%'),
    legend: [
      { label: 'Nota do simulado', tone: 'primary' },
      ...(goal === null ? [] : [{ label: 'Meta configurada', tone: 'target' }]),
    ],
    // Série com menos de 3 pontos não desenha tendência: os resultados ficam em texto, logo abaixo.
    chart: items.length >= 3
      ? `<div class="chart-scroll" tabindex="0" role="region" aria-label="Gráfico com rolagem horizontal"><svg class="progress-chart-svg" aria-hidden="true" focusable="false" viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;">${grid}${goalLine}<polyline class="chart-line" points="${points}"></polyline>${dots}${labels}</svg></div>`
      : '',
    emptyMessage: items.length
      ? `Com ${items.length === 1 ? '1 simulado' : `${items.length} simulados`} ainda não há tendência para desenhar. Os resultados estão logo abaixo.`
      : 'Registre um simulado para acompanhar a evolução.',
    records: items.length ? '<ol class="simulation-trend-list">' + history + '</ol>' : '',
  });
}

export function renderSimulationRows({
  items = [],
  visible = 5,
  editingId = null,
  renderReadRow,
  renderEditRow,
  renderFooter,
}: {
  items?: Row[];
  visible?: number;
  editingId?: string | null;
  renderReadRow: (item: Row) => string;
  renderEditRow: (item: Row) => string;
  renderFooter: (...args: any[]) => string;
}) {
  if (!items.length)
    return `<tr><td colspan="7"><div class="empty-state" style="border:none;"><p>Nenhum simulado registrado ainda.</p><button class="btn ghost small" data-delegated-click="addSimuladoRow()">${renderIconSvg('plus', { size: 14, className: 'icon-inline' })}Registrar simulado</button></div></td></tr>`;
  const visibleItems = items.slice(0, visible);
  return (
    visibleItems
      .map(item => (editingId === item.id ? renderEditRow(item) : renderReadRow(item)))
      .join('') +
    renderFooter(
      items.length,
      visible,
      5,
      "changeListLimit('simulations',LIST_VIEW_STEPS.simulations,renderSimulados)",
      "changeListLimit('simulations',-listViewState.simulationsVisible,renderSimulados)",
      7,
      'simulados'
    )
  );
}
