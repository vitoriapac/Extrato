import { renderWindowBadge } from './window-badge.js';
import type { PerformanceExecutiveSummary } from '../../application/performance/build-performance-executive-summary.js';
import { formatDelta } from '../../core/format-number.js';
import { pluralize } from '../../core/utils.js';
import { formatEvidencePercent } from '../evidence-state.js';
import { formatStudyMinuteDelta } from '../format-study-time.js';
import { escapePresentationText } from '../components/presentation.js';

const statusLabels: Record<string, string> = {
  on_track: 'No caminho',
  attention: 'Atenção',
  at_risk: 'Em risco',
};
const confidenceLabels: Record<string, string> = {
  insufficient: 'insuficiente',
  low: 'baixa',
  moderate: 'moderada',
};

function situationText(situation: PerformanceExecutiveSummary['situation']): string {
  const label = statusLabels[situation.status];
  if (!label || situation.target == null || situation.simulationAccuracy == null)
    return 'Dados insuficientes para projetar a meta: faltam simulados comparáveis.';
  const band = situation.band
    ? `; faixa estimada de ${formatEvidencePercent(situation.band.low)} a ${formatEvidencePercent(situation.band.high)}`
    : '';
  const confidence = confidenceLabels[situation.confidence || ''];
  const countNote =
    situation.simulationCount != null
      ? ` (${pluralize(situation.simulationCount, 'simulado', 'simulados')}, todo o histórico)`
      : '';
  // Resultado central na meta, mas o piso da faixa abaixo dela: o selo vem da incerteza, não de um resultado ruim.
  const bandBelowTarget =
    situation.band &&
    situation.simulationAccuracy >= situation.target &&
    situation.band.low < situation.target;
  if (bandBelowTarget && situation.status === 'attention')
    return `${label}. O resultado central dos simulados (${formatEvidencePercent(situation.simulationAccuracy)}) atinge a meta de ${formatEvidencePercent(situation.target)}, mas a faixa estimada de ${formatEvidencePercent(situation.band!.low)} a ${formatEvidencePercent(situation.band!.high)} inclui valores abaixo dela.${confidence ? ` Confiança ${confidence}.` : ''}`;
  return `${label}. Resultado central dos simulados comparáveis${countNote}: ${formatEvidencePercent(situation.simulationAccuracy)}, meta de ${formatEvidencePercent(situation.target)}${band}.${confidence ? ` Confiança ${confidence}.` : ''}`;
}

function changeText(change: PerformanceExecutiveSummary['change']): string {
  if (!change) return 'Sem mudança mensurável com base comparável neste período.';
  const amount =
    change.unit === 'min'
      ? formatStudyMinuteDelta(change.delta)
      : `${formatDelta(change.delta)} ${change.unit}`;
  return `${change.label}: ${amount} frente ao período anterior${change.detail ? ` (${change.detail})` : ''}.`;
}

function baseText(base: PerformanceExecutiveSummary['base']): string {
  const counts = `${pluralize(base.resolved, 'questão', 'questões')} · ${pluralize(base.sessions, 'sessão', 'sessões')}`;
  return base.smallSample
    ? `${counts}. Amostra pequena: leia a precisão como indício.`
    : `${counts}.`;
}

/** Resumo executivo no topo da Visão geral de Desempenho. */
export function renderPerformanceExecutiveSummary(
  summary: PerformanceExecutiveSummary,
  {
    escapeHtml = escapePresentationText,
    embedded = false,
  }: { escapeHtml?: (value: any) => string; embedded?: boolean } = {}
): string {
  const lead = (text: string) =>
    `<p class="performance-executive__lead" data-status="${escapeHtml(summary.situation.status)}">${renderWindowBadge('history', 'Simulados comparáveis, todo o histórico')}${escapeHtml(text)}</p>`;
  const row = (term: string, text: string) =>
    `<div class="space-y-1"><dt class="text-xs font-semibold text-content-secondary">${escapeHtml(term)}</dt><dd class="m-0 text-sm text-content-primary leading-relaxed">${escapeHtml(text)}</dd></div>`;
  const body = `${lead(situationText(summary.situation))}
    <dl class="m-0 grid grid-cols-1 md:grid-cols-2 gap-4">${row('No período', changeText(summary.change))}${row('Base da leitura', baseText(summary.base))}</dl>
    <nav class="ui-filter-bar flex flex-wrap gap-2 pt-3" aria-label="Aprofundar o resumo"><button type="button" class="btn ghost small" data-performance-investigate="diagnosis">Ver diagnóstico</button></nav>`;
  // Embutido: o resumo semanal entra no mesmo cartão, com as duas janelas escritas.
  // Embutido, o resumo não repete o que a Leitura e os indicadores logo abaixo já mostram (variação, questões e sessões).
  if (embedded)
    return `${lead(situationText(summary.situation))}${summary.base.smallSample ? `<p class="analytics-note">${escapeHtml(baseText(summary.base))}</p>` : ''}<nav class="ui-filter-bar flex flex-wrap gap-2 pt-3" aria-label="Aprofundar o resumo"><button type="button" class="btn ghost small" data-performance-investigate="diagnosis">Ver diagnóstico</button></nav>`;
  return `<section class="performance-executive chart-card mb-4" aria-label="Resumo executivo do período">
    <header class="module-heading module-heading--compact mb-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="module-heading__title">Resumo executivo</h3>
        ${summary.rangeLabel ? `<span class="text-xs font-medium text-content-secondary bg-surface-subtle px-3 py-1 rounded-xs">${escapeHtml(summary.rangeLabel)}</span>` : ''}
      </div>
    </header>
    ${body}
  </section>`;
}
