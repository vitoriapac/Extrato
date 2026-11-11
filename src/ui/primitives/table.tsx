import { createContext, type ComponentChildren, type JSX } from 'preact';
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from './button.js';
import { EmptyState } from './empty-state.js';
import { Icon, type IconName } from './icon.js';
import { normalizeComboboxQuery } from './select-field.js';

export type TableSortDirection = 'asc' | 'desc' | null;

export interface TableSortState {
  key: string | null;
  direction: TableSortDirection;
}

export type TableDensity = 'compact' | 'comfortable' | 'spacious';
export type TableAlign = 'start' | 'center' | 'end';
export type TablePaginationVariant = 'pages' | 'count' | 'compact' | 'none';
export type TablePaginationAlign = 'start' | 'center' | 'end';

const ptBrCollator = new Intl.Collator('pt-BR', {
  numeric: true,
  sensitivity: 'base',
});

/**
 * Alterna a direção de ordenação de uma coluna seguindo o ciclo asc -> desc -> null (opcional).
 */
export function cycleTableSort(
  current: TableSortState,
  key: string,
  allowReset = true
): TableSortState {
  if (current.key !== key || current.direction === null) {
    return { key, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { key, direction: 'desc' };
  }
  return allowReset ? { key: null, direction: null } : { key, direction: 'asc' };
}

function compareTableValues(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b)) {
    return a - b;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }
  return ptBrCollator.compare(String(a), String(b));
}

/**
 * Ordena linhas de tabela de forma estável mantendo valores ausentes no fim.
 */
export function sortTableRows<T>(
  rows: readonly T[],
  sortState: TableSortState,
  accessors?: Record<string, (row: T) => unknown>
): T[] {
  const { key, direction } = sortState;
  if (!key || !direction) {
    return [...rows];
  }

  const accessor = accessors?.[key];
  const factor = direction === 'desc' ? -1 : 1;

  return rows
    .map((row, index) => ({
      row,
      index,
      value: accessor ? accessor(row) : (row as Record<string, unknown>)[key],
    }))
    .sort((left, right) => {
      const aEmpty = left.value === null || left.value === undefined || left.value === '';
      const bEmpty = right.value === null || right.value === undefined || right.value === '';
      if (aEmpty || bEmpty) {
        if (aEmpty && bEmpty) return left.index - right.index;
        return aEmpty ? 1 : -1;
      }
      const delta = compareTableValues(left.value, right.value);
      if (delta !== 0) return delta * factor;
      return left.index - right.index;
    })
    .map(entry => entry.row);
}

/**
 * Alterna seleção de uma linha preservando ou substituindo a lista selecionada.
 */
export function toggleTableSelectionId(
  selectedIds: readonly string[],
  id: string,
  multi = true
): string[] {
  const exists = selectedIds.includes(id);
  if (exists) {
    return multi ? selectedIds.filter(item => item !== id) : [];
  }
  return multi ? [...selectedIds, id] : [id];
}

/**
 * Alterna seleção em lote apenas para os IDs visíveis na página/tabela atual.
 */
export function toggleSelectAllTableIds(
  selectedIds: readonly string[],
  visibleIds: readonly string[]
): string[] {
  if (visibleIds.length === 0) return [...selectedIds];
  const selectedSet = new Set(selectedIds);
  const allVisibleSelected = visibleIds.every(id => selectedSet.has(id));
  if (allVisibleSelected) {
    const visibleSet = new Set(visibleIds);
    return selectedIds.filter(id => !visibleSet.has(id));
  }
  const merged = [...selectedIds];
  for (const id of visibleIds) {
    if (!selectedSet.has(id)) {
      selectedSet.add(id);
      merged.push(id);
    }
  }
  return merged;
}

export interface FilterTableRowsOptions<T> {
  query?: string;
  columnFilters?: Record<string, string | string[] | null | undefined>;
  searchFields?: Array<(row: T) => string | number | null | undefined>;
  columnAccessors?: Record<string, (row: T) => unknown>;
}

/**
 * Filtra linhas com busca global normalizada (sem acento/caixa) e filtros por coluna.
 */
