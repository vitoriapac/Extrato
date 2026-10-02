export function renderDailyExecution(model,{escapeHtml,escapeAttr=escapeHtml,formatMinutes,timer=null}={}){
  if(!model||model.state==='invalid_date')return '';
  const {progress,priority}=model,next=priority.nextItem;
  const description=item=>`${escapeHtml(item.topicName||'Sem tópico')} · ${escapeHtml({study:'Teoria',review:'Revisão',questions:'Questões',simulation:'Simulado'}[item.type]||'Estudo')} · ${formatMinutes(Math.ceil(item.remainingSeconds/60))}`;
  const rows=items=>items.map(item=>`<li><strong>${escapeHtml(item.subjectName||'Disciplina')}</strong> · ${description(item)}</li>`).join('');
  const start=next?timer?.active?(timer.planItemId===next.id?'<button type="button" class="btn" data-daily-resume>Retomar sessão</button>':'<button type="button" class="btn" disabled>Finalize a sessão atual</button>'):`<button type="button" class="btn" data-daily-start="${escapeAttr(next.id)}">Iniciar estudo</button>`:'';
  const reasons=next?[...(next.reason?[next.reason]:priority.planned?priority.reasons:[])].slice(0,3):[];
  return `<section class="daily-execution-card" aria-labelledby="dailyExecutionTitle"><header><span class="section-eyebrow">EXECUÇÃO DO DIA</span><h3 id="dailyExecutionTitle">Hoje</h3></header>
    <div class="daily-execution-metrics"><div><strong>${formatMinutes(progress.plannedMinutes)}</strong><span>Planejado</span></div><div><strong>${formatMinutes(Math.round(progress.studiedMinutes))}</strong><span>Realizado hoje</span></div></div>
    ${progress.progress==null?'':`<p>${progress.progress}% das atividades cumpridas</p><progress value="${progress.progress}" max="100" aria-label="Cumprimento das atividades planejadas"></progress>`}
    ${model.guidance?`<p>${escapeHtml(model.guidance)}</p><button type="button" class="btn ghost small" data-delegated-click="navigateKpi('metas')">Abrir planejamento</button>`:''}
    ${next?`<div class="daily-execution-next"><span class="section-eyebrow">PRÓXIMO</span><h4>${escapeHtml(next.subjectName||'Disciplina')}</h4><p>${description(next)}</p>${reasons.length?`<p><strong>Por que agora?</strong> ${escapeHtml(reasons.join(' · '))}</p>`:''}${start}</div>`:model.items.length?'<p role="status">Todas as atividades de hoje foram cumpridas.</p>':''}
    ${priority.action?`<p>Prioridade principal: ${priority.executed?'executada':priority.planned?'prevista no plano':'ainda não acomodada no plano'}.</p>`:''}
    ${priority.unplannedAction?'<p class="analytics-note">A recomendação atual está fora do plano do dia. Confira sua prévia antes de alterar a carga.</p><button type="button" class="btn ghost small" data-delegated-click="navigateKpi(\'hoje\')">Ver recomendação</button>':''}
    ${progress.additionalMinutes>0?`<p class="analytics-note">${formatMinutes(Math.round(progress.additionalMinutes))} de estudo adicional, sem vínculo com uma atividade planejada.</p>`:''}
    ${progress.mismatchedMinutes>0?`<p class="context-note context-note--info">${formatMinutes(Math.round(progress.mismatchedMinutes))} com vínculo ou atividade diferente da planejada. Esse tempo não conclui a tarefa.</p>`:''}
    ${model.needsPlanReview?'<p class="context-note context-note--info">Há atividades geradas por uma versão anterior do plano semanal. Revise a distribuição após a mudança estratégica.</p>':''}
    ${priority.following.length?`<details class="daily-execution-following"><summary>Depois · ${priority.following.length} atividade(s)</summary><ul>${rows(priority.following.slice(0,5))}</ul>${priority.following.length>5?`<details><summary>Mostrar mais</summary><ul>${rows(priority.following.slice(5))}</ul></details>`:''}</details>`:''}
    ${progress.pendingActivities?`<p class="analytics-note">${progress.pendingActivities} atividade(s) pendente(s). <button type="button" class="btn ghost small" data-delegated-click="navigateKpi('hoje')">Revisar pendências</button></p>`:''}</section>`;
}
