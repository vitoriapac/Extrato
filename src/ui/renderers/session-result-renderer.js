function renderLedger(ledger){
  if(!ledger)return '';
  const line=(label,value)=>`<div><dt>${label}</dt><dd>${value.before} → <strong class="session-ledger__after">${value.after}</strong></dd></div>`;
  return `<div class="session-ledger" role="group" aria-label="Lançamento no extrato de hoje"><p class="session-ledger__credit"><span>Lançamento</span><strong>${ledger.credit}</strong></p><dl>${line('Estudado hoje',ledger.studied)}${ledger.plan?line('Plano de hoje',ledger.plan):''}</dl>${ledger.completed?`<p class="session-ledger__done">Atividade do plano concluída · ${ledger.completed.done} de ${ledger.completed.total}</p>`:''}</div>`;
}
export function renderSessionResult(model,{escapeHtml}={}){
  const questionSummary=model.questions?` · ${model.questions.resolved} questões · ${model.questions.correct} acertos (${model.questions.accuracy}%)`:'';
  const next=model.next?`<p>${model.next.changed?'Nova prioridade':'Sua prioridade principal continua sendo'}: <strong>${escapeHtml(model.next.label)}</strong></p><button class="btn ghost small" type="button" data-delegated-click="openNextSessionAction()">Ver próxima ação</button>`:model.simulation?'<p>Complete os resultados do simulado para atualizar sua próxima prioridade.</p>':'<p>Consulte a próxima ação sugerida para continuar.</p><button class="btn ghost small" type="button" data-delegated-click="openNextSessionAction()">Ver próxima ação</button>';
  return `<strong>Sessão registrada</strong><p>${escapeHtml(model.type)} · ${escapeHtml(model.subject)}${model.topic?` · ${escapeHtml(model.topic)}`:''} · ${escapeHtml(model.duration)}${questionSummary}</p>${renderLedger(model.ledger)}<small>Seus indicadores foram atualizados.</small>${next}`;
}
