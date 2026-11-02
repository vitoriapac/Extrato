export function countActiveFilters(filters: Record<string, unknown>, defaults: any = {}) {
  return Object.entries(filters || {}).reduce((total, [key, value]) => {
    const baseline = Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : '';
    return total + (value !== baseline && value !== '' && value != null ? 1 : 0);
  }, 0);
}

export function filterPanelLabel(count: number) {
  return count > 0 ? `Filtros (${count} ${count === 1 ? 'ativo' : 'ativos'})` : 'Filtros';
}

// Phones fold the filters of these lists behind a "Filtros" button (.responsive-filters.show).
const FILTER_PANELS: Readonly<Record<string, string>> = Object.freeze({
  sessions: 'studySessionsFilters',
  calendar: 'calendarFilters',
  agenda: 'agendaFilters',
});

/** Opens or closes a list's filter panel and keeps its toggle's aria-expanded in sync. */
export function toggleFilterPanel(doc: Pick<Document, 'getElementById' | 'querySelector'>, name: string) {
  const id = FILTER_PANELS[name];
  const panel = id ? doc.getElementById(id) : null;
  if (!panel) return false;
  const open = !panel.classList.contains('show');
  panel.classList.toggle('show', open);
  doc.querySelector(`[aria-controls="${id}"]`)?.setAttribute('aria-expanded', String(open));
  return open;
}
