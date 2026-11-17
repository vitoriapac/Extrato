import type { CalendarActivityKind } from '../../core/types.js';
import {
  expandRecurringCalendarItems,
  type UnifiedCalendarItem,
  type UnifiedCalendarKind,
} from '../../domain/calendar/calendar-projection.js';

function resolveCalendarKind(item: Record<string, any>): CalendarActivityKind {
  const valid: CalendarActivityKind[] = ['task', 'mock_exam', 'essay', 'event', 'manual_review'];
  if (valid.includes(item.kind)) return item.kind;
  return item.reviewType && item.reviewType !== '—' ? 'manual_review' : 'task';
}

function resolveCalendarTitle(item: Record<string, any>, subjectLabel: string, kind: CalendarActivityKind): string {
  if (typeof item.title === 'string' && item.title.trim()) return item.title.trim();
  if (item.reviewType && item.reviewType !== '—') return String(item.reviewType);
  if (kind === 'mock_exam') return subjectLabel ? `Simulado · ${subjectLabel}` : 'Simulado';
  if (kind === 'essay') return 'Redação';
  if (kind === 'event') return 'Evento';
  return 'Tarefa de estudo';
}

export function buildUnifiedReviews({
  calendar = [],
  reviewAgenda = [],
  subjectIdOf = (): string | null => null,
  subjectName = () => '',
  topicName = () => '',
}: any = {}): UnifiedCalendarItem[] {
  const calendarItems: UnifiedCalendarItem[] = (calendar || []).map((item: any) => {
    const kind = resolveCalendarKind(item);
    const subject = subjectName(item) || '';
    const title = resolveCalendarTitle(item, subject, kind);
    return {
      key: `Calendário:${item.id}`,
      id: item.id,
      date: item.date,
      kind,
      title,
      label: title,
      status: item.status || 'Não iniciado',
      origem: 'Calendário',
      subjectId: subjectIdOf(item),
      subject,
      topicId: item.topicId || null,
      startTime: item.startTime || null,
      endTime: item.endTime || null,
      estimatedMinutes: typeof item.estimatedMinutes === 'number' ? item.estimatedMinutes : null,
      recurrence: item.recurrence || 'none',
      description: item.description || null,
      location: item.location || null,
      externalUrl: item.externalUrl || null,
      linkedSimulationId: item.linkedSimulationId || null,
      isEvent: kind === 'event',
      isDraggable: true,
    };
  });

  const agendaItems: UnifiedCalendarItem[] = (reviewAgenda || []).map((item: any) => {
    const topicLabel = item.topicId ? topicName(item.topicId) : item.topic || 'Tópico';
    const label = `${topicLabel} · ${item.tipo || ''}`.replace(/\s*·\s*$/, '');
    const kind: UnifiedCalendarKind = 'review';
    return {
      key: `Agenda de Revisões:${item.id}`,
      id: item.id,
      date: item.date,
      kind,
      title: label,
      label,
      status: item.status || 'Não iniciado',
      origem: 'Agenda de Revisões',
      subjectId: subjectIdOf(item),
      subject: subjectName(item) || '',
      topicId: item.topicId || null,
      startTime: null,
      endTime: null,
      estimatedMinutes: null,
      description: null,
      location: null,
      externalUrl: null,
      linkedSimulationId: null,
      isEvent: false,
      isDraggable: false,
    };
  });

  return [...calendarItems, ...agendaItems];
}

export function buildUnifiedCalendarItems({
  calendar = [],
  reviewAgenda = [],
  simulados = [],
  today = '',
  rangeStart = '',
  rangeEnd = '',
  subjectIdOf = (): string | null => null,
  subjectName = () => '',
  topicName = () => '',
}: any = {}): UnifiedCalendarItem[] {
  const base = buildUnifiedReviews({
    calendar,
    reviewAgenda,
    subjectIdOf,
    subjectName,
    topicName,
  });
  const linkedSimIds = new Set(
    (calendar || [])
      .map((item: any) => item?.linkedSimulationId)
      .filter((id: unknown): id is string => typeof id === 'string' && Boolean(id))
  );
  const plannedSims: UnifiedCalendarItem[] = (simulados || [])
    .filter(
      (s: any) =>
        s &&
        s.date &&
        (!today || s.date >= today) &&
        (Number(s.correct) || 0) === 0 &&
        (Number(s.total) || 0) === 0 &&
        (!s.breakdown || s.breakdown.length === 0) &&
        !linkedSimIds.has(s.id)
    )
    .map((s: any) => ({
      key: `Simulado:${s.id}`,
      id: s.id,
      date: s.date,
      kind: 'mock_exam' as const,
      title: s.nome || 'Simulado planejado',
      label: s.nome || 'Simulado planejado',
      status: 'Não iniciado',
      origem: 'Simulado' as const,
      subjectId: null,
      subject: '',
      topicId: null,
      startTime: null,
      endTime: null,
      estimatedMinutes: null,
      description: null,
      location: null,
      externalUrl: null,
      linkedSimulationId: s.id,
      isEvent: false,
      isDraggable: false,
    }));

  const combined = [...base, ...plannedSims];
  if (rangeStart && rangeEnd) {
    return expandRecurringCalendarItems(combined, rangeStart, rangeEnd);
  }
  return combined;
}

export function unifiedReviewLabel(
  item: { subject?: unknown; label?: unknown; title?: unknown } | null | undefined
) {
  const subject = String(item?.subject || '').trim(),
    label = String(item?.title || item?.label || '').trim();
  if (!subject || !label) return label || 'Revisão';
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return label.replace(new RegExp(`^${escaped}\\s*[·•—-]\\s*`, 'i'), '').trim() || 'Revisão';
}
