import { COMPARISON_THRESHOLDS } from '../../application/performance/build-performance-comparison.js';
/** Critérios que decidem quando um indicador sai de "Estável"; a tabela e os insights da comparação já estão nos KPIs e na história. */
export function renderComparisonCriteria(): string {
  return `<p class="analytics-note">Períodos de mesma duração. Um indicador só sai de "Estável" acima de ${COMPARISON_THRESHOLDS.accuracy} p.p. na precisão, ${COMPARISON_THRESHOLDS.minutes} min no tempo estudado, ${COMPARISON_THRESHOLDS.questions} questões e ${COMPARISON_THRESHOLDS.load} p.p. no volume de carga. A precisão exige 30 questões em cada período; a aderência exige ao menos 1h planejada em cada um.</p>`;
}
