export function renderIntelligentAlerts({alerts,additional,escapeHtml,escapeAttr}){
  if(!alerts.length)return {
    list:'<div class="upcoming-empty">Nenhum alerta no momento — tudo sob controle. 🎉</div>',
    overview:'<p class="overview-alert-empty">Sem alertas prioritários neste momento.</p>'
  };
  const renderAlert=alert=>`<div class="alerta-item alerta-${escapeAttr(alert.nivel)}"><span class="alerta-icon">${escapeHtml(alert.icon||'')}</span><span><strong>${escapeHtml(alert.reason||alert.texto)}</strong><small>${escapeHtml(alert.recommendedAction||'')}</small></span>${alert.severity!=='ok'?`<button class="btn ghost small alert-dismiss" data-delegated-click="dismissIntelligentAlert('${escapeAttr(alert.id)}')">Dispensar 7 dias</button>`:''}</div>`;
  const list=alerts.map(renderAlert).join('')+(additional.length?`<details class="alerta-more"><summary>Mostrar mais ${additional.length} alerta${additional.length===1?'':'s'}</summary>${additional.map(renderAlert).join('')}</details>`:'');
  const overview=`<div class="overview-alert-list">${alerts.slice(0,2).map(alert=>`<article class="overview-alert alerta-${escapeAttr(alert.severity)}"><strong>${escapeHtml(alert.reason||alert.texto)}</strong><small>${escapeHtml(alert.recommendedAction||'')}</small></article>`).join('')}</div>${alerts.length>2?`<p class="overview-alert-empty">+ ${alerts.length-2} alertas ativos</p>`:''}`;
  return {list,overview};
}

export function renderExecutiveSummary({summary,formatMinutes,escapeHtml}){
  const cards=summary.cards.map(card=>`<div class="executive-kpi"><strong>${escapeHtml(card.value)}</strong><span>${escapeHtml(card.label)}</span><small>${escapeHtml(card.detail)}</small></div>`).join('');
  const primary=summary.primaryAction?`<strong>${escapeHtml(summary.primaryAction.title)}</strong><p>${escapeHtml(summary.primaryAction.subject||'')} · ${escapeHtml(summary.primaryAction.topic||'')} · ${formatMinutes(summary.primaryAction.duration)}</p><small>${escapeHtml(summary.primaryAction.reason)}</small>`:'<p>Ainda não há uma prioridade confiável. Cadastre tópicos ou revisões pendentes.</p>';
  return `<div class="executive-kpis">${cards}</div><div class="executive-decision-grid"><section><h4>Prioridade principal</h4>${primary}</section><section><h4>Riscos e oportunidades</h4><p><strong>${summary.riskCount}</strong> risco${summary.riskCount===1?'':'s'} com evidência atual.</p><small>${escapeHtml(summary.opportunityMessage)}</small></section></div>`;
}
