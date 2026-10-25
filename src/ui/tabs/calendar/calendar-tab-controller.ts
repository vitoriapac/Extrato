import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { CalendarTable, type CalendarItem } from './CalendarTable.js';

export interface CalendarTabControllerContext {
  state: {
    calendar: CalendarItem[];
  };
  filters: {
    subjectId: string;
    status: string;
    month: string;
    type: string;
  };
  entitySubjectId: (item: any) => string | null;
  monthKey: (date?: string) => string;
  calendarUiState: {
    visible: number;
    editingId: string | null;
  };
  renderCalendarReadRow: (item: CalendarItem) => string;
  renderCalendarEditRow: (item: CalendarItem) => string;
  renderCollectionFooter: (opts: any) => string;
}

export function createCalendarTabController(ctx: CalendarTabControllerContext) {
  function getFilteredAndSortedRows(): CalendarItem[] {
    const { subjectId, status, month, type } = ctx.filters;

    return (ctx.state.calendar || [])
      .filter(c => !subjectId || ctx.entitySubjectId(c) === subjectId)
      .filter(c => !status || c.status === status)
      .filter(c => !month || ctx.monthKey(c.date) === month)
      .filter(c => !type || c.reviewType === type)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  function renderHtml(): string {
    const rows = getFilteredAndSortedRows();

    return render(
      h(CalendarTable, {
        rows,
        visibleLimit: ctx.calendarUiState.visible,
        editingId: ctx.calendarUiState.editingId,
        renderReadRow: ctx.renderCalendarReadRow,
        renderEditRow: ctx.renderCalendarEditRow,
        renderFooter: ctx.renderCollectionFooter,
      })
    );
  }

  return {
    getFilteredAndSortedRows,
    renderHtml,
  };
}
