import { renderColumnChart } from '../primitives/charts/charts.js';
export function renderReviewRead({
  item,
  view,
  mobile,
  escapeHtml,
  escapeAttr,
  daysPill,
  difficultyClass,
  statusClass,
  ratingLabel,
  today,
}: any) {
  if (mobile)
    return `<tr class="mobile-history-row" data-id="${item.id}"><td colspan="8"><article class="mobile-history-card review-mobile-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(view.date)} · ${escapeHtml(view.status)}</div><div class="mobile-card-title">${escapeHtml(view.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(view.topic)}</div></div><button class="btn ghost small" data-delegated-click="editAgenda('${item.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${escapeHtml(view.type)}</span><span>${escapeHtml(view.difficulty)}</span><span>${daysPill}</span></div><div class="mobile-card-actions">${view.pending ? `<button class="btn small history-primary-action" data-delegated-click="completeAgendaReview('${item.id}')">Concluir</button>` : ''}</div></article></td></tr>`;
  const mode = view.manualDate ? 'Manual' : 'Adaptativa',
    rating = view.lastRating ? ` · ${escapeHtml(ratingLabel(view.lastRating))}` : '';
  const restore =
    view.manualDate && item.topicId
      ? ` · <button type="button" data-delegated-click="resetAdaptiveReviewDate('${item.id}')">usar sugestão</button>`
      : '';
  return `<tr class="history-read-row history-desktop-row ${item.date === today ? 'today' : ''}" data-id="${item.id}"><td>${escapeHtml(view.date)}<div class="review-date-mode" title="${escapeAttr(item.adaptiveReason || '')}">${mode}${rating}${restore}</div></td><td><div class="row-primary">${escapeHtml(view.subject)}</div></td><td><div class="row-secondary">${escapeHtml(view.topic)}</div></td><td>${escapeHtml(view.type)}</td><td><span class="dias-pill ${difficultyClass[view.difficulty] || ''}">${escapeHtml(view.difficulty)}</span></td><td><span class="history-status ${statusClass[item.status] || ''}">${escapeHtml(view.status)}</span></td><td>${daysPill}</td><td><div class="row-actions">${view.pending ? `<button class="btn small history-primary-action" data-delegated-click="completeAgendaReview('${item.id}')">Concluir</button>` : ''}<button class="btn ghost small" data-delegated-click="editAgenda('${item.id}')">Editar</button></div></td></tr>`;
}

export function renderReviewEdit({
  item,
  draft,
  subjectOptions,
  topicName,
  typeOptions,
  statusOptions,
  escapeAttr,
}: any) {
  if (!draft) return '';
  return `<tr class="row-editing" data-id="${item.id}"><td colspan="8"><div class="inline-edit-form"><label>Data<input type="date" value="${draft.date || ''}" data-delegated-change="updateAgendaDraft('date',this.value)"></label><label>Disciplina<select ${draft.topicId ? 'disabled title="Definida pelo tópico vinculado"' : ''} data-delegated-change="updateAgendaDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectOptions}</select></label><label>Tópico<input type="text" value="${escapeAttr(topicName)}" ${draft.topicId ? 'readonly' : ''} data-delegated-input="updateAgendaDraft('topic',this.value)"></label><label>Tipo<select data-delegated-change="updateAgendaDraft('tipo',this.value)">${typeOptions}</select></label><label>Status<select data-delegated-change="updateAgendaDraft('status',this.value)">${statusOptions}</select></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelAgendaEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveAgendaEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteAgendaRow('${item.id}')">Excluir</button></div></div></td></tr>`;
}

const shiftDate = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Pending reviews per day from today on; overdue ones are summed apart instead of piling on today. */
export function buildReviewLoad(reviews: Array<Record<string, any>> = [], today: string, days = 30) {
  const pending = reviews.filter(item => item.status !== 'Concluído' && item.date);
  const counts = new Map<string, number>();
  for (const item of pending) counts.set(item.date, (counts.get(item.date) || 0) + 1);
  const series = Array.from({ length: days }, (_, index) => {
    const date = shiftDate(today, index);
    return { date, count: counts.get(date) || 0 };
  });
  return {
    days: series,
    overdue: pending.filter(item => item.date < today).length,
    total: series.reduce((sum, day) => sum + day.count, 0),
  };
}

export function renderReviewLoad(
  load: ReturnType<typeof buildReviewLoad>,
  { formatDate = (iso: string) => iso }: { formatDate?: (iso: string) => string } = {}
) {
  if (!load.total && !load.overdue) return '';
  const peak = load.days.reduce((best, day) => (day.count > best.count ? day : best), load.days[0]);
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const summary = `${plural(load.total, 'revisão', 'revisões')} nos próximos ${load.days.length} dias${peak.count ? `, pico de ${peak.count} em ${formatDate(peak.date)}` : ''}`;
  const overdueText = load.overdue ? plural(load.overdue, 'revisão atrasada', 'revisões atrasadas') : 'nenhuma atrasada';
  const chart = renderColumnChart({
    label: `Carga de revisões: ${overdueText}; ${summary}`,
    className: 'review-load__svg',
    columns: [
      // The overdue bucket sits apart on the left, in the attention tone.
      ...(load.overdue ? [{ value: load.overdue, title: overdueText, tone: 'attention' as const }] : []),
      ...load.days.map((day, index) => ({
        value: day.count,
        title: `${formatDate(day.date)}: ${plural(day.count, 'revisão', 'revisões')}`,
        separated: Boolean(load.overdue) && index === 0,
      })),
    ],
  });
  return `<section class="review-load" aria-label="Carga de revisões"><p class="review-load__label"><strong class="${load.overdue ? 'is-overdue' : ''}">${overdueText}</strong> · ${summary}</p>${chart}<div class="review-load__axis" aria-hidden="true"><span>${load.overdue ? 'Atrasadas · ' : ''}Hoje</span><span>+${load.days.length - 1} dias</span></div></section>`;
}
