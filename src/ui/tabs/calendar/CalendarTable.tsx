import type { JSX } from 'preact';
import type { CalendarItem as CoreCalendarItem } from '../../../core/types.js';
import { Button } from '../../primitives/button.js';
import { createProgressiveList } from '../../progressive-list.js';
import { renderCollectionFooter } from '../../list-components.js';
import { Icon } from '../../primitives/icon.js';

export type CalendarItem = CoreCalendarItem;

export interface CalendarTableRowModel {
  date: string;
  week: string;
  subject: string;
  status: string;
  reviewType: string;
  pending: boolean;
  daysLabel: string;
  statusClass: string;
  isToday: boolean;
}

export interface CalendarTableProps {
  rows: CalendarItem[];
  page?: number;
  editingId?: string | null;
  mobile?: boolean;
  getRowModel?: (item: CalendarItem) => CalendarTableRowModel;
  onCompleteItem?: (id: string) => void;
  onEditItem?: (id: string) => void;
  onAddItem?: () => void;
  renderReadRow: (item: CalendarItem) => string;
  renderEditRow: (item: CalendarItem) => string;
  renderFooter?: (opts: any) => string;
}

export function CalendarTable({
  rows,
  page = 1,
  editingId,
  mobile = false,
  getRowModel,
  onCompleteItem,
  onEditItem,
  onAddItem,
  renderReadRow,
  renderEditRow,
  renderFooter = renderCollectionFooter,
}: CalendarTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={7}>
          <div class="empty-state" style={{ border: 'none' }}>
            <p>Nenhum item encontrado no calendário.</p>
            <Button
              type="button"
              variant="ghost"
              size="small"
              className="inline-flex items-center gap-1"
              onClick={onAddItem}
              data-delegated-click={onAddItem ? undefined : 'addCalRow()'}
            >
              <Icon name="plus" size={14} />
              <span>Adicionar atividade</span>
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  const list = createProgressiveList({ items: rows, mode: 'pages', page });
  const visibleRows = list.visibleItems;
  const footer = (
    <tr
      dangerouslySetInnerHTML={{
        __html: renderFooter({
          total: list.totalItems,
          page: list.page,
          pageSize: list.pageSize,
          pageAction: (n: number) => `goToListPage('calendar',${n})`,
          colspan: 7,
          label: 'itens',
        }),
      }}
    />
  );

  if (getRowModel) {
    return (
      <>
        {visibleRows.map(item => {
          if (editingId === item.id) {
            return (
              <tr
                key={item.id}
                class="row-editing"
                data-id={item.id}
                dangerouslySetInnerHTML={{
                  __html: renderEditRow(item).replace(/^<tr[^>]*>|<\/tr>$/g, ''),
                }}
              />
            );
          }
          const view = getRowModel(item);
          if (mobile) {
            return (
              <tr key={item.id} class="mobile-history-row" data-id={item.id}>
                <td colSpan={7}>
                  <article class="mobile-history-card">
                    <div class="mobile-card-head">
                      <div>
                        <div class="mobile-card-date font-mono tabular-nums">
                          {view.date} · {view.week}
                        </div>
                        <div class="mobile-card-title">{view.subject}</div>
                        <div class="mobile-card-subtitle">{view.reviewType}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="small"
                        onClick={() => onEditItem?.(item.id)}
                        aria-label={`Editar atividade: ${view.subject}, ${view.reviewType}, ${view.date}`}
                      >
                        Editar
                      </Button>
                    </div>
                    <div class="mobile-card-metrics">
                      <span>{view.status}</span>
                      <span>{view.daysLabel}</span>
                    </div>
                    {view.pending && (
                      <div class="mobile-card-actions">
                        <Button
                          type="button"
                          size="small"
                          className="history-primary-action"
                          onClick={() => onCompleteItem?.(item.id)}
                          aria-label={`Concluir tarefa: ${view.subject}, ${view.reviewType}, ${view.date}`}
                        >
                          Concluir
                        </Button>
                      </div>
                    )}
                  </article>
                </td>
              </tr>
            );
          }
          return (
            <tr
              key={item.id}
              class={`history-read-row history-desktop-row ${view.isToday ? 'today' : ''}`}
              data-id={item.id}
            >
              <td class="font-mono tabular-nums">{view.date}</td>
              <td>{view.week}</td>
              <td>
                <div class="row-primary">{view.subject}</div>
              </td>
              <td>
                <span class={`history-status ${view.statusClass}`}>{view.status}</span>
              </td>
              <td>{view.reviewType}</td>
              <td>{view.daysLabel}</td>
              <td>
                <div class="row-actions">
                  {view.pending && (
                    <Button
                      type="button"
                      size="small"
                      onClick={() => onCompleteItem?.(item.id)}
                      aria-label={`Concluir tarefa: ${view.subject}, ${view.reviewType}, ${view.date}`}
                    >
                      Concluir
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => onEditItem?.(item.id)}
                    aria-label={`Editar tarefa: ${view.subject}, ${view.reviewType}, ${view.date}`}
                  >
                    Editar
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}

        {footer}
      </>
    );
  }

  return (
    <>
      {visibleRows.map(item => {
        const html = editingId === item.id ? renderEditRow(item) : renderReadRow(item);
        return <tbody key={item.id} dangerouslySetInnerHTML={{ __html: html }} />;
      })}

      {footer}
    </>
  );
}
