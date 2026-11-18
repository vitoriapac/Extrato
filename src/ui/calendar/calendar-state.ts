export function createCalendarState(initial: any = {}) {
  return {
    month: initial.month instanceof Date ? new Date(initial.month) : new Date(),
    filters: {
      subjectId: initial.filters?.subjectId || '',
      status: initial.filters?.status || '',
      month: initial.filters?.month || '',
      type: initial.filters?.type || '',
      activityKind: initial.filters?.activityKind || '',
    },
    view: initial.view || 'month',
    viewChosen: Boolean(initial.view),
    calendarPage: Number(initial.calendarPage) || 1,
    editingId: null as string | null,
    draft: null as Record<string, any> | null,
    isNew: false,
    selectedId: null as string | null,
    selectedDate: (initial.selectedDate as string | null) || null,
    weekAnchorDate: (initial.weekAnchorDate as string | null) || null,
    modalOpen: false,
    modalDraft: null as Record<string, any> | null,
    expandedIds: new Set<string>(),
  };
}

// Abaixo de 760px a Lista é o padrão inicial; uma visão já escolhida pela usuária sempre vence.
export function initialCalendarView(
  state: { view?: string; viewChosen?: boolean },
  narrow: boolean
) {
  if (state.viewChosen) {
    if (state.view === 'agenda') return 'agenda';
    if (state.view === 'week') return 'week';
    return 'month';
  }
  return narrow ? 'agenda' : 'month';
}
