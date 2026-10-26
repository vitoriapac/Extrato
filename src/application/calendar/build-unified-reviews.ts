export function buildUnifiedReviews({
  calendar = [],
  reviewAgenda = [],
  subjectIdOf = (): string | null => null,
  subjectName = () => '',
  topicName = () => '',
}: any = {}) {
  const calendarItems = calendar.map((item: any) => ({
    id: item.id,
    date: item.date,
    subjectId: subjectIdOf(item),
    subject: subjectName(item),
    label: item.reviewType && item.reviewType !== '—' ? item.reviewType : 'Revisão',
    status: item.status || 'Não iniciado',
    origem: 'Calendário',
  }));
  const agendaItems = reviewAgenda.map((item: any) => ({
    id: item.id,
    date: item.date,
    subjectId: subjectIdOf(item),
    subject: subjectName(item),
    label: `${item.topicId ? topicName(item.topicId) : item.topic || 'Tópico'} · ${item.tipo || ''}`,
    status: item.status || 'Não iniciado',
    origem: 'Agenda de Revisões',
  }));
  return [...calendarItems, ...agendaItems];
}

export function unifiedReviewLabel(
  item: { subject?: unknown; label?: unknown } | null | undefined
) {
  const subject = String(item?.subject || '').trim(),
    label = String(item?.label || '').trim();
  if (!subject || !label) return label || 'Revisão';
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return label.replace(new RegExp(`^${escaped}\\s*[·•—-]\\s*`, 'i'), '').trim() || 'Revisão';
}
