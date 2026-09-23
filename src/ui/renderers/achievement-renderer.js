export function renderAchievementGroups(model, { escapeHtml = value => String(value ?? '') } = {}) {
  const progress = item => {
    if (item.unlocked || !item.progress || !(Number(item.progress.target) > 0)) return '';
    const current = Math.max(0, Number(item.progress.current) || 0), target = Number(item.progress.target), percent = Math.min(100, Math.round(current / target * 100));
    const format = value => item.progress.unit === 'horas' ? Number(value).toFixed(1).replace(/\.0$/, '') : String(Math.floor(value));
    return `<div class="badge-progress" role="progressbar" aria-label="Progresso de ${escapeHtml(item.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-valuetext="${format(current)} de ${format(target)} ${escapeHtml(item.progress.unit)}"><span style="width:${percent}%"></span></div><small class="badge-progress-label">${format(current)} / ${format(target)} ${escapeHtml(item.progress.unit)}</small>`;
  };
  const card = item => `<article class="badge-card${item.unlocked ? ' unlocked' : ''}" aria-label="${escapeHtml(item.name)}: ${item.unlocked ? 'desbloqueada' : 'bloqueada'}"><div class="badge-icon" aria-hidden="true">${escapeHtml(item.icon)}</div><div class="badge-name">${escapeHtml(item.name)}</div><div class="badge-desc">${escapeHtml(item.desc)}</div>${progress(item)}<span class="badge-status">${item.unlocked ? 'Desbloqueada' : 'A conquistar'}</span></article>`;
  const unlocked = model.unlocked.length ? `<div class="achievement-section"><h4>Desbloqueadas <span>${model.unlockedCount}</span></h4><div class="badges-grid-list">${model.unlocked.map(card).join('')}</div></div>` : '<div class="achievement-empty">Ainda não há conquistas desbloqueadas. Registre seu primeiro estudo para começar.</div>';
  const locked = model.locked.length ? `<details class="achievement-section achievement-upcoming"><summary>Próximas conquistas <span>${model.remainingCount}</span></summary><div class="badges-grid-list">${model.locked.map(card).join('')}</div></details>` : '';
  return `<div class="achievement-groups" data-achievements-total="${model.total}">${unlocked}${locked}</div>`;
}
