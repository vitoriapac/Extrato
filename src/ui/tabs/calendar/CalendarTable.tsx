import type { JSX } from 'preact';
import type { CalendarItem as CoreCalendarItem } from '../../../core/types.js';
import { Button } from '../../primitives/button.js';
import { createProgressiveList } from '../../progressive-list.js';
import { pageWindow } from '../../list-components.js';
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

export interface CalendarTableEditModel {
  draft: {
    date?: string;
    week?: string;
    subjectId?: string | null;
    status?: string;
    reviewType?: string;
  };
  subjects: Array<{ id: string; name: string }>;
  statusOptions: string[];
  reviewOptions: string[];
}

export interface CalendarTableProps {
  rows: CalendarItem[];
  page?: number;
  editingId?: string | null;
  mobile?: boolean;
  getRowModel?: (item: CalendarItem) => CalendarTableRowModel;
  editModel?: CalendarTableEditModel | null;
  onCompleteItem?: (id: string) => void;
  onEditItem?: (id: string) => void;
  onAddItem?: () => void;
  onUpdateDraft?: (field: string, value: any) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onDeleteRow?: (id: string) => void;
  onGoToPage?: (page: number) => void;
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
  editModel,
  onCompleteItem,
  onEditItem,
  onAddItem,
  onUpdateDraft,
  onSaveEdit,
  onCancelEdit,
  onDeleteRow,
  onGoToPage,
  renderReadRow,
  renderEditRow,
  renderFooter,
}: CalendarTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={7}>
          <div class="empty-state border-0">
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
  const pageCount = Math.ceil(list.totalItems / list.pageSize);
  const current = Math.min(Math.max(1, list.page), Math.max(1, pageCount));
  const from = (current - 1) * list.pageSize + 1;
  const to = Math.min(list.totalItems, current * list.pageSize);

  const renderPageButton = (
    text: string,
    target: number,
    opts: { ariaLabel: string; isCurrent?: boolean; dir?: 'prev' | 'next'; hideSm?: boolean; disabled?: boolean }
  ) => (
    <button
      key={`${opts.dir || 'page'}-${text}`}
      class="list-page-btn"
      type="button"
      aria-label={opts.ariaLabel}
      aria-current={opts.isCurrent ? 'page' : undefined}
      aria-disabled={opts.disabled ? 'true' : undefined}
      data-page-dir={opts.dir}
      data-hide-sm={opts.hideSm ? '' : undefined}
      data-delegated-click={!opts.disabled && !onGoToPage ? `goToListPage('calendar',${target})` : undefined}
      onClick={
        !opts.disabled && onGoToPage
          ? () => onGoToPage(target)
          : undefined
      }
    >
      {text}
    </button>
  );

  const footer = renderFooter ? (
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
  ) : pageCount > 1 ? (
    <tr class="list-view-footer">
      <td colSpan={7}>
        <nav class="list-pagination" aria-label="Paginação de itens">
          <span class="list-view-count" aria-live="polite">
            Exibindo {from}–{to} de {list.totalItems} itens
          </span>
          <span class="sr-only">
            Página {current} de {pageCount}
          </span>
          <div class="list-page-group">
            {renderPageButton('‹', current - 1, {
              ariaLabel: 'Página anterior',
              dir: 'prev',
              disabled: current <= 1,
            })}
            {pageWindow(current, pageCount).map((entry, idx) =>
              entry === 'gap' ? (
                <span key={`gap-${idx}`} class="list-page-gap" aria-hidden="true">
                  …
                </span>
              ) : (
                renderPageButton(String(entry), entry, {
                  ariaLabel: `Página ${entry}`,
                  isCurrent: entry === current,
                  hideSm:
                    pageCount > 5 && entry !== 1 && entry !== pageCount && entry !== current,
                })
              )
            )}
            {renderPageButton('›', current + 1, {
              ariaLabel: 'Próxima página',
              dir: 'next',
              disabled: current >= pageCount,
            })}
          </div>
        </nav>
      </td>
    </tr>
  ) : null;

  if (getRowModel) {
    return (
      <>
        {visibleRows.map(item => {
          if (editingId === item.id) {
            if (editModel) {
              const { draft, subjects, statusOptions, reviewOptions } = editModel;
              return (
                <tr key={item.id} class="row-editing" data-id={item.id}>
                  <td colSpan={7}>
                    <div class="inline-edit-form">
                      <label>
                        Data
                        <input
                          type="date"
                          value={draft.date || ''}
                          onChange={e => onUpdateDraft?.('date', e.currentTarget.value)}
                        />
                      </label>
                      <label>
                        Semana
                        <input
                          type="text"
                          value={draft.week || ''}
                          onInput={e => onUpdateDraft?.('week', e.currentTarget.value)}
                        />
                      </label>
                      <label>
                        Disciplina
                        <select
                          value={draft.subjectId || ''}
                          onChange={e =>
                            onUpdateDraft?.('subjectId', e.currentTarget.value || null)
                          }
                        >
                          <option value="">Sem disciplina</option>
                          {subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Status
                        <select
                          value={draft.status || ''}
                          onChange={e => onUpdateDraft?.('status', e.currentTarget.value)}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Tipo de revisão
                        <select
                          value={draft.reviewType || ''}
                          onChange={e => onUpdateDraft?.('reviewType', e.currentTarget.value)}
                        >
                          {reviewOptions.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div class="inline-edit-actions">
                        <Button
                          type="button"
                          variant="ghost"
                          size="small"
                          onClick={() => onCancelEdit?.()}
                        >
                          Cancelar
                        </Button>
                        <Button type="button" size="small" onClick={() => onSaveEdit?.()}>
                          Salvar alterações
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="small"
                          aria-label="Excluir item da agenda"
                          onClick={() => onDeleteRow?.(item.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            }
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
                      <span class={`history-status ${view.statusClass}`}>{view.status}</span>
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
