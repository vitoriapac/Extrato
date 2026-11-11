import {
  createContext,
  isValidElement,
  toChildArray,
  type ComponentChildren,
  type VNode,
} from 'preact';
import { useContext, useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from './button.js';
import { isBackdropClick } from './dialog.js';
import { Icon, type IconName } from './icon.js';
import { normalizeComboboxQuery } from './select-field.js';
import { getRovingTabIndex } from './tabs.js';

export interface CommandPaletteItemMeta {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

interface InternalCommandEntry extends CommandPaletteItemMeta {
  optionId: string;
}

interface CommandPaletteContextValue {
  query: string;
  setQuery: (next: string) => void;
  open: boolean;
  close: () => void;
  listboxId: string;
  inputId: string;
  titleId: string;
  listClassName: string;
  activeIndex: number;
  setActiveIndex: (idx: number) => void;
  activeOptionId: string | undefined;
  visibleItems: InternalCommandEntry[];
  selectItem: (item: CommandPaletteItemMeta) => void;
  moveActive: (key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End') => void;
  confirmActive: () => void;
  registerOptionEl: (optionId: string, el: HTMLButtonElement | null) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

/**
 * Compara texto principal, descrição e palavras-chave usando normalização sem acentos.
 */
export function matchesCommandQuery(
  label: string,
  query: string,
  keywords: string[] = [],
  description = ''
): boolean {
  const normalizedQuery = normalizeComboboxQuery(query);
  if (!normalizedQuery) return true;
  const haystack = [label, description, ...keywords].map(normalizeComboboxQuery).join(' ');
  return haystack.includes(normalizedQuery);
}

/**
 * Filtra uma lista plana de comandos segundo a consulta digitada.
 */
export function filterCommandItems<T extends CommandPaletteItemMeta>(
  items: T[],
  query: string
): T[] {
  const normalizedQuery = normalizeComboboxQuery(query);
  if (!normalizedQuery) return items;
  return items.filter(item =>
    matchesCommandQuery(item.label, normalizedQuery, item.keywords || [], item.description || '')
  );
}

function collectVisibleCommandItems(
  children: ComponentChildren,
  query: string,
  listboxId: string,
  entries: InternalCommandEntry[] = []
): InternalCommandEntry[] {
  for (const child of toChildArray(children)) {
    if (!isValidElement(child)) continue;
    const vnode = child as VNode<Record<string, any>>;
    if (vnode.type === CommandPaletteItem) {
      const props = vnode.props as CommandPaletteItemProps;
      const visible =
        props.forceMount ||
        matchesCommandQuery(props.label, query, props.keywords || [], props.description || '');
      if (visible) {
        const idx = entries.length;
        entries.push({
          value: props.value,
          label: props.label,
          description: props.description,
          keywords: props.keywords,
          disabled: Boolean(props.disabled),
          onSelect: props.onSelect,
          optionId: `${listboxId}-opt-${idx}`,
        });
      }
      continue;
    }
    if (vnode.props && 'children' in vnode.props && vnode.props.children !== undefined) {
      collectVisibleCommandItems(
        vnode.props.children as ComponentChildren,
        query,
        listboxId,
        entries
      );
    }
  }
  return entries;
}

function groupHasMatchingItem(children: ComponentChildren, query: string): boolean {
  for (const child of toChildArray(children)) {
    if (!isValidElement(child)) continue;
    const vnode = child as VNode<Record<string, any>>;
    if (vnode.type === CommandPaletteItem) {
      const props = vnode.props as CommandPaletteItemProps;
      if (
        props.forceMount ||
        matchesCommandQuery(props.label, query, props.keywords || [], props.description || '')
      ) {
        return true;
      }
    } else if (
      vnode.props &&
      'children' in vnode.props &&
      groupHasMatchingItem(vnode.props.children as ComponentChildren, query)
    ) {
      return true;
    }
  }
  return false;
}

export type CommandPaletteSize = 'md' | 'lg';

export interface CommandPaletteProps {
  dialogId?: string;
  inputId?: string;
  listboxId?: string;
  statusId?: string;
  listClassName?: string;
  autoSelectFirst?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onSelect?: (value: string, item: CommandPaletteItemMeta) => void;
  closeOnSelect?: boolean;
  closeOnBackdropClick?: boolean;
  restoreFocusOnClose?: boolean;
  resetQueryOnClose?: boolean;
  enableHotkey?: boolean;
  hotkey?: string;
  label?: string;
  size?: CommandPaletteSize;
  className?: string;
  children?: ComponentChildren;
}

export function CommandPalette({
  dialogId,
  inputId: customInputId,
  listboxId: customListboxId,
  statusId,
  listClassName = '',
  autoSelectFirst = true,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onClose,
  query: controlledQuery,
  defaultQuery = '',
  onQueryChange,
  onSelect,
  closeOnSelect = true,
  closeOnBackdropClick = true,
  restoreFocusOnClose = true,
  resetQueryOnClose = true,
  enableHotkey = false,
  hotkey = 'k',
  label = 'Paleta de comandos',
  size = 'md',
  className = '',
  children,
}: CommandPaletteProps) {
  const baseId = useId();
  const listboxId = customListboxId || `${baseId}-listbox`;
  const inputId = customInputId || `${baseId}-input`;
  const titleId = `${baseId}-title`;

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const [internalQuery, setInternalQuery] = useState(defaultQuery);
  const query = controlledQuery !== undefined ? controlledQuery : internalQuery;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const skipFocusRestoreRef = useRef(false);
  const optionRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const visibleItems = useMemo(
    () => collectVisibleCommandItems(children, query, listboxId),
    [children, query, listboxId]
  );

  const firstEnabledIndex = useMemo(
    () => visibleItems.findIndex(item => !item.disabled),
    [visibleItems]
  );
  const [activeIndex, setActiveIndex] = useState<number>(
    autoSelectFirst ? firstEnabledIndex : -1
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(autoSelectFirst ? firstEnabledIndex : -1);
      return;
    }
    if (visibleItems.length === 0) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(prev => {
      if (prev >= 0 && prev < visibleItems.length && !visibleItems[prev]?.disabled) {
        return prev;
      }
      return autoSelectFirst ? firstEnabledIndex : -1;
    });
  }, [isOpen, visibleItems, firstEnabledIndex, autoSelectFirst]);

  const closePaletteSynchronously = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      } else if (dialog.hasAttribute?.('open')) {
        dialog.removeAttribute('open');
      }
    }
    if (typeof document !== 'undefined') {
      const mainContent = document.getElementById('mainContent');
      const stillHasModal =
        typeof document.querySelector === 'function' &&
        Boolean(document.querySelector('dialog[open], .modal-overlay.show'));
      if (mainContent && !stillHasModal) {
        mainContent.inert = false;
      }
    }
  };

  const setOpenState = (next: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
    if (!next) {
      onClose?.();
      if (resetQueryOnClose) {
        if (controlledQuery === undefined) {
          setInternalQuery('');
        }
        onQueryChange?.('');
      }
    }
  };

  const setQuery = (next: string) => {
    if (controlledQuery === undefined) {
      setInternalQuery(next);
    }
    onQueryChange?.(next);
  };

  useEffect(() => {
    if (!enableHotkey || typeof document === 'undefined') return undefined;
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key.toLowerCase() === hotkey.toLowerCase()
      ) {
        if (
          !isOpen &&
          typeof document.querySelector === 'function' &&
          document.querySelector('dialog[open], .modal-overlay.show, .overlay.show')
        ) {
          return;
        }
        event.preventDefault();
        setOpenState(!isOpen);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [enableHotkey, hotkey, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof document === 'undefined') return;

    if (isOpen) {
      skipFocusRestoreRef.current = false;
      if (
        !wasOpenRef.current &&
        document.activeElement &&
        document.activeElement !== document.body &&
        !dialog.contains(document.activeElement)
      ) {
        previousFocusRef.current = document.activeElement as HTMLElement;
      }
      wasOpenRef.current = true;
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      }
      queueMicrotask(() => {
        const safeId =
          typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(inputId)
            : inputId;
        const input =
          dialog.querySelector<HTMLInputElement>(`#${safeId}`) ||
          dialog.querySelector<HTMLInputElement>('[data-command-input]');
        input?.focus();
      });
    } else if (wasOpenRef.current || dialog.open || dialog.hasAttribute?.('open')) {
      wasOpenRef.current = false;
      closePaletteSynchronously();
      const target = previousFocusRef.current;
      previousFocusRef.current = null;
      const shouldRestore = restoreFocusOnClose && !skipFocusRestoreRef.current;
      skipFocusRestoreRef.current = false;
      const active = document.activeElement;
      if (
        shouldRestore &&
        target &&
        typeof target.focus === 'function' &&
        (!active || active === document.body || dialog.contains(active))
      ) {
        if (target.isConnected) target.focus();
        queueMicrotask(() => {
          if (
            target.isConnected &&
            (!document.activeElement || document.activeElement === document.body)
          ) {
            target.focus();
          }
        });
      }
    }
  }, [isOpen, inputId, restoreFocusOnClose]);

  const resolvedActiveIndex =
    activeIndex >= 0 && activeIndex < visibleItems.length
      ? activeIndex
      : autoSelectFirst
        ? firstEnabledIndex
        : -1;
  const activeOption = resolvedActiveIndex >= 0 ? visibleItems[resolvedActiveIndex] : undefined;

  const moveActive = (key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End') => {
    const effectiveKey =
      resolvedActiveIndex < 0 && key === 'ArrowUp'
        ? 'End'
        : resolvedActiveIndex < 0 && key === 'ArrowDown'
          ? 'Home'
          : key;
    const nextIdx = getRovingTabIndex(
      resolvedActiveIndex,
      effectiveKey,
      visibleItems.length,
      'vertical',
      idx => Boolean(visibleItems[idx]?.disabled)
    );
    if (nextIdx === null) return;
    setActiveIndex(nextIdx);
    const nextOption = visibleItems[nextIdx];
    if (nextOption) {
      optionRefs.current.get(nextOption.optionId)?.scrollIntoView?.({ block: 'nearest' });
    }
  };

  const selectItem = (item: CommandPaletteItemMeta) => {
    if (item.disabled) return;
    if (closeOnSelect) {
      skipFocusRestoreRef.current = true;
      wasOpenRef.current = false;
      previousFocusRef.current = null;
      closePaletteSynchronously();
      setOpenState(false);
    }
    item.onSelect?.(item.value);
    onSelect?.(item.value, item);
  };

  const confirmActive = () => {
    if (activeOption && !activeOption.disabled) {
      selectItem(activeOption);
    }
  };

  const ctxValue: CommandPaletteContextValue = {
    query,
    setQuery,
    open: isOpen,
    close: () => setOpenState(false),
    listboxId,
    inputId,
    titleId,
    listClassName,
    activeIndex: resolvedActiveIndex,
    setActiveIndex,
    activeOptionId: activeOption?.optionId,
    visibleItems,
    selectItem,
    moveActive,
    confirmActive,
    registerOptionEl: (optionId, el) => {
      if (el) optionRefs.current.set(optionId, el);
      else optionRefs.current.delete(optionId);
    },
  };

  const dialogClass = [
    'ui-command-palette',
    size === 'lg' ? 'ui-command-palette--lg' : 'ui-command-palette--md',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const ssrOpenAttr = typeof document === 'undefined' && isOpen ? true : undefined;
  const trimmedQuery = query.trim();
  const statusText =
    statusId && isOpen && trimmedQuery
      ? visibleItems.length
        ? `${visibleItems.length} ${visibleItems.length === 1 ? 'resultado' : 'resultados'} para "${trimmedQuery}"`
        : `Nada encontrado para "${trimmedQuery}"`
      : '';

  return (
    <CommandPaletteContext.Provider value={ctxValue}>
      <dialog
        ref={dialogRef}
        id={dialogId}
        open={ssrOpenAttr}
        aria-label={label}
        class={dialogClass}
        onCancel={event => {
          event.preventDefault();
          setOpenState(false);
        }}
        onClick={event => {
          if (closeOnBackdropClick && !event.defaultPrevented && isBackdropClick(event)) {
            setOpenState(false);
          }
        }}
      >
        <div class="ui-command-palette__surface">{children}</div>
        {statusId && (
          <div id={statusId} class="sr-only" role="status" aria-live="polite">
            {statusText}
          </div>
        )}
      </dialog>
    </CommandPaletteContext.Provider>
  );
}

