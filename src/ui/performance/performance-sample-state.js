const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function renderPerformanceSampleState({name='Esta análise',current=0,required=10,message='comparar a precisão',unit='questões',singular='questão',actionTab='questoes',actionLabel='Registrar questões',action=true}={}){
  const count=Math.max(0,Math.floor(Number(current)||0)),minimum=Math.max(1,Math.floor(Number(required)||10));
  const remaining=Math.max(0,minimum-count);
  return `<div class="performance-sample-state" role="status"><span class="module-heading__eyebrow">Amostra insuficiente</span><p>${escape(name)} precisa de ${minimum} ${escape(unit)} para ${escape(message)}.</p><strong>${count} de ${minimum} ${escape(unit)}</strong><span class="ui-progress" role="progressbar" aria-label="${escape(unit)} registrados para esta análise" aria-valuemin="0" aria-valuemax="${minimum}" aria-valuenow="${Math.min(count,minimum)}"><i style="width:${Math.min(100,count/minimum*100)}%"></i></span><small>${remaining} ${escape(remaining===1?singular:unit)} ${remaining===1?'restante':'restantes'} para liberar a comparação.</small>${action?`<button type="button" class="btn ghost small" data-performance-open="${escape(actionTab)}">${escape(actionLabel)}</button>`:''}</div>`;
}
