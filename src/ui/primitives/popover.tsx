import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { Button, type ButtonProps } from './button.js';
import type { IconName } from './icon.js';

export type PopoverPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface PopoverTriggerProps {
  ref: (el: HTMLButtonElement | null) => void;
  onClick: () => void;
  'aria-expanded': 'true' | 'false';
  'aria-controls': string | undefined;
  'aria-haspopup': 'dialog' | 'menu' | 'listbox';
}

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
  trigger?: (props: PopoverTriggerProps) => ComponentChildren;
  triggerLabel?: string;
  triggerIcon?: IconName;
  triggerVariant?: ButtonProps['variant'];
  triggerSize?: ButtonProps['size'];
  ariaLabel?: string;
  ariaHasPopup?: 'dialog' | 'menu' | 'listbox';
  panelRole?: 'dialog' | 'region' | 'menu';
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  children?: ComponentChildren;
  className?: string;
  panelClassName?: string;
}

export function Popover({
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  trigger,
  triggerLabel = 'Abrir opções',
  triggerIcon,
  triggerVariant = 'secondary',
  triggerSize = 'small',
  ariaLabel,
  ariaHasPopup = 'dialog',
  panelRole = 'dialog',
  closeOnOutsideClick = true,
  closeOnEscape = true,
  children,
  className = '',
  panelClassName = '',
}: PopoverProps) {
  const panelId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : internalOpen;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerElRef = useRef<HTMLButtonElement | null>(null);

  const setOpenState = (next: boolean, restoreFocus = false) => {
    if (open === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
    if (!next && restoreFocus) {
      triggerElRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!closeOnOutsideClick) return;
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpenState(false, false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
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
  }, [isOpen, closeOnOutsideClick, closeOnEscape]);

  const triggerProps: PopoverTriggerProps = {
    ref: el => {
      triggerElRef.current = el;
    },
    onClick: () => setOpenState(!isOpen, false),
    'aria-expanded': isOpen ? 'true' : 'false',
    'aria-controls': isOpen ? panelId : undefined,
    'aria-haspopup': ariaHasPopup,
  };

  const rootClass = ['ui-popover', className].filter(Boolean).join(' ');
  const panelClasses = ['ui-popover__panel', `ui-popover__panel--${placement}`, panelClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={rootRef} class={rootClass}>
      {trigger ? (
        trigger(triggerProps)
      ) : (
        <Button
          ref={triggerProps.ref}
          variant={triggerVariant}
          size={triggerSize}
          iconLeft={triggerIcon}
          aria-label={ariaLabel}
          aria-expanded={triggerProps['aria-expanded']}
          aria-controls={triggerProps['aria-controls']}
          aria-haspopup={triggerProps['aria-haspopup']}
          onClick={triggerProps.onClick}
        >
          {triggerLabel}
        </Button>
      )}

      {isOpen && (
        <div
          id={panelId}
          role={panelRole}
          aria-label={ariaLabel || triggerLabel}
          class={panelClasses}
        >
          {children}
        </div>
      )}
    </div>
  );
}