export interface CommandPaletteInputProps {
  placeholder?: string;
  ariaLabel?: string;
  clearLabel?: string;
  showCloseButton?: boolean;
  closeLabel?: string;
  className?: string;
}

export function CommandPaletteInput({
  placeholder = 'Buscar comando, disciplina ou tópico...',
  ariaLabel = 'Buscar comandos',
  clearLabel = 'Limpar busca',
  showCloseButton = false,
  closeLabel = 'Fechar paleta',
  className = '',
}: CommandPaletteInputProps) {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error('CommandPaletteInput deve ser usado dentro de CommandPalette.');
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      event.preventDefault();
      ctx.moveActive(event.key);
    } else if (event.key === 'Enter') {
      if (ctx.activeOptionId) {
        event.preventDefault();
        ctx.confirmActive();
      } else if (ctx.query.trim()) {
        const firstEnabled = ctx.visibleItems.find(item => !item.disabled);
        if (firstEnabled) {
          event.preventDefault();
          ctx.selectItem(firstEnabled);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      ctx.close();
    }
  };

  return (
    <div class={['ui-command-palette__header', className].filter(Boolean).join(' ')}>
      <Icon name="search" size={16} class="ui-command-palette__search-icon shrink-0" />
      <input
        id={ctx.inputId}
        data-command-input=""
        type="search"
        role="combobox"
        list={undefined}
        autocomplete="off"
        spellcheck={false}
        value={ctx.query}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={ctx.open ? 'true' : 'false'}
        aria-controls={ctx.listboxId}
        aria-activedescendant={ctx.activeOptionId}
        class="ui-command-palette__input"
        onInput={event => ctx.setQuery((event.target as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
      />
      {ctx.query && (
        <Button
          variant="ghost"
          size="small"
          aria-label={clearLabel}
          onClick={() => ctx.setQuery('')}
          className="ui-command-palette__clear"
        >
          <Icon name="x" size={14} />
        </Button>
      )}
      {showCloseButton && (
        <Button
          variant="ghost"
          size="small"
          aria-label={closeLabel}
          onClick={ctx.close}
          className="ui-command-palette__close"
        >
          <Icon name="x" size={16} />
        </Button>
      )}
    </div>
  );
}

export interface CommandPaletteListProps {
  label?: string;
  emptyMessage?: string;
  className?: string;
  children?: ComponentChildren;
}

export function CommandPaletteList({
  label = 'Comandos disponíveis',
  emptyMessage = 'Nenhum comando correspondente encontrado.',
  className = '',
  children,
}: CommandPaletteListProps) {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error('CommandPaletteList deve ser usado dentro de CommandPalette.');
  }

  const childArray = toChildArray(children);
  const hasExplicitEmpty = childArray.some(
    child => isValidElement(child) && (child as VNode).type === CommandPaletteEmpty
  );

  return (
    <div
      id={ctx.listboxId}
      role="listbox"
      aria-label={label}
      class={['ui-command-palette__list', ctx.listClassName, className].filter(Boolean).join(' ')}
    >
      {children}
      {!hasExplicitEmpty && ctx.visibleItems.length === 0 && (
        <CommandPaletteEmpty>{emptyMessage}</CommandPaletteEmpty>
      )}
    </div>
  );
}

export interface CommandPaletteGroupProps {
  heading: string;
  className?: string;
  children?: ComponentChildren;
}

export function CommandPaletteGroup({
  heading,
  className = '',
  children,
}: CommandPaletteGroupProps) {
  const ctx = useContext(CommandPaletteContext);
  const headingId = useId();
  if (!ctx) {
    throw new Error('CommandPaletteGroup deve ser usado dentro de CommandPalette.');
  }

  if (!groupHasMatchingItem(children, ctx.query)) {
    return null;
  }

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      class={['ui-command-palette__group', className].filter(Boolean).join(' ')}
    >
      <div id={headingId} class="ui-command-palette__group-heading">
        {heading}
      </div>
      {children}
    </div>
  );
}

export interface CommandPaletteItemProps {
  value: string;
  label: string;
  description?: string;
  icon?: IconName;
  leading?: ComponentChildren;
  trailing?: ComponentChildren;
  shortcut?: string | string[];
  keywords?: string[];
  disabled?: boolean;
  forceMount?: boolean;
  onSelect?: (value: string) => void;
  className?: string;
  children?: ComponentChildren;
}

export function CommandPaletteItem({
  value,
  label,
  description,
  icon,
  leading,
  trailing,
  shortcut,
  keywords,
  disabled = false,
  forceMount = false,
  onSelect,
  className = '',
  children,
}: CommandPaletteItemProps) {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error('CommandPaletteItem deve ser usado dentro de CommandPalette.');
  }

  const visible =
    forceMount || matchesCommandQuery(label, ctx.query, keywords || [], description || '');
  if (!visible) return null;

  const entryIndex = ctx.visibleItems.findIndex(
    item => item.value === value && item.label === label
  );
  const optionId =
    entryIndex >= 0 ? ctx.visibleItems[entryIndex]?.optionId : `${ctx.listboxId}-opt-${value}`;
  const isSelected = Boolean(optionId && ctx.activeOptionId === optionId);
  const shortcutKeys = Array.isArray(shortcut) ? shortcut : shortcut ? [shortcut] : [];

  return (
    <button
      ref={el => {
        if (optionId) ctx.registerOptionEl(optionId, el);
      }}
      id={optionId}
      type="button"
      role="option"
      tabIndex={-1}
      disabled={disabled}
      aria-selected={isSelected ? 'true' : 'false'}
      aria-disabled={disabled ? 'true' : undefined}
      data-command-value={value}
      class={[
        'ui-command-palette__item',
        isSelected ? 'ui-command-palette__item--active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={() => {
        if (!disabled && entryIndex >= 0) {
          ctx.setActiveIndex(entryIndex);
        }
      }}
      onMouseDown={event => {
        event.preventDefault();
      }}
      onClick={() => {
        ctx.selectItem({ value, label, description, keywords, disabled, onSelect });
      }}
    >
      {leading ?? (icon && <Icon name={icon} size={16} class="ui-command-palette__item-icon shrink-0" />)}
      <span class="ui-command-palette__item-body">
        <span class="ui-command-palette__item-label">{children ?? label}</span>
        {description && <span class="ui-command-palette__item-description">{description}</span>}
      </span>
      {(trailing || shortcutKeys.length > 0) && (
        <span class="ui-command-palette__item-trail">
          {trailing}
          {shortcutKeys.length > 0 && (
            <span class="ui-command-palette__shortcuts" aria-hidden="true">
              {shortcutKeys.map((key, idx) => (
                <kbd key={`${value}-key-${idx}`} class="ui-command-palette__kbd">
                  {key}
                </kbd>
              ))}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

export interface CommandPaletteEmptyProps {
  icon?: IconName;
  alwaysRender?: boolean;
  className?: string;
  children?: ComponentChildren;
}

export function CommandPaletteEmpty({
  icon = 'search',
  alwaysRender = false,
  className = '',
  children = 'Nenhum comando encontrado.',
}: CommandPaletteEmptyProps) {
  const ctx = useContext(CommandPaletteContext);
  if (!alwaysRender && ctx && ctx.visibleItems.length > 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      class={['ui-command-palette__empty', className].filter(Boolean).join(' ')}
    >
      <Icon name={icon} size={20} class="text-muted shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export interface CommandPaletteFooterProps {
  className?: string;
  children?: ComponentChildren;
}

export function CommandPaletteFooter({ className = '', children }: CommandPaletteFooterProps) {
  return (
    <footer class={['ui-command-palette__footer', className].filter(Boolean).join(' ')}>
      {children ?? (
        <>
          <div class="ui-command-palette__hints">
            <span class="ui-command-palette__hint">
              <kbd class="ui-command-palette__kbd" aria-hidden="true">
                <Icon name="arrow-up" size={12} />
              </kbd>
              <kbd class="ui-command-palette__kbd" aria-hidden="true">
                <Icon name="arrow-down" size={12} />
              </kbd>
              <span>Navegar</span>
            </span>
            <span class="ui-command-palette__hint">
              <kbd class="ui-command-palette__kbd" aria-hidden="true">
                <Icon name="corner-down-left" size={12} />
              </kbd>
              <span>Selecionar</span>
            </span>
            <span class="ui-command-palette__hint">
              <kbd class="ui-command-palette__kbd">Esc</kbd>
              <span>Fechar</span>
            </span>
          </div>
          <span>Paleta de comandos</span>
        </>
      )}
    </footer>
  );
}

export type { CommandPaletteFooterProps as CommandPaletteFooterSlotProps };
