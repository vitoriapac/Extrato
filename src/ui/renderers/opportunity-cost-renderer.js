import {buildOpportunityCost} from '../../domain/planning/opportunity-cost.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
export function renderOpportunityCost(advice){
 const model=buildOpportunityCost(advice);if(!model)return '';
 const side=(label,item,sign)=>`<div><h5>${label}: ${escape(item.name)}</h5><p>${item.state} · ${sign}${model.minutes} min</p><p>Domínio ${item.mastery==null?'sem dados':item.mastery+'/100'} · impacto ${item.impact==null?'sem dados':item.impact+'/100'}.</p><p>Maior presença histórica entre tópicos medidos: ${item.incidence==null?'sem dados':item.incidence+'%'}.</p><p>${item.beforeMinutes} → ${item.afterMinutes} min.</p></div>`;
 return `<details class="opportunity-cost"><summary>Custo de oportunidade: de onde vêm os ${model.minutes} minutos?</summary>${side('Origem',model.from,'−')}${side('Destino',model.to,'+')}<p>Carga semanal: ${model.budget} → ${model.budget} min.</p><p>${escape(model.limitation)}</p></details>`;
}
