import { escapeHtml as defaultEscapeHtml } from '../../core/utils.js';
import { formatDecimal } from '../../core/format-number.js';
import { formatDateBR } from '../../core/format-date.js';
type Row = Record<string, any>;

export function renderAchievementGroups(model: Row, { escapeHtml = defaultEscapeHtml }: any = {}) {
  const progress = (item: Row) => {
    if (item.unlocked || !item.progress || !(Number(item.progress.target) > 0)) return '';
    const current = Math.max(0, Number(item.progress.current) || 0),
      target = Number(item.progress.target),
      percent = Math.min(100, Math.round((current / target) * 100));
    const format = (value: number) =>
      item.progress.unit === 'horas' ? formatDecimal(value) : String(Math.floor(value));
    return `<div class="badge-progress" role="progressbar" aria-label="Progresso de ${escapeHtml(item.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-valuetext="${format(current)} de ${format(target)} ${escapeHtml(item.progress.unit)}"><span style="width:${percent}%"></span></div><small class="badge-progress-label">${format(current)} / ${format(target)} ${escapeHtml(item.progress.unit)}</small>`;
  };
  const unlockDate = (item: Row) => {
    if (!item.unlocked || !item.unlock) return '';
    const { unlockedAt, recordedAt } = item.unlock;
    const text = unlockedAt
      ? `Desbloqueada em ${formatDateBR(unlockedAt)}`
      : recordedAt
        ? `Desbloqueada antes de ${formatDateBR(recordedAt)}`
        : '';
    return text ? `<small class="badge-date">${escapeHtml(text)}</small>` : '';
  };
  const card = (item: Row) =>
    `<article class="badge-card${item.unlocked ? ' unlocked' : ''}" aria-label="${escapeHtml(item.name)}: ${item.unlocked ? 'desbloqueada' : 'bloqueada'}">${item.id ? `<img class="badge-image" src="assets/achievements/${escapeHtml(item.id)}.png" alt="" width="64" height="64" loading="lazy" decoding="async">` : ''}<div class="badge-name">${escapeHtml(item.name)}</div><div class="badge-desc">${escapeHtml(item.desc)}</div>${unlockDate(item)}${progress(item)}${!item.unlocked && item.guidance ? `<p class="badge-guidance">${escapeHtml(item.guidance)}</p>` : ''}${!item.unlocked && item.missing?.length ? `<ul class="badge-missing">${item.missing.map((value: any) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>` : ''}${!item.unlocked ? '<span class="badge-status">A conquistar</span>' : ''}</article>`;
  const categories = [
    ['consistency', 'Consistência'],
    ['learning', 'Aprendizado'],
    ['strategy', 'Estratégia'],
  ];
  const groups = (items: Row[]) =>
    categories
      .map(([key, label]) => {
        const rows = items.filter((item: any) => (item.category || 'learning') === key);
        return rows.length
          ? `<section class="achievement-category" aria-label="${label}"><h4>${label}</h4><div class="badges-grid-list">${rows.map(card).join('')}</div></section>`
          : '';
      })
      .join('');
  const unlocked = model.unlocked.length
    ? `<div class="achievement-section"><h4>Desbloqueadas <span>${model.unlockedCount}</span></h4>${groups(model.unlocked)}</div>`
    : '<div class="achievement-empty">Ainda não há conquistas desbloqueadas. Registre seu primeiro estudo para começar.</div>';
  const locked = model.locked.length
    ? `<details class="achievement-section achievement-upcoming"><summary>Próximas conquistas <span>${model.remainingCount}</span></summary>${groups(model.locked)}</details>`
    : '';
  return `<div class="achievement-groups" data-achievements-total="${model.total}">${unlocked}${locked}</div>`;
}
