import { renderEvidenceQuality } from './evidence-quality-renderer.js';
import { renderOpportunityCost } from './opportunity-cost-renderer.js';
const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]
  );
export function renderRecommendationExplanation(
  model: Record<string, any>,
  { headingLevel = 5 }: any = {}
) {
  if (!model) return '';
  const h = `h${headingLevel}`;
  const action = model.suggestedAction || {},
    effect = model.expectedImpact || {};
  const cost = model.opportunityCost
    ? renderOpportunityCost({
        state: 'proposal',
        transferMinutes: model.opportunityCost.minutes,
        weeklyBudgetMinutes: model.opportunityCost.budget,
        from: model.opportunityCost.from,
        to: model.opportunityCost.to,
      })
    : '';
  return `<details class="recommendation-explanation decision-explanation"><summary>O quê, por quê, evidências e consequências</summary><${h}>O que fazer?</${h}><p>${escape(action.label)}${action.minutes == null ? '' : ` · ${action.minutes} min`}${action.questions > 0 ? ` · ${action.questions} questões` : ''}</p><${h}>Por quê?</${h}>${model.reasons?.length ? `<ul>${model.reasons.map((reason: any) => `<li>${escape(reason)}</li>`).join('')}</ul>` : '<p>Justificativa detalhada ainda indisponível para este registro.</p>'}<${h}>Com base em quê?</${h}>${renderEvidenceQuality(model.evidenceQuality || { confidence: model.evidenceSnapshot?.confidence?.evidenceStrength, label: model.evidenceSnapshot?.confidence?.confidenceLabel, reasons: ['Indicadores preservados no registro da recomendação.'] })}${model.evidence?.length ? `<dl>${model.evidence.map((row: any) => `<div><dt>${escape(row.label)}</dt><dd>${escape(row.value)}</dd></div>`).join('')}</dl>` : '<p>Sem indicadores detalhados registrados.</p>'}<${h}>O que muda se eu aceitar?</${h}>${cost}${action.from && action.to ? `<p>${escape(action.from.name)}: ${action.from.beforeMinutes} → ${action.from.afterMinutes} min · ${escape(action.to.name)}: ${action.to.beforeMinutes} → ${action.to.afterMinutes} min.</p>` : ''}<p>${escape(effect.description)}</p>${effect.weeklyPlannedMinutes == null ? '' : `<p>Carga distribuída: ${effect.weeklyPlannedMinutes} → ${effect.weeklyPlannedMinutes} min.</p>`}${effect.weeklyAvailableMinutes == null ? '' : `<p>Disponibilidade: ${effect.weeklyAvailableMinutes} → ${effect.weeklyAvailableMinutes} min.</p>`}<small>${escape(model.limitation)} · Algoritmo ${escape(model.algorithmVersion ?? 'não informado')}${model.createdAt ? ' · registro ' + escape(model.createdAt) : ''}</small></details>`;
}
