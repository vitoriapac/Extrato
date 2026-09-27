const fmt=value=>`${Math.floor(value/60)}h${String(value%60).padStart(2,'0')}`;

export function renderPlanExecution(model,{formatDate}){
  const scale=Math.max(60,model.capacityMinutes,model.plannedMinutes,model.studiedMinutes);
  const summary=`<div class="plan-execution-summary"><div><span>Capacidade semanal</span><strong>${fmt(model.capacityMinutes)}</strong><span class="plan-execution-track"><i style="width:${model.capacityMinutes/scale*100}%"></i></span></div><div><span>Planejado nos dias</span><strong>${fmt(model.plannedMinutes)}</strong><span class="plan-execution-track is-planned"><i style="width:${model.plannedMinutes/scale*100}%"></i></span></div><div><span>Estudado até hoje</span><strong>${fmt(model.studiedMinutes)}</strong><span class="plan-execution-track is-studied"><i style="width:${model.studiedMinutes/scale*100}%"></i></span></div></div>`;
  const warning=model.plannedMinutes>model.capacityMinutes?'<aside class="context-note context-note--attention"><strong>Atenção</strong><p>O tempo planejado nos dias supera a capacidade semanal informada. Revise a distribuição antes de confirmar novos planos.</p></aside>':'';
  const unplanned=model.state==='unplanned'?'<div class="ui-state--empty">Nenhum plano diário registrado nesta semana. Distribua o plano semanal para comparar o planejado com o estudo real.</div>':'';
  const days=model.days.map(item=>`<li><span>${formatDate(item.date).slice(0,5)}${item.future?' · futuro':''}</span><div class="plan-execution-pair"><span class="plan-execution-track is-planned" aria-hidden="true"><i style="width:${item.plannedMinutes===null?0:Math.min(100,item.plannedMinutes/Math.max(item.plannedMinutes,item.studiedMinutes,1)*100)}%"></i></span><span class="plan-execution-track is-studied" aria-hidden="true"><i style="width:${Math.min(100,item.studiedMinutes/Math.max(item.plannedMinutes||0,item.studiedMinutes,1)*100)}%"></i></span></div><strong>${item.plannedMinutes===null?'Sem plano':fmt(item.plannedMinutes)} / ${fmt(item.studiedMinutes)}</strong></li>`).join('');
  const measured=model.history.filter(item=>item.adherence!==null);
  let trend='';
  if(measured.length>=2){
    const width=480,height=136,max=Math.max(100,Math.ceil(Math.max(...measured.map(item=>item.adherence))/50)*50);
    const x=index=>25+index/(measured.length-1)*440,y=value=>104-value/max*86;
    const segments=measured.slice(1).map((item,index)=>`<line x1="${x(index)}" y1="${y(measured[index].adherence)}" x2="${x(index+1)}" y2="${y(item.adherence)}"/>`).join('');
    const points=measured.map((item,index)=>`<circle cx="${x(index)}" cy="${y(item.adherence)}" r="4"/>`).join('');
    trend=`<svg class="plan-adherence-chart" aria-hidden="true" focusable="false" viewBox="0 0 ${width} ${height}"><line class="plan-adherence-grid" x1="25" x2="465" y1="${y(100)}" y2="${y(100)}"/><g class="plan-adherence-line">${segments}</g><g class="plan-adherence-point">${points}</g></svg>`;
  }
  const weeks=model.history.map(item=>`<li><span>${formatDate(item.start).slice(0,5)} a ${formatDate(item.end).slice(0,5)}</span><strong>${item.adherence===null?'Sem plano':item.adherence+'%'}</strong><small>${fmt(item.studiedMinutes)} estudados · ${item.plannedMinutes?fmt(item.plannedMinutes)+' planejados':'nenhum plano registrado'}</small></li>`).join('');
  return `${summary}${warning}${unplanned}<h4>Planejado × realizado nesta semana</h4><p class="analytics-note">Primeira barra: itens planejados. Segunda: sessões registradas, inclusive fora do plano. Dias sem plano permanecem sem percentual.</p><ol class="plan-execution-days">${days}</ol><h4>Cumprimento nas semanas concluídas</h4><p class="analytics-note">Cumprimento = minutos estudados ÷ minutos planejados nos dias. Semanas sem plano não entram na tendência. O período atual ainda está em andamento.</p>${trend||'<div class="ui-state--empty">São necessárias duas semanas concluídas com plano para mostrar a tendência.</div>'}<ol class="plan-adherence-list">${weeks}</ol>`;
}
