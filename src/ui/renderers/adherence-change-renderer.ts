import { formatDelta } from '../../core/format-number.js';
import { formatStudyMinuteDelta } from '../format-study-time.js';
const delta = (value: number) => formatDelta(value);
export function renderAdherenceChangeExplanation(
  model: Record<string, any>,
  { escapeHtml }: any = {}
) {
  if (!model) return '';
  return `<section class="performance-block adherence-change" aria-label="Mudanças de aderência"><header class="module-heading module-heading--compact"><h3 class="module-heading__title">O que mudou?</h3><p class="module-heading__description">${model.state === 'comparable' ? (model.mode === 'equal_elapsed' ? (model.evaluatedDays === 1 ? 'Mesmo dia da semana anterior.' : `Mesmos ${model.evaluatedDays} dias da semana anterior.`) : 'Semanas completas comparáveis.') : 'Evidência para comparação.'}</p></header><p>${escapeHtml(model.message)}</p>${model.changes ? `<p>Crédito temporal ao plano, semana atual até hoje contra o mesmo trecho da anterior: <strong>${delta(model.changes.time)} p.p.</strong> · execução prioritária: <strong>${delta(model.changes.priority)} p.p.</strong>.</p><details><summary>Conferir as mudanças</summary><p>Tempo realizado: ${formatStudyMinuteDelta(model.changes.executedMinutes)} · carga planejada: ${formatStudyMinuteDelta(model.changes.plannedMinutes)} · estudo adicional: ${formatStudyMinuteDelta(model.changes.additionalMinutes)} · classificação: ${delta(model.changes.classifiedCoverage)} p.p.</p>${model.denominatorChanged ? '<p>A carga planejada ou prioritária mudou. A comparação usa o denominador próprio de cada período.</p>' : ''}${model.capacityChanged ? '<p>A capacidade declarada mudou entre os períodos. Isso altera a base do planejamento, sem comprovar a causa da mudança de execução.</p>' : ''}<p>Estas são diferenças observadas, sem atribuição de causalidade ou decomposição de um score único.</p></details>` : ''}</section>`;
}
