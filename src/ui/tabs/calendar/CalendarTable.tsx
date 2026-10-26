import type { JSX } from 'preact';

export interface CalendarItem {
  id: string;
  date?: string;
  week?: string;
  subjectId?: string | null;
  topicId?: string | null;
  status: string;
  reviewType?: string | null;
}

export interface CalendarTableProps {
  rows: CalendarItem[];
  visibleLimit: number;
  editingId?: string | null;
  renderReadRow: (item: CalendarItem) => string;
  renderEditRow: (item: CalendarItem) => string;
  renderFooter?: (opts: {
    total: number;
    visible: number;
    showMoreAction: string;
    showLessAction: string;
    colspan: number;
    label: string;
  }) => string;
}

export function CalendarTable({
  rows,
  visibleLimit,
  editingId,
  renderReadRow,
  renderEditRow,
  renderFooter,
}: CalendarTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={7}>
          <div class="empty-state" style={{ border: 'none' }}>
            <p>Nenhum item encontrado no calendário.</p>
            <button type="button" class="btn small" data-delegated-click="addCalRow()">
              + Adicionar item
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const visibleRows = rows.slice(0, visibleLimit);

  return (
    <>
      {visibleRows.map(item => {
        const html = editingId === item.id ? renderEditRow(item) : renderReadRow(item);
        return <tbody key={item.id} dangerouslySetInnerHTML={{ __html: html }} />;
      })}

      {renderFooter && rows.length > 0 && (
        <tr
          dangerouslySetInnerHTML={{
            __html: renderFooter({
              total: rows.length,
              visible: visibleLimit,
              showMoreAction: "changeCalendarLimit('calendar',5)",
              showLessAction: visibleLimit > 5 ? "resetCalendarLimit('calendar')" : '',
              colspan: 7,
              label: 'itens',
            }),
          }}
        />
      )}
    </>
  );
}