export function filterTableRows<T>(
  rows: readonly T[],
  { query = '', columnFilters = {}, searchFields, columnAccessors }: FilterTableRowsOptions<T> = {}
): T[] {
  const normalizedQuery = normalizeComboboxQuery(query);
  const activeColumnEntries = Object.entries(columnFilters).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  });

  if (!normalizedQuery && activeColumnEntries.length === 0) {
    return [...rows];
  }

  return rows.filter(row => {
    if (normalizedQuery) {
      const values = searchFields
        ? searchFields.map(getter => getter(row))
        : row && typeof row === 'object'
          ? Object.values(row as Record<string, unknown>)
          : [row];
      const haystack = values
        .filter(item => item !== null && item !== undefined)
        .map(item => normalizeComboboxQuery(String(item)))
        .join(' ');
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    for (const [colKey, filterValue] of activeColumnEntries) {
      const accessor = columnAccessors?.[colKey];
      const cellValue = accessor ? accessor(row) : (row as Record<string, unknown>)[colKey];
      const normalizedCell =
        cellValue === null || cellValue === undefined
          ? ''
          : normalizeComboboxQuery(String(cellValue));

      if (Array.isArray(filterValue)) {
        const expected = filterValue.map(v => normalizeComboboxQuery(v));
        if (!expected.includes(normalizedCell)) return false;
      } else if (normalizedCell !== normalizeComboboxQuery(String(filterValue))) {
        return false;
      }
    }

    return true;
  });
}

export interface TablePaginationMetaInput {
  page: number;
  pageSize: number;
  totalItems?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface TablePaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number | undefined;
  totalPages: number | undefined;
  startIndex: number;
  endIndex: number;
  rangeStart: number;
  rangeEnd: number;
  canPrev: boolean;
  canNext: boolean;
}

/**
 * Calcula limites seguros de paginação (base 1) para tabelas client-side ou baseadas em cursor.
 */
export function computeTablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  hasMore,
}: TablePaginationMetaInput): TablePaginationMeta {
  const safePageSize = Math.max(1, Math.floor(Number.isFinite(pageSize) ? pageSize : 10));
  const safeTotalItems = totalItems !== undefined ? Math.max(0, Math.floor(totalItems)) : undefined;
  const computedTotalPages =
    totalPages !== undefined
      ? Math.max(1, Math.floor(totalPages))
      : safeTotalItems !== undefined
        ? Math.max(1, Math.ceil(safeTotalItems / safePageSize))
        : undefined;

  const rawPage = Math.max(1, Math.floor(Number.isFinite(page) ? page : 1));
  const safePage =
    computedTotalPages !== undefined ? Math.min(rawPage, computedTotalPages) : rawPage;

  const startIndex = (safePage - 1) * safePageSize;
  const endIndex =
    safeTotalItems !== undefined
      ? Math.min(safeTotalItems, startIndex + safePageSize)
      : startIndex + safePageSize;

  const rangeStart = safeTotalItems === 0 ? 0 : startIndex + 1;
  const rangeEnd = safeTotalItems === 0 ? 0 : endIndex;

  return {
    page: safePage,
    pageSize: safePageSize,
    totalItems: safeTotalItems,
    totalPages: computedTotalPages,
    startIndex,
    endIndex,
    rangeStart,
    rangeEnd,
    canPrev: safePage > 1,
    canNext: computedTotalPages !== undefined ? safePage < computedTotalPages : Boolean(hasMore),
  };
}

/**
 * Fatia uma coleção conforme página (base 1) e tamanho da página.
 */
export function paginateTableRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number
): { items: T[]; pagination: TablePaginationMeta } {
  const pagination = computeTablePagination({
    page,
    pageSize,
    totalItems: rows.length,
  });
  return {
    items: rows.slice(pagination.startIndex, pagination.endIndex),
    pagination,
  };
}

/**
 * Calcula a janela de números de página com reticências (`'ellipsis'`) para listas extensas.
 */
export function getVisibleTablePages(
  currentPage: number,
  totalPages: number
): Array<number | 'ellipsis'> {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const safeCurrent = Math.max(1, Math.min(currentPage, totalPages));
  const pages: Array<number | 'ellipsis'> = [1];

  const windowStart = Math.max(2, safeCurrent - 1);
  const windowEnd = Math.min(totalPages - 1, safeCurrent + 1);

  if (windowStart > 2) {
    pages.push('ellipsis');
  }
  for (let page = windowStart; page <= windowEnd; page += 1) {
    pages.push(page);
  }
  if (windowEnd < totalPages - 1) {
    pages.push('ellipsis');
  }
  pages.push(totalPages);

  return pages;
}

