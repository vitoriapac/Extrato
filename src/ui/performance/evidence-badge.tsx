import type { JSX } from 'preact';
import { escapePresentationText } from '../components/presentation.js';
import { Tooltip } from '../primitives/tooltip.js';

/** Estados de evidência que o produto já calcula; o selo só os torna visíveis no cabeçalho do bloco. */
export type EvidenceState = 'small' | 'low' | 'insufficient';

export const EVIDENCE_LABELS: Record<EvidenceState, string> = {
  small: 'amostra pequena',
  low: 'evidência baixa',
  insufficient: 'sem dados suficientes',
};

export function renderEvidenceBadge(state: EvidenceState | null | undefined, title = ''): string {
  if (!state) return '';
  const attr = title ? ` title="${escapePresentationText(title)}"` : '';
  return `<span class="performance-evidence" data-evidence="${state}"${attr}>${EVIDENCE_LABELS[state]}</span>`;
}

/** Versão declarativa Preact com Tooltip acessível quando há descrição detalhada. */
export function EvidenceBadge({
  state,
  title,
}: {
  state: EvidenceState | null | undefined;
  title?: string;
}): JSX.Element | null {
  if (!state) return null;
  const label = EVIDENCE_LABELS[state];
  if (!title) {
    return (
      <span class="performance-evidence" data-evidence={state}>
        {label}
      </span>
    );
  }
  return (
    <Tooltip content={title} placement="top" align="start">
      <button
        type="button"
        class="performance-evidence border-0 cursor-help appearance-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        data-evidence={state}
      >
        {label}
      </button>
    </Tooltip>
  );
}

/** Evidência por cobertura: quantas linhas têm amostra suficiente entre todas as linhas do bloco. */
export function coverageEvidence(measured: number, total: number): EvidenceState | null {
  if (!total) return null;
  if (!measured) return 'insufficient';
  return measured < total ? 'small' : null;
}
