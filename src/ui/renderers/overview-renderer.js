export function renderIntelligentAlerts({alerts,additional,currentAction=null,escapeHtml,escapeAttr}){
  if(!alerts.length)return {
    list:'<div class="upcoming-empty">Nenhum alerta no momento — tudo sob controle. 🎉</div>',
    overview:'<p class="overview-alert-empty">Sem alertas prioritários neste momento.</p>'
  };
  const renderAlert=alert=>`<div class="alerta-item alerta-${escapeAttr(alert.nivel)}"><span class="alerta-icon">${escapeHtml(alert.icon||'')}</span><span><strong>${escapeHtml(alert.reason||alert.texto)}</strong><small>${escapeHtml(alert.recommendedAction||'')}</small></span>${alert.severity!=='ok'?`<button class="btn ghost small alert-dismiss" data-delegated-click="dismissIntelligentAlert('${escapeAttr(alert.id)}')">Dispensar 7 dias</button>`:''}</div>`;
  const list=[...alerts,...additional].map(renderAlert).join('');
  const overview=`<div class="overview-alert-list">${alerts.slice(0,2).map(alert=>`<article class="overview-alert alerta-${escapeAttr(alert.severity)}">${alert.topicId&&alert.topicId===currentAction?.topicId&&alert.subjectId===currentAction?.subjectId?'<span class="overview-alert-related">Relacionado à recomendação atual</span>':''}<strong>${escapeHtml(alert.reason||alert.texto)}</strong><small>${escapeHtml(alert.recommendedAction||'')}</small></article>`).join('')}</div>${alerts.length>2?`<p class="overview-alert-empty">+ ${alerts.length-2} alertas ativos</p>`:''}`;
  return {list,overview};
}

export function renderExecutiveSummary({summary,formatMinutes,escapeHtml}){
  const cards=summary.cards.map(card=>`<div class="executive-kpi"><strong>${escapeHtml(card.value)}</strong><span>${escapeHtml(card.label)}</span><small>${escapeHtml(card.detail)}</small></div>`).join('');
  const primary=summary.primaryAction?`<strong>${escapeHtml(summary.primaryAction.title)}</strong><p>${escapeHtml(summary.primaryAction.subject||'')} · ${escapeHtml(summary.primaryAction.topic||'')} · ${formatMinutes(summary.primaryAction.duration)}</p><small>${escapeHtml(summary.primaryAction.reason)}</small>`:'<p>Ainda não há uma prioridade confiável. Cadastre tópicos ou revisões pendentes.</p>';
  return `<div class="executive-kpis">${cards}</div><div class="executive-decision-grid"><section><h4>Prioridade principal</h4>${primary}</section><section><h4>Riscos e oportunidades</h4><p><strong>${summary.riskCount}</strong> risco${summary.riskCount===1?'':'s'} com evidência atual.</p><small>${escapeHtml(summary.opportunityMessage)}</small></section></div>`;
}

export function renderWeeklyCloseSummary(weekly,{escapeHtml,period=null,formatDate=String}={}){
  if(!weekly||weekly.state==='insufficient')return '<p class="analytics-note">Ainda não há evidência suficiente para interpretar o fechamento. Registre sessões e resultados ao longo da semana.</p>';
  const adherence=weekly.adherence?.model?.summary?.temporalAdherence;
  return `<div class="metas-close-metrics"><div><span>Aderência ao plano</span><strong>${adherence==null?'—':Math.round(adherence)+'%'}</strong></div><div><span>Questões resolvidas</span><strong>${weekly.questions?.resolved??0}</strong></div><div><span>Precisão</span><strong>${weekly.questions?.accuracy==null?'—':weekly.questions.accuracy+'%'}</strong></div></div><p>Resumo do fechamento${period?.start&&period?.end?' · '+escapeHtml(formatDate(period.start))+' a '+escapeHtml(formatDate(period.end)):''}. Consulte o fechamento para interpretar sinais e decidir a próxima semana.</p>`;
}
