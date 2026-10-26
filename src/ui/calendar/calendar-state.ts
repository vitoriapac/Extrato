import { DEFAULT_LIST_VISIBLE_ITEMS } from '../progressive-list.js';
export function createCalendarState(initial: any = {}) {
  return {
    month: initial.month instanceof Date ? new Date(initial.month) : new Date(),
    filters: {
      subjectId: initial.filters?.subjectId || '',
      status: initial.filters?.status || '',
      month: initial.filters?.month || '',
      type: initial.filters?.type || '',
    },
    view: initial.view || 'month',
    visible: Number(initial.visible) || DEFAULT_LIST_VISIBLE_ITEMS,
    editingId: null as string | null,
    draft: null as Record<string, any> | null,
    isNew: false,
    selectedId: null as string | null,
    expandedIds: new Set<string>(),
  };
}
