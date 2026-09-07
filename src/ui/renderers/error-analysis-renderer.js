export function renderErrorAnalysis(model,{toolbar='',escapeHtml=value=>String(value)}={}){
  if(model.state==='empty')return toolbar+'<div class="empty-state"><p>'+escapeHtml(model.message)+'</p></div>';
  const items=model.items.map(item=>'<div class="error-profile-item"><span>'+item.icon+' '+escapeHtml(item.label)+'</span><strong>'+item.value+'</strong><small>'+(model.hasPrevious?(item.delta>=0?'+':'')+item.delta+' vs. período anterior':'Sem período anterior')+'</small></div>').join('');
  const diagnosis='<section class="error-diagnosis '+model.state+'"><div><span>Diagnóstico</span><strong>'+escapeHtml(model.diagnosis)+'</strong></div><div><span>Ação</span><strong>'+escapeHtml(model.action)+'</strong></div></section>';
  return toolbar+diagnosis+'<div class="error-profile-grid">'+items+'</div><div class="analytics-note">'+model.coverage+'% dos '+model.totalErrors+' erros estão categorizados · confiança '+escapeHtml(model.confidence.label.toLowerCase())+' · '+escapeHtml(model.periodLabel)+'.</div>';
}
