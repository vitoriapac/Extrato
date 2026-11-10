import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { Button, type ButtonProps } from './button.js';
import { Icon, type IconName } from './icon.js';
import type { PopoverPlacement } from './popover.js';
import { getRovingTabIndex } from './tabs.js';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: IconName;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  onSelect?: () => void;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  triggerLabel?: string;
  triggerAriaLabel?: string;
  triggerIcon?: IconName;
  triggerVariant?: ButtonProps['variant'];
  triggerSize?: ButtonProps['size'];
  placement?: PopoverPlacement;
  hint?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  menuClassName?: string;
}

export function DropdownMenu({
  items,
  triggerLabel = 'Mais ações',
  triggerAriaLabel,
  triggerIcon = 'dots',
  triggerVariant = 'ghost',
  triggerSize = 'small',
  placement = 'bottom-end',
  hint,
  open,
  defaultOpen = false,
  onOpenChange,
  className = '',
  menuClassName = '',
}: DropdownMenuProps) {
  const menuId = useId();
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
        itemRefs.current[firstEnabled]?.focus();
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
        setOpenState(false, true);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, items]);

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

  const accessibleLabel = triggerAriaLabel || triggerLabel || 'Menu de ações';
  const rootClass = ['ui-popover', className].filter(Boolean).join(' ');
  const menuClasses = ['ui-menu__panel', `ui-popover__panel--${placement}`, menuClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={rootRef} class={rootClass}>
      <Button
        ref={el => {
          triggerRef.current = el;
        }}
        variant={triggerVariant}
        size={triggerSize}
        iconLeft={triggerIcon}
        aria-label={triggerAriaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setOpenState(!isOpen, false, !isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        {triggerLabel || undefined}
      </Button>

      {isOpen && (
        <div id={menuId} role="menu" aria-label={accessibleLabel} class={menuClasses}>
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={el => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              class={
                item.variant === 'danger' ? 'ui-menu__item ui-menu__item--danger' : 'ui-menu__item'
              }
              onClick={() => {
                if (item.disabled) return;
                setOpenState(false, true);
                item.onSelect?.();
              }}
              onKeyDown={event => handleItemKeyDown(index, event)}
            >
              {item.icon && <Icon name={item.icon} size={15} class="shrink-0" />}
              <span>{item.label}</span>
            </button>
          ))}
          {hint && <p class="ui-menu__hint">{hint}</p>}
        </div>
      )}
    </div>
  );
}
