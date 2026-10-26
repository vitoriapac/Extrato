import { DEFAULT_LIST_VISIBLE_ITEMS } from '../progressive-list.js';
const clone = <T>(value: T): T => (value == null ? value : JSON.parse(JSON.stringify(value)));
const localToday = () => {
  const date = new Date(),
    pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
export function createCalendarController({
  service,
  state,
  onChange = () => {},
  clock = { today: localToday },
}: any = {}) {
  if (!service) throw new Error('calendar service is required');
  const refresh = () => onChange(state),
    resetEdit = () => {
      state.editingId = null;
      state.draft = null;
      state.isNew = false;
    };
  return {
    create(draft: any = {}) {
      const item = service.create({ ...draft, date: draft.date || clock.today() });
      state.editingId = item.id;
      state.draft = clone(item);
      state.isNew = true;
      refresh();
      return item;
    },
    beginEdit(id: string) {
      state.editingId = id;
      state.draft = clone(service.getById?.(id));
      state.isNew = false;
      refresh();
    },
    update(field: string, value: unknown) {
      if (state.draft) state.draft[field] = value;
      refresh();
    },
    cancelEdit() {
      if (state.isNew && state.editingId) service.remove(state.editingId);
      resetEdit();
      refresh();
    },
    save() {
      if (!state.draft) return null;
      const result = service.update(state.editingId, state.draft);
      resetEdit();
      refresh();
      return result;
    },
    complete(id: string) {
      const item = service.getById?.(id);
      if (!item || item.status === 'Concluído') return item;
      const result = service.update(id, { ...item, status: 'Concluído' });
      refresh();
      return result;
    },
    remove(id: string) {
      const result = service.remove(id);
      if (state.selectedId === id) state.selectedId = null;
      if (state.editingId === id) resetEdit();
      refresh();
      return result;
    },
    setFilter(name: string, value: string) {
      if (name in state.filters) state.filters[name] = value;
      state.visible = DEFAULT_LIST_VISIBLE_ITEMS;
      refresh();
    },
    clearFilters() {
      Object.keys(state.filters).forEach(key => (state.filters[key] = ''));
      state.visible = DEFAULT_LIST_VISIBLE_ITEMS;
      refresh();
    },
    setView(view: string) {
      state.view = view === 'agenda' ? 'agenda' : 'month';
      refresh();
    },
    select(id: string | null) {
      state.selectedId = id;
      refresh();
    },
    clearSelection() {
      state.selectedId = null;
      refresh();
    },
    showMore() {
      state.visible = Number.MAX_SAFE_INTEGER;
      refresh();
    },
    showLess() {
      state.visible = DEFAULT_LIST_VISIBLE_ITEMS;
      refresh();
    },
    setMonth(month: string | Date) {
      state.month = month instanceof Date ? new Date(month) : new Date(month);
      state.visible = DEFAULT_LIST_VISIBLE_ITEMS;
      refresh();
    },
    goToPreviousMonth() {
      const date = new Date(state.month);
      date.setMonth(date.getMonth() - 1);
      state.month = date;
      refresh();
    },
    goToNextMonth() {
      const date = new Date(state.month);
      date.setMonth(date.getMonth() + 1);
      state.month = date;
      refresh();
    },
    goToCurrentMonth() {
      state.month = new Date();
      refresh();
    },
    toggleExpanded(id: string) {
      state.expandedIds.has(id) ? state.expandedIds.delete(id) : state.expandedIds.add(id);
      refresh();
    },
  };
}
