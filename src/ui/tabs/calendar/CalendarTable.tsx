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
  title?: string;
  startTime?: string;
  kindLabel?: string;
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
          const primaryLabel = view.title || view.subject;
          const secondarySubject =
            view.title && view.subject && view.subject !== view.title ? view.subject : '';
          const categoryLabel = view.kindLabel || view.reviewType;
          if (mobile) {
            return (
              <tr key={item.id} class="mobile-history-row" data-id={item.id}>
                <td colSpan={7}>
                  <article class="mobile-history-card">
                    <div class="mobile-card-head">
                      <div>
                        <div class="mobile-card-date font-mono tabular-nums">
                          {view.date} · {view.startTime || view.week}
                        </div>
                        <div class="mobile-card-title">{primaryLabel}</div>
                        <div class="mobile-card-subtitle">
                          {categoryLabel}
                          {secondarySubject ? ` · ${secondarySubject}` : ''}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="small"
                        onClick={() => onEditItem?.(item.id)}
                        aria-label={`Editar atividade: ${primaryLabel}, ${categoryLabel}, ${view.date}`}
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
                          variant="tonal"
                          size="small"
                          className="history-primary-action"
                          onClick={() => onCompleteItem?.(item.id)}
                          aria-label={`Concluir tarefa: ${primaryLabel}, ${categoryLabel}, ${view.date}`}
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
              <td class="font-mono tabular-nums text-xs text-content-secondary">
                {view.startTime || '—'}
              </td>
              <td>
                <div class="row-primary">{primaryLabel}</div>
                {secondarySubject && (
                  <div class="row-secondary text-xs text-content-secondary">{secondarySubject}</div>
                )}
              </td>
              <td>{categoryLabel}</td>
              <td>
                <span class={`history-status ${view.statusClass}`}>{view.status}</span>
              </td>
              <td>{view.daysLabel}</td>
              <td>
                <div class="row-actions">
                  {view.pending && (
                    <Button
                      type="button"
                      variant="tonal"
                      size="small"
                      onClick={() => onCompleteItem?.(item.id)}
                      aria-label={`Concluir tarefa: ${primaryLabel}, ${categoryLabel}, ${view.date}`}
                    >
                      Concluir
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => onEditItem?.(item.id)}
                    aria-label={`Editar tarefa: ${primaryLabel}, ${categoryLabel}, ${view.date}`}
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