export interface UseTableSortableStateOptions {
  initialKey?: string | null;
  initialDirection?: TableSortDirection;
  allowReset?: boolean;
}

export function useTableSortableState({
  initialKey = null,
  initialDirection = null,
  allowReset = true,
}: UseTableSortableStateOptions = {}) {
  const [sortState, setSortState] = useState<TableSortState>({
    key: initialKey,
    direction: initialKey ? (initialDirection ?? 'asc') : null,
  });

  const toggleSort = useCallback(
    (key: string) => {
      setSortState(prev => cycleTableSort(prev, key, allowReset));
    },
    [allowReset]
  );

  const clearSort = useCallback(() => {
    setSortState({ key: null, direction: null });
  }, []);

  const getSortDirection = useCallback(
    (key: string): TableSortDirection => (sortState.key === key ? sortState.direction : null),
    [sortState]
  );

  const getAriaSort = useCallback(
    (key: string): 'ascending' | 'descending' | 'none' => {
      if (sortState.key !== key || !sortState.direction) return 'none';
      return sortState.direction === 'asc' ? 'ascending' : 'descending';
    },
    [sortState]
  );

  return {
    sortState,
    setSortState,
    toggleSort,
    clearSort,
    getSortDirection,
    getAriaSort,
  };
}

export function useTableSelectionState(initialIds: readonly string[] = []) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [...initialIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const isSelected = useCallback((id: string) => selectedSet.has(id), [selectedSet]);

  const toggleRow = useCallback((id: string, multi = true) => {
    setSelectedIds(prev => toggleTableSelectionId(prev, id, multi));
  }, []);

  const selectRows = useCallback((ids: readonly string[]) => {
    setSelectedIds(Array.from(new Set(ids)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const toggleAll = useCallback((visibleIds: readonly string[]) => {
    setSelectedIds(prev => toggleSelectAllTableIds(prev, visibleIds));
  }, []);

  const areAllSelected = useCallback(
    (visibleIds: readonly string[]) =>
      visibleIds.length > 0 && visibleIds.every(id => selectedSet.has(id)),
    [selectedSet]
  );

  const areSomeSelected = useCallback(
    (visibleIds: readonly string[]) => {
      if (visibleIds.length === 0) return false;
      const selectedCountInView = visibleIds.filter(id => selectedSet.has(id)).length;
      return selectedCountInView > 0 && selectedCountInView < visibleIds.length;
    },
    [selectedSet]
  );

  return {
    selectedIds,
    selectedSet,
    selectedCount: selectedIds.length,
    isSelected,
    toggleRow,
    selectRows,
    clearSelection,
    toggleAll,
    areAllSelected,
    areSomeSelected,
  };
}

export interface TablePaginationConfig {
  page: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  totalPages?: number;
  hasMore?: boolean;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  variant?: TablePaginationVariant;
  align?: TablePaginationAlign;
  label?: string;
}

export interface UseTablePaginationReturn extends TablePaginationMeta {
  variant: TablePaginationVariant;
  align: TablePaginationAlign;
  label: string;
  pageSizeOptions?: number[];
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  goToPage: (targetPage: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (nextPageSize: number) => void;
}

export function useTablePagination(config: TablePaginationConfig): UseTablePaginationReturn {
  const {
    page,
    onPageChange,
    totalItems,
    totalPages,
    hasMore = false,
    pageSize = 10,
    onPageSizeChange,
    pageSizeOptions,
    variant = 'pages',
    align = 'end',
    label = 'Paginação da tabela',
  } = config;

  const meta = useMemo(
    () =>
      computeTablePagination({
        page,
        pageSize,
        totalItems,
        totalPages,
        hasMore,
      }),
    [page, pageSize, totalItems, totalPages, hasMore]
  );

  const goToPage = useCallback(
    (targetPage: number) => {
      const clamped =
        meta.totalPages !== undefined
          ? Math.max(1, Math.min(targetPage, meta.totalPages))
          : Math.max(1, targetPage);
      if (clamped !== meta.page) {
        onPageChange(clamped);
      }
    },
    [meta.page, meta.totalPages, onPageChange]
  );

  const nextPage = useCallback(() => {
    if (meta.canNext) onPageChange(meta.page + 1);
  }, [meta.canNext, meta.page, onPageChange]);

  const prevPage = useCallback(() => {
    if (meta.canPrev) onPageChange(meta.page - 1);
  }, [meta.canPrev, meta.page, onPageChange]);

  const firstPage = useCallback(() => {
    if (meta.page !== 1) onPageChange(1);
  }, [meta.page, onPageChange]);

  const lastPage = useCallback(() => {
    if (meta.totalPages !== undefined && meta.page !== meta.totalPages) {
      onPageChange(meta.totalPages);
    }
  }, [meta.page, meta.totalPages, onPageChange]);

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      onPageSizeChange?.(Math.max(1, Math.floor(nextPageSize)));
    },
    [onPageSizeChange]
  );

  return {
    ...meta,
    variant,
    align,
    label,
    pageSizeOptions,
    hasMore: Boolean(hasMore),
    onPageChange,
    onPageSizeChange,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
  };
}

export interface UseTableFilterStateOptions {
  initialQuery?: string;
  initialColumnFilters?: Record<string, string | string[]>;
}

export function useTableFilterState({
  initialQuery = '',
  initialColumnFilters = {},
}: UseTableFilterStateOptions = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [columnFilters, setColumnFilters] =
    useState<Record<string, string | string[]>>(initialColumnFilters);

  const setColumnFilter = useCallback((key: string, value: string | string[]) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeColumnFilter = useCallback((key: string) => {
    setColumnFilters(prev => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setColumnFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    if (query.trim() !== '') return true;
    return Object.values(columnFilters).some(value =>
      Array.isArray(value) ? value.length > 0 : String(value).trim() !== ''
    );
  }, [query, columnFilters]);

  return {
    query,
    setQuery,
    columnFilters,
    setColumnFilter,
    removeColumnFilter,
    clearFilters,
    hasActiveFilters,
  };
}

export interface TableColumnSettingDefinition {
  key: string;
  defaultHidden?: boolean;
  defaultWidth?: number;
}

export function useTableColumnSettingsState(columns: readonly TableColumnSettingDefinition[]) {
  const initialHidden = useMemo(
    () => columns.filter(col => col.defaultHidden).map(col => col.key),
    [columns]
  );
  const initialOrder = useMemo(() => columns.map(col => col.key), [columns]);
  const initialWidths = useMemo(() => {
    const widths: Record<string, number> = {};
    for (const col of columns) {
      if (col.defaultWidth !== undefined) widths[col.key] = col.defaultWidth;
    }
    return widths;
  }, [columns]);

  const [hiddenKeys, setHiddenKeys] = useState<string[]>(initialHidden);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialOrder);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialWidths);

  const hiddenSet = useMemo(() => new Set(hiddenKeys), [hiddenKeys]);

  const isColumnVisible = useCallback((key: string) => !hiddenSet.has(key), [hiddenSet]);

  const toggleColumnVisibility = useCallback((key: string) => {
    setHiddenKeys(prev =>
      prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
    );
  }, []);

  const setColumnWidth = useCallback((key: string, widthPx: number) => {
    setColumnWidths(prev => ({ ...prev, [key]: Math.max(48, Math.round(widthPx)) }));
  }, []);

  const moveColumn = useCallback((key: string, targetIndex: number) => {
    setColumnOrder(prev => {
      const currentIndex = prev.indexOf(key);
      if (currentIndex < 0) return prev;
      const boundedTarget = Math.max(0, Math.min(targetIndex, prev.length - 1));
      if (currentIndex === boundedTarget) return prev;
      const next = [...prev];
      next.splice(currentIndex, 1);
      next.splice(boundedTarget, 0, key);
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => {
    setHiddenKeys(initialHidden);
    setColumnOrder(initialOrder);
    setColumnWidths(initialWidths);
  }, [initialHidden, initialOrder, initialWidths]);

  return {
    hiddenKeys,
    columnOrder,
    columnWidths,
    isColumnVisible,
    toggleColumnVisibility,
    setColumnOrder,
    moveColumn,
    setColumnWidth,
    resetColumns,
  };
}

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
