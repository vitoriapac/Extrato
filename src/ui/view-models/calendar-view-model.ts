import { CALENDAR_ACTIVITY_LABELS } from '../../state/schema.js';
import type { CalendarActivityKind } from '../../core/types.js';

export function buildCalendarItemViewModel(
  item: Record<string, any>,
  { formatDate, getSubjectName, subjectIdOf }: any = {}
) {
  const kind = (item.kind as CalendarActivityKind) || (item.reviewType && item.reviewType !== '—' ? 'manual_review' : 'task');
  const kindLabel = CALENDAR_ACTIVITY_LABELS[kind] || 'Tarefa';
  const subject = getSubjectName(subjectIdOf(item));
  const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : subject;
  return {
    date: item.date ? formatDate(item.date) : 'Sem data',
    week: item.week || '—',
    subject: title,
    kindLabel,
    status: item.status || 'Não iniciado',
    reviewType:
      item.reviewType && item.reviewType !== '—'
        ? item.reviewType
        : item.startTime
          ? `${kindLabel} · ${item.startTime}`
          : kindLabel,
    pending: item.status !== 'Concluído' && item.status !== 'Cancelado',
  };
}
