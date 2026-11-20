import { createContext, type ComponentChildren, type JSX } from 'preact';
import { useCallback, useContext, useEffect, useId, useRef } from 'preact/hooks';
import { Button } from './button.js';
import { EmptyState } from './empty-state.js';
import { Icon, type IconName } from './icon.js';

import {
  computeTablePagination,
  cycleTableSort,
  getVisibleTablePages,
  type TableAlign,
  type TableDensity,
  type TablePaginationConfig,
  type TableSortDirection,
  type TableSortState,
  type UseTablePaginationReturn,
} from './table-state.js';

export * from './table-state.js';

interface TableContextValue {
  sortState?: TableSortState;
  onSortKey?: (key: string) => void;
}

const TableContext = createContext<TableContextValue>({});

export type TableProps = Omit<JSX.IntrinsicElements['table'], 'class' | 'className'> & {
  density?: TableDensity;
  striped?: boolean;
  stickyHeader?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  caption?: string;
  captionHidden?: boolean;
  ariaLabel?: string;
  sortState?: TableSortState;
  onSortChange?: (next: TableSortState) => void;
  allowSortReset?: boolean;
  wrapperClassName?: string;
  className?: string;
  children?: ComponentChildren;
};

export function Table({
  density = 'comfortable',
  striped = false,
  stickyHeader = false,
  bordered = false,
  hoverable = true,
  caption,
  captionHidden = false,
  ariaLabel,
  sortState,
  onSortChange,
  allowSortReset = true,
  wrapperClassName = '',
  className = '',
  children,
  ...rest
}: TableProps) {
  const onSortKey = useCallback(
    (key: string) => {
      if (!onSortChange) return;
      const current = sortState ?? { key: null, direction: null };
      onSortChange(cycleTableSort(current, key, allowSortReset));
    },
    [sortState, onSortChange, allowSortReset]
  );

  const wrapClass = [
    'ui-table-wrap',
    stickyHeader ? 'ui-table-wrap--sticky' : '',
    bordered ? 'ui-table-wrap--bordered' : '',
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const tableClass = [
    'ui-table',
    `ui-table--${density}`,
    striped ? 'ui-table--striped' : '',
    stickyHeader ? 'ui-table--sticky-header' : '',
    hoverable ? 'ui-table--hoverable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <TableContext.Provider value={{ sortState, onSortKey: onSortChange ? onSortKey : undefined }}>
      <div class={wrapClass}>
        <table class={tableClass} aria-label={!caption ? ariaLabel : undefined} {...rest}>
          {caption && (
            <caption class={captionHidden ? 'sr-only' : 'ui-table__caption'}>{caption}</caption>
          )}
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export type TableSectionProps<T extends 'thead' | 'tbody' | 'tfoot'> = Omit<
  JSX.IntrinsicElements[T],
  'class' | 'className'
> & {
  className?: string;
  children?: ComponentChildren;
};

export function TableHeader({ className = '', children, ...rest }: TableSectionProps<'thead'>) {
  return (
    <thead class={['ui-table__head', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...rest }: TableSectionProps<'tbody'>) {
  return (
    <tbody class={['ui-table__body', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </tbody>
  );
}

export function TableFooter({ className = '', children, ...rest }: TableSectionProps<'tfoot'>) {
  return (
    <tfoot class={['ui-table__foot', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </tfoot>
  );
}

export type TableRowProps = Omit<JSX.IntrinsicElements['tr'], 'class' | 'className'> & {
  selected?: boolean;
  interactive?: boolean;
  className?: string;
  children?: ComponentChildren;
};

export function TableRow({
  selected = false,
  interactive = false,
  className = '',
  children,
  ...rest
}: TableRowProps) {
  const rowClass = [
    'ui-table__row',
    selected ? 'ui-table__row--selected' : '',
    interactive ? 'ui-table__row--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <tr class={rowClass} data-selected={selected ? 'true' : undefined} {...rest}>
      {children}
    </tr>
  );
}

export type TableHeaderCellProps = Omit<JSX.IntrinsicElements['th'], 'class' | 'className'> & {
  align?: TableAlign;
  numeric?: boolean;
  sortKey?: string;
  sortDirection?: TableSortDirection;
  onSort?: (key: string) => void;
  width?: string | number;
  className?: string;
  children?: ComponentChildren;
};

export function TableHeaderCell({
  align,
  numeric = false,
  sortKey,
  sortDirection: explicitSortDirection,
  onSort,
  width,
  scope = 'col',
  className = '',
  children,
  style,
  ...rest
}: TableHeaderCellProps) {
  const ctx = useContext(TableContext);
  const resolvedAlign: TableAlign = align ?? (numeric ? 'end' : 'start');
  const resolvedDirection: TableSortDirection =
    explicitSortDirection !== undefined
      ? explicitSortDirection
      : sortKey && ctx.sortState?.key === sortKey
        ? ctx.sortState.direction
        : null;

  const isSortable = Boolean(sortKey);
  const ariaSort = isSortable
    ? resolvedDirection === 'asc'
      ? 'ascending'
      : resolvedDirection === 'desc'
        ? 'descending'
        : 'none'
    : undefined;

  const sortIconName: IconName =
    resolvedDirection === 'asc'
      ? 'arrow-up'
      : resolvedDirection === 'desc'
        ? 'arrow-down'
        : 'chevrons-up-down';

  const handleSortClick = () => {
    if (!sortKey) return;
    if (onSort) onSort(sortKey);
    else ctx.onSortKey?.(sortKey);
  };

  const thClass = [
    'ui-table__head-cell',
    `ui-table__cell--align-${resolvedAlign}`,
    numeric ? 'ui-table__cell--numeric' : '',
    isSortable ? 'ui-table__head-cell--sortable' : '',
    resolvedDirection ? 'ui-table__head-cell--sorted' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const resolvedStyle =
    width !== undefined
      ? {
          width: typeof width === 'number' ? `${width}px` : width,
          ...(typeof style === 'object' && style !== null ? style : {}),
        }
      : style;

  return (
    <th
      scope={scope}
      aria-sort={ariaSort}
      data-sort-direction={resolvedDirection ?? undefined}
      class={thClass}
      style={resolvedStyle}
      {...rest}
    >
      {isSortable ? (
        <button type="button" class="ui-table__sort-btn" onClick={handleSortClick}>
          <span class="ui-table__sort-label">{children}</span>
          <Icon name={sortIconName} size={14} class="ui-table__sort-icon shrink-0" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export type TableCellProps = Omit<JSX.IntrinsicElements['td'], 'class' | 'className'> & {
  align?: TableAlign;
  numeric?: boolean;
  truncate?: boolean;
  className?: string;
  children?: ComponentChildren;
};

export function TableCell({
  align,
  numeric = false,
  truncate = false,
  className = '',
  children,
  ...rest
}: TableCellProps) {
  const resolvedAlign: TableAlign = align ?? (numeric ? 'end' : 'start');
  const tdClass = [
    'ui-table__cell',
    `ui-table__cell--align-${resolvedAlign}`,
    numeric ? 'ui-table__cell--numeric' : '',
    truncate ? 'ui-table__cell--truncate' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td class={tdClass} {...rest}>
      {children}
    </td>
  );
}

export interface TableSelectionCellProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
  asHeader?: boolean;
  className?: string;
}

export function TableSelectionCell({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
  disabled = false,
  asHeader = false,
  className = '',
}: TableSelectionCellProps) {
  const checkboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = Boolean(indeterminate && !checked);
    }
  }, [indeterminate, checked]);

  const resolvedLabel = ariaLabel ?? (asHeader ? 'Selecionar todas as linhas' : 'Selecionar linha');

  const control = (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={resolvedLabel}
      aria-checked={indeterminate && !checked ? 'mixed' : checked ? 'true' : 'false'}
      class="ui-table__checkbox"
      onChange={event => onChange((event.target as HTMLInputElement).checked)}
    />
  );

  if (asHeader) {
    return (
      <th
        scope="col"
        class={['ui-table__head-cell ui-table__cell--selection', className]
          .filter(Boolean)
          .join(' ')}
      >
        {control}
      </th>
    );
  }

  return (
    <td class={['ui-table__cell ui-table__cell--selection', className].filter(Boolean).join(' ')}>
      {control}
    </td>
  );
}

export interface TableSelectionToolbarProps {
  selectedCount: number;
  totalCount?: number;
  onClear?: () => void;
  clearLabel?: string;
  alwaysVisible?: boolean;
  actions?: ComponentChildren;
  className?: string;
}

export function TableSelectionToolbar({
  selectedCount,
  totalCount,
  onClear,
  clearLabel = 'Limpar seleção',
  alwaysVisible = false,
  actions,
  className = '',
}: TableSelectionToolbarProps) {
  if (!alwaysVisible && selectedCount <= 0) {
    return null;
  }

  const countLabel = selectedCount === 1 ? '1 selecionado' : `${selectedCount} selecionados`;

  return (
    <div
      role="region"
      aria-label="Seleção da tabela"
      class={['ui-table-toolbar', className].filter(Boolean).join(' ')}
    >
      <div class="ui-table-toolbar__summary">
        <strong class="ui-table-toolbar__count">{countLabel}</strong>
        {totalCount !== undefined && <span class="ui-table-toolbar__total">de {totalCount}</span>}
      </div>
      <div class="ui-table-toolbar__actions">
        {actions}
        {onClear && selectedCount > 0 && (
          <Button variant="ghost" size="small" iconLeft="x" onClick={onClear}>
            {clearLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export interface TablePaginationProps {
  pagination: TablePaginationConfig | UseTablePaginationReturn;
  className?: string;
}

export function TablePagination({ pagination, className = '' }: TablePaginationProps) {
  const selectId = useId();
  const resolved = computeTablePagination({
    page: pagination.page,
    pageSize: pagination.pageSize ?? 10,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
    hasMore: pagination.hasMore,
  });

  const variant = pagination.variant ?? 'pages';
  if (variant === 'none') {
    return null;
  }

  const align = pagination.align ?? 'end';
  const label = pagination.label ?? 'Paginação da tabela';
  const pageSizeOptions = pagination.pageSizeOptions;
  const visiblePages =
    variant === 'pages' && resolved.totalPages !== undefined
      ? getVisibleTablePages(resolved.page, resolved.totalPages)
      : [];

  const summaryText =
    resolved.totalItems !== undefined
      ? resolved.totalItems === 0
        ? '0 itens'
        : `Mostrando ${resolved.rangeStart}–${resolved.rangeEnd} de ${resolved.totalItems}`
      : resolved.totalPages !== undefined
        ? `Página ${resolved.page} de ${resolved.totalPages}`
        : `Página ${resolved.page}`;

  return (
    <nav
      aria-label={label}
      class={[
        'ui-table-pagination',
        `ui-table-pagination--${align}`,
        `ui-table-pagination--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div class="ui-table-pagination__info">
        <span class="ui-table-pagination__summary">{summaryText}</span>
        {pageSizeOptions && pageSizeOptions.length > 0 && pagination.onPageSizeChange && (
          <label for={selectId} class="ui-table-pagination__size">
            <span class="ui-table-pagination__size-label">Por página</span>
            <select
              id={selectId}
              class="select-control ui-table-pagination__select"
              value={String(resolved.pageSize)}
              aria-label="Itens por página"
              onChange={event => {
                const nextSize = Number((event.target as HTMLSelectElement).value);
                if (Number.isFinite(nextSize) && nextSize > 0) {
                  pagination.onPageSizeChange?.(nextSize);
                }
              }}
            >
              {pageSizeOptions.map(option => (
                <option key={option} value={String(option)}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {variant !== 'count' && (
        <div class="ui-table-pagination__controls">
          {variant === 'pages' && resolved.totalPages !== undefined && (
            <button
              type="button"
              class="ui-table-pagination__btn"
              disabled={!resolved.canPrev}
              aria-label="Primeira página"
              onClick={() => pagination.onPageChange(1)}
            >
              <Icon name="chevrons-left" size={14} />
            </button>
          )}

          <button
            type="button"
            class="ui-table-pagination__btn"
            disabled={!resolved.canPrev}
            aria-label="Página anterior"
            onClick={() => pagination.onPageChange(Math.max(1, resolved.page - 1))}
          >
            <Icon name="chevron-left" size={14} />
          </button>

          {variant === 'pages' &&
            visiblePages.map((entry, idx) =>
              entry === 'ellipsis' ? (
                <span
                  key={`ellipsis-${idx}`}
                  class="ui-table-pagination__ellipsis"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  class={[
                    'ui-table-pagination__btn',
                    entry === resolved.page ? 'ui-table-pagination__btn--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={`Página ${entry}`}
                  aria-current={entry === resolved.page ? 'page' : undefined}
                  onClick={() => pagination.onPageChange(entry)}
                >
                  {entry}
                </button>
              )
            )}

          {variant === 'compact' && (
            <span class="ui-table-pagination__compact-page">
              {resolved.totalPages !== undefined
                ? `${resolved.page} / ${resolved.totalPages}`
                : `${resolved.page}`}
            </span>
          )}

          <button
            type="button"
            class="ui-table-pagination__btn"
            disabled={!resolved.canNext}
            aria-label="Próxima página"
            onClick={() => pagination.onPageChange(resolved.page + 1)}
          >
            <Icon name="chevron-right" size={14} />
          </button>

          {variant === 'pages' && resolved.totalPages !== undefined && (
            <button
              type="button"
              class="ui-table-pagination__btn"
              disabled={!resolved.canNext}
              aria-label="Última página"
              onClick={() => pagination.onPageChange(resolved.totalPages!)}
            >
              <Icon name="chevrons-right" size={14} />
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export interface TableEmptyRowProps {
  colSpan: number;
  title?: string;
  message?: string;
  icon?: IconName;
  action?: ComponentChildren;
  className?: string;
}

export function TableEmptyRow({
  colSpan,
  title = 'Nenhum registro encontrado',
  message = 'Ajuste os filtros ou adicione novos itens para preencher esta tabela.',
  icon = 'inbox',
  action,
  className = '',
}: TableEmptyRowProps) {
  return (
    <tr class={['ui-table__empty-row', className].filter(Boolean).join(' ')}>
      <td colSpan={colSpan} class="ui-table__empty-cell">
        <EmptyState title={title} message={message} icon={icon} action={action} />
      </td>
    </tr>
  );
}
