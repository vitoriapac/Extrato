import {buildEvidenceQuality} from '../../application/analytics/build-evidence-quality.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
export function renderEvidenceQuality(input={}){
 const model=buildEvidenceQuality(input);
 return `<details class="evidence-quality"><summary>Qualidade da evidência: <strong>${model.level}</strong></summary>${model.counts.length?`<dl>${model.counts.map(row=>`<div><dt>${escape(row.label)}</dt><dd>${row.value}</dd></div>`).join('')}</dl>`:'<p>Volume da amostra não registrado.</p>'}${model.reasons.length?`<ul>${model.reasons.map(reason=>`<li>${escape(reason)}</li>`).join('')}</ul>`:''}<small>${escape(model.limitation)}</small></details>`;
}
