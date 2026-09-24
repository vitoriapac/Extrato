export function renderQuestionAnalyticsSummary({resolved,accuracy,coverage,trend}){
  return [
    ['Questões analisadas',resolved],
    ['Taxa de acerto',accuracy===null?'—':`${accuracy}%`],
    ['Cobertura por tópico',`${coverage}%`],
    ['Tendência',`${trend.icon} ${trend.label}`]
  ].map(([label,value])=>`<div class="stat-cell"><div class="n">${value}</div><div class="l">${label}</div></div>`).join('');
}

export function renderTopicQuestionPerformance({mode,topics,visible,masteryForTopic,renderFooter,visibleLimit,escapeHtml}){
  const tabs=`<div class="analytics-view-tabs" role="group" aria-label="Filtrar desempenho por dados"><button class="btn small ${mode==='with-data'?'':'ghost'}" data-delegated-click="setPerformanceViewMode('with-data')">Com dados</button><button class="btn small ${mode==='insufficient'?'':'ghost'}" data-delegated-click="setPerformanceViewMode('insufficient')">Amostra insuficiente</button><button class="btn small ${mode==='without-data'?'':'ghost'}" data-delegated-click="setPerformanceViewMode('without-data')">Sem dados</button><button class="btn small ${mode==='all'?'':'ghost'}" data-delegated-click="setPerformanceViewMode('all')">Todos</button></div>`;
  if(!topics.length)return tabs+`<div class="empty-state empty-state--compact"><strong>${mode==='with-data'?'Nenhum tópico possui amostra suficiente':'Nenhum tópico nesta categoria'}</strong><p>${mode==='with-data'?'São necessárias pelo menos 30 questões por tópico para esta visualização.':'Altere o filtro para visualizar os demais tópicos.'}</p></div>`;
  const rows=topics.slice(0,visible).map(topic=>{
    const mastery=masteryForTopic(topic.id),width=topic.accuracy===null?0:topic.accuracy;
    return `<div class="performance-row"><div class="performance-name">${escapeHtml(topic.name)}<div class="performance-meta">${topic.resolved} questões · ${topic.confidence.label} · domínio ${mastery.value==null?'aguardando dados':mastery.value+'/100'}</div></div><div class="performance-track"><div class="performance-fill ${topic.classification.key}" style="width:${width}%"></div></div><div class="performance-value">${topic.classification.icon} ${topic.accuracy===null?'—':topic.accuracy+'%'}</div></div>`;
  }).join('');
  return tabs+rows+renderFooter({variant:'block',total:topics.length,visible:Math.min(visible,topics.length),step:8,label:'tópicos',showMoreAction:'changePerformanceLimit(8)',showAllAction:'showAllPerformance()',showLessAction:visibleLimit>8?'resetPerformanceLimit()':''});
}

export function renderWeeklyQuestionTrend({weeks,trend,formatDate}){
  return `<div class="trend-grid">${weeks.map(week=>`<div class="trend-week ${week.insufficientData?'insufficient':''}"><span>${formatDate(week.start).slice(0,5)}</span><strong>${week.insufficientData?'—':week.accuracy+'%'}</strong><small>${week.resolved} questões</small></div>`).join('')}</div><div class="trend-summary ${trend.key}">${trend.icon} ${trend.label}${trend.delta===null?'':` · ${trend.delta>0?'+':''}${trend.delta.toFixed(1)} p.p.`}</div>`;
}

export function renderQuestionErrorToolbar({days,topicId,topics,escapeHtml,escapeAttr}){
  return `<div class="error-analysis-toolbar"><select aria-label="Período do perfil de erros" data-delegated-change="setErrorAnalysisFilter('days',this.value)">${[7,30,60,90].map(option=>`<option value="${option}" ${days===option?'selected':''}>Últimos ${option} dias</option>`).join('')}</select><select aria-label="Tópico do perfil de erros" data-delegated-change="setErrorAnalysisFilter('topicId',this.value)"><option value="">Todos os tópicos</option>${topics.map(topic=>`<option value="${escapeAttr(topic.id)}" ${topicId===topic.id?'selected':''}>${escapeHtml(topic.name)}</option>`).join('')}</select></div>`;
}
