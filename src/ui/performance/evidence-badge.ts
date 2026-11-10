import { escapePresentationText } from '../components/presentation.js';

/** Estados de evidência que o produto já calcula; o selo só os torna visíveis no cabeçalho do bloco. */
export type EvidenceState = 'small' | 'low' | 'insufficient';

export const EVIDENCE_LABELS: Record<EvidenceState, string> = {
  small: 'amostra pequena',
  low: 'confiança baixa',
  insufficient: 'sem dados suficientes',
};

export function renderEvidenceBadge(state: EvidenceState | null | undefined, title = ''): string {
  if (!state) return '';
  const attr = title ? ` title="${escapePresentationText(title)}"` : '';
  return `<span class="performance-evidence" data-evidence="${state}"${attr}>${EVIDENCE_LABELS[state]}</span>`;
}

/** Evidência por cobertura: quantas linhas têm amostra suficiente entre todas as linhas do bloco. */
export function coverageEvidence(measured: number, total: number): EvidenceState | null {
  if (!total) return null;
  if (!measured) return 'insufficient';
  return measured < total ? 'small' : null;
}
