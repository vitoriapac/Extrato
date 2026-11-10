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
  return `${label}. Simulados comparáveis em ${formatEvidencePercent(situation.simulationAccuracy)} contra a meta de ${formatEvidencePercent(situation.target)}${band}.${confidence ? ` Confiança ${confidence}.` : ''}`;
}

function changeText(change: PerformanceExecutiveSummary['change']): string {
  if (!change) return 'Sem mudança mensurável com base comparável neste período.';
  const amount =
    change.unit === 'min'
      ? formatStudyMinuteDelta(change.delta)
      : `${formatDelta(change.delta)} ${change.unit}`;
  return `${change.label}: ${amount} frente ao período anterior.`;
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
  { escapeHtml = escapePresentationText }: { escapeHtml?: (value: any) => string } = {}
): string {
  const row = (term: string, text: string) =>
    `<div class="space-y-0.5"><dt class="text-xs font-semibold text-content-secondary">${escapeHtml(term)}</dt><dd class="m-0 text-sm text-content-primary leading-relaxed">${escapeHtml(text)}</dd></div>`;
  return `<section class="performance-executive chart-card mb-4" aria-label="Resumo executivo do período">
    <header class="module-heading module-heading--compact mb-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="module-heading__title">Resumo executivo</h3>
        ${summary.rangeLabel ? `<span class="text-xs font-medium text-content-secondary bg-surface-subtle px-2.5 py-1 rounded-xs">${escapeHtml(summary.rangeLabel)}</span>` : ''}
      </div>
    </header>
    <dl class="m-0 grid grid-cols-1 md:grid-cols-3 gap-4">${row('Situação da meta', situationText(summary.situation))}${row('No período', changeText(summary.change))}${row('Base da leitura', baseText(summary.base))}</dl>
    <nav class="ui-filter-bar flex flex-wrap gap-2 pt-3" aria-label="Aprofundar o resumo"><button type="button" class="btn ghost small" data-performance-investigate="diagnosis">Ver diagnóstico</button><button type="button" class="btn ghost small" data-performance-investigate="simulations">Ver simulados</button></nav>
  </section>`;
}
