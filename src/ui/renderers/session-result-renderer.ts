function renderLedger(ledger: Record<string, any>) {
  if (!ledger) return '';
  const line = (label: string, value: Record<string, any> | null | undefined) =>
    value
      ? `<div><dt>${label}</dt><dd>${value.before} → <strong class="session-ledger__after">${value.after}</strong></dd></div>`
      : '';
  const lines = line('Estudado hoje', ledger.studied) + line('Plano de hoje', ledger.plan);
  return `<div class="session-ledger" role="group" aria-label="Lançamento no extrato de hoje"><p class="session-ledger__credit"><span>Lançamento</span><strong>${ledger.credit}</strong></p>${ledger.detail ? `<p class="session-ledger__done">${ledger.detail}</p>` : ''}${lines ? `<dl>${lines}</dl>` : ''}${ledger.completed ? `<p class="session-ledger__done">Atividade do plano concluída · ${ledger.completed.done} de ${ledger.completed.total}</p>` : ''}</div>`;
}
function renderEffects(effects: Record<string, any> | null) {
  if (!effects) return '';
  const { readiness, reviews, goal } = effects;
  const delta =
    readiness?.delta == null
      ? ''
      : readiness.delta === 0
        ? ' <span class="session-effects__delta">sem variação</span>'
        : ` <span class="session-effects__delta">(${readiness.delta > 0 ? '+' : '−'}${Math.abs(readiness.delta)})</span>`;
  const rows =
    (readiness ? `<div><dt>Prontidão</dt><dd>${readiness.text}${delta}</dd></div>` : '') +
    (goal ? `<div><dt>Meta do dia</dt><dd>${goal}</dd></div>` : '') +
    (reviews ? `<div><dt>Revisões agendadas</dt><dd>${reviews.text}</dd></div>` : '');
  return `<dl class="session-effects" aria-label="Efeitos desta sessão">${rows}</dl>`;
}
export function renderSessionResult(
  model: Record<string, any>,
  { escapeHtml = String, escapeAttr = escapeHtml }: any = {}
) {
  const questionSummary = model.questions
    ? ` · ${model.questions.resolved} questões · ${model.questions.correct} acertos (${model.questions.accuracy}%)`
    : '';
  const button =
    '<button class="btn ghost small" type="button" data-delegated-click="openNextSessionAction()">Ver próxima ação</button>';
  const chainQuestionsBtn =
    model.subjectId && model.rawType !== 'questions'
      ? `<button class="btn tonal small chain-questions-btn" type="button" data-delegated-click="chainQuestionsForTopic('${escapeAttr(model.subjectId)}', '${escapeAttr(model.topicId || '')}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icon-tabler-list-check icon-inline" aria-hidden="true"><path d="M3.5 5.5l1.5 1.5l2.5 -2.5"></path><path d="M3.5 11.5l1.5 1.5l2.5 -2.5"></path><path d="M3.5 17.5l1.5 1.5l2.5 -2.5"></path><path d="M11 6l9 0"></path><path d="M11 12l9 0"></path><path d="M11 18l9 0"></path></svg>Registrar questões deste tópico →</button>`
      : '';
  const actionCluster = chainQuestionsBtn
    ? `<div class="session-result-actions">${chainQuestionsBtn}${button}</div>`
    : button;
  const next = model.plan
    ? `<p>Próxima atividade do plano: <strong>${escapeHtml(model.plan.label)}</strong></p>${model.plan.suggestion ? `<p>Sugestão fora do plano: ${escapeHtml(model.plan.suggestion)}</p>` : ''}${actionCluster}`
    : model.next
      ? `<p>${model.next.changed ? 'Nova prioridade' : 'Sua prioridade principal continua sendo'}: <strong>${escapeHtml(model.next.label)}</strong></p>${actionCluster}`
      : model.simulation
        ? '<p>Complete os resultados do simulado para atualizar sua próxima prioridade.</p>'
        : `<p>Consulte a próxima ação sugerida para continuar.</p>${actionCluster}`;
  return `<strong>Sessão registrada</strong><p>${escapeHtml(model.type)} · ${escapeHtml(model.subject)}${model.topic ? ` · ${escapeHtml(model.topic)}` : ''} · ${escapeHtml(model.duration)}${questionSummary}</p>${renderLedger(model.ledger)}${renderEffects(model.effects)}<small>Seus indicadores foram atualizados.</small>${next}`;
}
