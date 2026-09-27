export function renderErrorAnalysis(model,{toolbar='',escapeHtml=value=>String(value)}={}){
  if(model.state==='empty')return toolbar+'<div class="empty-state"><p>'+escapeHtml(model.message)+'</p></div>';
  const items=model.items.filter(item=>item.value>0).sort((a,b)=>b.value-a.value).map(item=>{
    const share=Math.round(item.value/model.totalErrors*100);
    return '<li class="error-profile-item"><span class="error-profile-label">'+item.icon+' '+escapeHtml(item.label)+'</span><span class="error-profile-track" aria-hidden="true"><span style="width:'+share+'%"></span></span><strong class="error-profile-value">'+item.value+' · '+share+'%</strong><small class="error-profile-delta">'+(model.hasPrevious?(item.delta>=0?'+':'')+item.delta+' erro(s) vs. período anterior':'Sem período anterior')+'</small></li>';
  }).join('');
  const diagnosis='<section class="error-diagnosis '+model.state+'"><div><span>Diagnóstico</span><strong>'+escapeHtml(model.diagnosis)+'</strong></div><div><span>Ação</span><strong>'+escapeHtml(model.action)+'</strong></div></section>';
  return toolbar+diagnosis+'<p class="analytics-note">Cada barra mostra a parcela dos '+model.totalErrors+' erros registrados no recorte.</p><ul class="error-profile-grid">'+items+'</ul><div class="analytics-note">'+model.coverage+'% dos '+model.totalErrors+' erros estão categorizados · confiança '+escapeHtml(model.confidence.label.toLowerCase())+' · '+escapeHtml(model.periodLabel)+'.</div>';
}
