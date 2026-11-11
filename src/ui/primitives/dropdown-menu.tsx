import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { Button, type ButtonProps } from './button.js';
import { Icon, type IconName } from './icon.js';
import type { PopoverPlacement } from './popover.js';
import { getRovingTabIndex } from './tabs.js';

export interface DropdownMenuItem {
  id: string;
  domId?: string;
  label: string;
  icon?: IconName;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  active?: boolean;
  ariaCurrent?: JSX.IntrinsicElements['button']['aria-current'];
  className?: string;
  dataAttrs?: Record<string, string>;
  onSelect?: () => void;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  triggerLabel?: string;
  triggerAriaLabel?: string;
  triggerIcon?: IconName;
  triggerRightIcon?: IconName;
  triggerVariant?: ButtonProps['variant'] | 'unstyled';
  triggerSize?: ButtonProps['size'];
  triggerId?: string;
  triggerClassName?: string;
  triggerContent?: ComponentChildren;
  menuId?: string;
  menuAriaLabel?: string;
  placement?: PopoverPlacement;
  hint?: string;
  open?: boolean;
  defaultOpen?: boolean;
  keepMounted?: boolean;
  restoreFocusOnSelect?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  menuClassName?: string;
}

export function DropdownMenu({
  items,
  triggerLabel = 'Mais ações',
  triggerAriaLabel,
  triggerIcon = 'dots',
  triggerRightIcon,
  triggerVariant = 'ghost',
  triggerSize = 'small',
  triggerId,
  triggerClassName = '',
  triggerContent,
  menuId: providedMenuId,
  menuAriaLabel,
  placement = 'bottom-end',
  hint,
  open,
  defaultOpen = false,
  keepMounted = false,
  restoreFocusOnSelect = true,
  onOpenChange,
  className = '',
  menuClassName = '',
}: DropdownMenuProps) {
  const generatedMenuId = useId();
  const menuId = providedMenuId || generatedMenuId;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : internalOpen;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusOnOpenRef = useRef(false);

  const setOpenState = (next: boolean, restoreFocus = false, focusFirstItem = false) => {
    focusOnOpenRef.current = focusFirstItem;
    if (open === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
    if (!next && restoreFocus) {
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    if (focusOnOpenRef.current) {
      const firstEnabled = items.findIndex(item => !item.disabled);
      if (firstEnabled >= 0) {
        const firstEl = itemRefs.current[firstEnabled];
        const panel = firstEl?.closest('[role="menu"]');
        if (keepMounted && panel instanceof HTMLElement) {
          panel.hidden = false;
        }
        firstEl?.focus();
      }
      focusOnOpenRef.current = false;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpenState(false, false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setOpenState(false, true);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, items, keepMounted]);

  const handleTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setOpenState(true, false, true);
      } else {
        const firstEnabled = items.findIndex(item => !item.disabled);
        if (firstEnabled >= 0) itemRefs.current[firstEnabled]?.focus();
      }
    }
  };

  const handleItemKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      setOpenState(false, false);
      return;
    }

    const nextIndex = getRovingTabIndex(index, event.key, items.length, 'vertical', idx =>
      Boolean(items[idx]?.disabled)
    );
    if (nextIndex !== null) {
      event.preventDefault();
      itemRefs.current[nextIndex]?.focus();
    }
  };

  const accessibleLabel = menuAriaLabel || triggerAriaLabel || triggerLabel || 'Menu de ações';
  const rootClass = ['ui-popover', className].filter(Boolean).join(' ');
  const menuClasses = ['ui-menu__panel', `ui-popover__panel--${placement}`, menuClassName]
    .filter(Boolean)
    .join(' ');
  const shouldRenderMenu = keepMounted || isOpen;

  return (
    <div ref={rootRef} class={rootClass}>
      {triggerVariant === 'unstyled' ? (
        <button
          ref={el => {
            triggerRef.current = el;
          }}
          id={triggerId}
          type="button"
          class={triggerClassName || undefined}
          aria-label={triggerAriaLabel}
          aria-haspopup="menu"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls={isOpen || keepMounted ? menuId : undefined}
          onClick={() => setOpenState(!isOpen, false, !isOpen)}
          onKeyDown={handleTriggerKeyDown}
        >
          {triggerContent !== undefined ? (
            triggerContent
          ) : (
            <>
              {triggerIcon && <Icon name={triggerIcon} size={16} class="shrink-0" />}
              {triggerLabel ? <span>{triggerLabel}</span> : null}
              {triggerRightIcon && <Icon name={triggerRightIcon} size={14} class="shrink-0" />}
            </>
          )}
        </button>
      ) : (
        <Button
          ref={el => {
            triggerRef.current = el;
          }}
          id={triggerId}
          className={triggerClassName}
          variant={triggerVariant}
          size={triggerSize}
          iconLeft={triggerContent === undefined ? triggerIcon : undefined}
          iconRight={triggerContent === undefined ? triggerRightIcon : undefined}
          aria-label={triggerAriaLabel}
          aria-haspopup="menu"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls={isOpen || keepMounted ? menuId : undefined}
          onClick={() => setOpenState(!isOpen, false, !isOpen)}
          onKeyDown={handleTriggerKeyDown}
        >
          {triggerContent !== undefined ? triggerContent : triggerLabel || undefined}
        </Button>
      )}

      {shouldRenderMenu && (
        <div
          id={menuId}
          role="menu"
          aria-label={accessibleLabel}
          class={menuClasses}
          hidden={keepMounted && !isOpen ? true : undefined}
        >
          {items.map((item, index) => {
            const itemClass = [
              'ui-menu__item',
              item.variant === 'danger' ? 'ui-menu__item--danger' : '',
              item.active ? 'active' : '',
              item.className || '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={item.id}
                ref={el => {
                  itemRefs.current[index] = el;
                }}
                id={item.domId}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                aria-current={item.ariaCurrent}
                class={itemClass}
                onClick={() => {
                  if (item.disabled) return;
                  setOpenState(false, restoreFocusOnSelect);
                  item.onSelect?.();
                }}
                onKeyDown={event => handleItemKeyDown(index, event)}
                {...(item.dataAttrs || {})}
              >
                {item.icon && <Icon name={item.icon} size={15} class="shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
          {hint && <p class="ui-menu__hint">{hint}</p>}
        </div>
      )}
    </div>
  );
}
