import { renderIconSvg } from '../primitives/icon.js';

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
  const factors = readiness?.factors?.length
    ? `<p>Fatores que mudaram${readiness.confidence ? ` · confiança ${String(readiness.confidence).toLocaleLowerCase('pt-BR')}` : ''}:</p><ul>${readiness.factors.map((factor: any) => `<li>${factor.label}: ${factor.before} → ${factor.after}/100 · contribuição ${factor.contribution > 0 ? '+' : ''}${factor.contribution.toFixed(1).replace('.', ',')} ponto(s)</li>`).join('')}</ul>`
    : '';
  const explanation = readiness?.reason
    ? `<p>${readiness.reason}</p>`
    : readiness && readiness.delta != null
      ? '<p>O índice reúne diferentes sinais, que podem mudar em conjunto. Consulte Desempenho para ver os fatores; não representa probabilidade de aprovação.</p>'
      : '';
  return `<dl class="session-effects" aria-label="Efeitos desta sessão">${rows}</dl>${factors}${explanation}`;
}
function renderAchievement(
  note: Record<string, any> | null | undefined,
  escapeHtml: (value: any) => string
) {
  if (!note?.text) return '';
  return `<p class="session-achievement" data-achievement-note="${note.kind === 'unlocked' ? 'unlocked' : 'near'}">${renderIconSvg('award', { size: 14, className: 'icon-inline' })}<span>${escapeHtml(note.text)}</span></p>`;
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
      ? `<button class="btn tonal small chain-questions-btn" type="button" data-delegated-click="chainQuestionsForTopic('${escapeAttr(model.subjectId)}', '${escapeAttr(model.topicId || '')}')">${renderIconSvg('list-check', { size: 14, className: 'icon-inline' })}Registrar questões deste tópico →</button>`
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
  return `<strong>Sessão registrada</strong><p>${escapeHtml(model.type)} · ${escapeHtml(model.subject)}${model.topic ? ` · ${escapeHtml(model.topic)}` : ''} · ${escapeHtml(model.duration)}${questionSummary}</p>${renderLedger(model.ledger)}${renderEffects(model.effects)}${renderAchievement(model.achievement, escapeHtml)}<small>Seus indicadores foram atualizados.</small>${next}`;
}
