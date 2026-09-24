const PHASES = [
  { id: 'construction', label: 'Construção' },
  { id: 'consolidation', label: 'Consolidação' },
  { id: 'final_stretch', label: 'Reta final' },
  { id: 'final_review', label: 'Revisão final' }
];

export function renderExamPhase(phase, { escapeHtml = value => String(value ?? '') } = {}) {
  const current = phase?.state;
  const undated = current === 'undated' || !current;
  const days = Number.isFinite(Number(phase?.days)) ? `${Math.max(0, Math.floor(Number(phase.days)))} dias restantes` : 'Data da prova não definida';
  const stages = PHASES.map(item => `<li class="exam-phase-step${item.id === current ? ' is-current' : ''}"${item.id === current ? ' aria-current="step"' : ''}><span>${escapeHtml(item.label)}</span></li>`).join('');
  return `<section class="exam-phase" aria-label="Fase de preparação para a prova"><div class="exam-phase-heading"><div><span class="exam-phase-eyebrow">Fase até a prova</span><strong>${escapeHtml(phase?.label || 'Fase não definida')}</strong></div><span class="exam-phase-time">${escapeHtml(days)}</span></div><ol class="exam-phase-steps" aria-label="Etapas de preparação">${stages}</ol><p>${escapeHtml(phase?.strategy || 'Defina a data da prova para ajustar o foco do estudo.')}</p>${undated ? '<small>As etapas serão posicionadas quando você informar a data da prova.</small>' : ''}</section>`;
}

export function renderExamPhaseCompact(phase,{escapeHtml=value=>String(value??'')}={}){
  const label=phase?.label||'Prova sem data',days=Number.isFinite(Number(phase?.days))?`${Math.max(0,Math.floor(Number(phase.days)))} dias restantes`:'Data da prova não definida';
  return `<aside class="exam-phase-compact" aria-label="Fase atual da preparação"><span>Fase atual</span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(days)}</small><p>${escapeHtml(phase?.strategy||'Defina a data da prova para ajustar o foco do estudo.')}</p></aside>`;
}

export function renderAdaptiveAllocationAdvice(advice, { weeklyPlannedMinutes = 0, formatMinutes = value => `${value} min`, escapeHtml = value => String(value ?? '') } = {}) {
  if (advice?.state !== 'proposal') {
    return `<aside class="adaptive-advice is-informative" aria-label="Adaptação de carga"><strong>Adaptação de carga</strong><p>${escapeHtml(advice?.reason || 'Aguardando evidências comparáveis.')}</p></aside>`;
  }
  const from = advice.from || {}, to = advice.to || {};
  const applied = Boolean(advice.applied);
  const rationale=Array.isArray(advice.rationale)&&advice.rationale.length?`<ul class="adaptive-rationale">${advice.rationale.map(reason=>`<li>${escapeHtml(reason)}</li>`).join('')}</ul>`:'';
  return `<section class="adaptive-advice${applied ? ' is-applied' : ''}" aria-label="Sugestão de redistribuição semanal"><div class="adaptive-advice-heading"><div><span class="exam-phase-eyebrow">Ajuste sugerido</span><strong>Redistribuir ${escapeHtml(formatMinutes(advice.transferMinutes))} por semana</strong></div><span class="adaptive-capacity">Capacidade mantida · ${escapeHtml(formatMinutes(weeklyPlannedMinutes))}</span></div><div class="adaptive-transfer"><div><span>De</span><strong>${escapeHtml(from.name || 'Disciplina de origem')}</strong><small>${escapeHtml(formatMinutes(from.beforeMinutes || 0))} → ${escapeHtml(formatMinutes(from.afterMinutes || 0))}</small></div><span class="adaptive-transfer-arrow" aria-hidden="true">→</span><div><span>Para</span><strong>${escapeHtml(to.name || 'Disciplina prioritária')}</strong><small>${escapeHtml(formatMinutes(to.beforeMinutes || 0))} → ${escapeHtml(formatMinutes(to.afterMinutes || 0))}</small></div></div><p>${escapeHtml(advice.reason || 'Ajuste baseado nos indicadores disponíveis.')}</p>${rationale}${applied ? '<small class="adaptive-applied-note" role="status">Aplicado somente à prévia. Confirme o plano para salvar.</small>' : '<button class="btn ghost small" data-delegated-click="useAdaptivePlanAdvice()">Aplicar à prévia</button>'}<p class="adaptive-unsaved-note">Nenhuma alteração será salva até você confirmar o plano.</p></section>`;
}
