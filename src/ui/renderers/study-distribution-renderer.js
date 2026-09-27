const fmt=value=>`${Math.floor(value/60)}h${String(value%60).padStart(2,'0')}`;

export function renderStudyDistribution(model,{escapeHtml}){
  if(model.state!=='ready')return '<div class="ui-state--empty">Registre planos ou sessões para comparar a distribuição do tempo entre disciplinas.</div>';
  const row=item=>`<li><strong>${escapeHtml(item.name)}</strong><div class="study-distribution-pair"><span>Plano</span><span class="study-distribution-track" aria-hidden="true"><span style="width:${item.plannedShare??0}%"></span></span><b>${item.plannedShare===null?'—':item.plannedShare+'%'}</b><span>Estudo</span><span class="study-distribution-track is-studied" aria-hidden="true"><span style="width:${item.studiedShare??0}%"></span></span><b>${item.studiedShare===null?'—':item.studiedShare+'%'}</b></div><small>${fmt(item.plannedMinutes)} planejados · ${fmt(item.studiedMinutes)} estudados</small></li>`;
  const visible=model.rows.slice(0,8).map(row).join(''),more=model.rows.length>8?`<details class="study-distribution-more"><summary>Ver mais ${model.rows.length-8} disciplinas</summary><ul>${model.rows.slice(8).map(row).join('')}</ul></details>`:'';
  return `<p class="analytics-note">Até hoje nesta semana: ${fmt(model.plannedMinutes)} em planos diários e ${fmt(model.studiedMinutes)} em sessões. Cada percentual usa o total da própria coluna; a comparação é descritiva.</p><ul class="study-distribution-list">${visible}</ul>${more}`;
}
