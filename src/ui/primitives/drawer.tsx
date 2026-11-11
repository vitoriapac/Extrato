import {
  createContext,
  isValidElement,
  toChildArray,
  type ComponentChildren,
  type JSX,
  type VNode,
} from 'preact';
import { useContext, useEffect, useId, useRef, useState } from 'preact/hooks';
import { Button } from './button.js';
import { isBackdropClick } from './dialog.js';
import { Icon } from './icon.js';

export type DrawerSide = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(',');

function getDrawerFocusableElements(container: HTMLElement): HTMLElement[] {
  const hasLayout =
    typeof container.getClientRects === 'function' && container.getClientRects().length > 0;
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(el => {
    if (el.hidden) return false;
    if (el.closest?.('[hidden], [inert], [aria-hidden="true"]')) return false;
    if (el.style?.display === 'none') return false;
    if (hasLayout && typeof el.getClientRects === 'function' && el.getClientRects().length === 0) {
      return false;
    }
    return true;
  });
}

const activeDrawerStack: symbol[] = [];

interface DrawerContextValue {
  open: boolean;
  close: () => void;
  modal: boolean;
  titleId: string;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export type DrawerProps = Omit<JSX.IntrinsicElements['dialog'], 'title'> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  side?: DrawerSide;
  size?: DrawerSize;
  modal?: boolean;
  label?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  restoreFocusOnClose?: boolean;
  className?: string;
  children?: ComponentChildren;
};

export function Drawer({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onClose,
  side = 'right',
  size = 'md',
  modal = true,
  label = 'Painel lateral',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  restoreFocusOnClose = true,
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  onCancel,
  onClick,
  onKeyDown,
  children,
  ...rest
}: DrawerProps) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const stackTokenRef = useRef<symbol>(Symbol('drawer'));
  const [stackDepth, setStackDepth] = useState(0);

  const requestClose = () => {
    if (controlledOpen === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) {
      const idx = activeDrawerStack.indexOf(stackTokenRef.current);
      if (idx >= 0) activeDrawerStack.splice(idx, 1);
      setStackDepth(0);
      return undefined;
    }
    if (!activeDrawerStack.includes(stackTokenRef.current)) {
      activeDrawerStack.push(stackTokenRef.current);
    }
    setStackDepth(activeDrawerStack.length - 1);
    return () => {
      const idx = activeDrawerStack.indexOf(stackTokenRef.current);
      if (idx >= 0) activeDrawerStack.splice(idx, 1);
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof document === 'undefined') return;

    if (isOpen) {
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
        if (modal && typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else if (!modal && typeof dialog.show === 'function') {
          dialog.show();
        } else {
          dialog.setAttribute('open', '');
        }
      }
      queueMicrotask(() => {
        const autofocusEl = dialog.querySelector<HTMLElement>('[data-autofocus]');
        if (autofocusEl && typeof autofocusEl.focus === 'function') {
          autofocusEl.focus();
          return;
        }
        const focusables = getDrawerFocusableElements(dialog);
        if (focusables.length > 0 && !dialog.contains(document.activeElement)) {
          focusables[0].focus();
        }
      });
    } else if (wasOpenRef.current || dialog.open || dialog.hasAttribute?.('open')) {
      wasOpenRef.current = false;
      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      } else if (dialog.hasAttribute?.('open')) {
        dialog.removeAttribute('open');
      }
      const target = previousFocusRef.current;
      previousFocusRef.current = null;
      const active = document.activeElement;
      if (
        restoreFocusOnClose &&
        target &&
        typeof target.focus === 'function' &&
        (!active || active === document.body || dialog.contains(active))
      ) {
        if (target.isConnected) target.focus();
        queueMicrotask(() => {
          const currentActive = document.activeElement;
          if (
            target.isConnected &&
            (!currentActive || currentActive === document.body || currentActive === dialog)
          ) {
            target.focus();
          }
        });
      }
    }
  }, [isOpen, modal, restoreFocusOnClose]);

  useEffect(() => {
    if (!isOpen || modal || !closeOnEscape || typeof document === 'undefined') return undefined;
    const handleGlobalEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const topToken = activeDrawerStack[activeDrawerStack.length - 1];
      if (topToken && topToken !== stackTokenRef.current) return;
      event.preventDefault();
      requestClose();
    };
    document.addEventListener('keydown', handleGlobalEscape);
    return () => {
      document.removeEventListener('keydown', handleGlobalEscape);
    };
  }, [isOpen, modal, closeOnEscape]);

  const sizeClass = `ui-drawer--${size}`;
  const drawerClass = ['ui-drawer', sizeClass, !modal ? 'ui-drawer--non-modal' : '', className]
    .filter(Boolean)
    .join(' ');
  const ssrOpenAttr = typeof document === 'undefined' && isOpen ? true : undefined;

  const handleCancel: NonNullable<JSX.IntrinsicElements['dialog']['onCancel']> = event => {
    event.preventDefault();
    event.stopPropagation();
    onCancel?.(event);
    if (!closeOnEscape) return;
    const topToken = activeDrawerStack[activeDrawerStack.length - 1];
    if (topToken && topToken !== stackTokenRef.current) return;
    requestClose();
  };

  const handleClick: NonNullable<JSX.IntrinsicElements['dialog']['onClick']> = event => {
    onClick?.(event);
    if (modal && closeOnBackdropClick && !event.defaultPrevented && isBackdropClick(event)) {
      requestClose();
    }
  };

  const handleKeyDown: NonNullable<JSX.IntrinsicElements['dialog']['onKeyDown']> = event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !isOpen || !modal || event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog || typeof document === 'undefined') return;
    const focusables = getDrawerFocusableElements(dialog);
    if (!focusables.length) {
      event.preventDefault();
      dialog.focus?.();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const inside = Boolean(active && dialog.contains(active));
    if (event.shiftKey) {
      if (!inside || active === dialog || active === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (!inside || active === dialog || active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const hasHeaderChild = toChildArray(children).some(
    child => isValidElement(child) && (child as VNode).type === DrawerHeader
  );
  const resolvedAriaLabelledBy =
    ariaLabelledBy ?? (!ariaLabel && hasHeaderChild ? titleId : undefined);
  const resolvedAriaLabel = ariaLabel ?? (!resolvedAriaLabelledBy ? label : undefined);

  const ctxValue: DrawerContextValue = {
    open: isOpen,
    close: requestClose,
    modal,
    titleId,
  };

  return (
    <DrawerContext.Provider value={ctxValue}>
      <dialog
        ref={dialogRef}
        open={ssrOpenAttr}
        data-side={side}
        data-modal={modal ? 'true' : 'false'}
        data-stack-depth={stackDepth > 0 ? String(stackDepth) : undefined}
        aria-modal={modal ? 'true' : 'false'}
        aria-label={resolvedAriaLabel}
        aria-labelledby={resolvedAriaLabelledBy}
        class={drawerClass}
        onCancel={handleCancel}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <div class="ui-drawer__surface">{children}</div>
      </dialog>
    </DrawerContext.Provider>
  );
}

export interface DrawerHeaderProps {
  title: string;
  description?: string;
  badge?: ComponentChildren;
  startContent?: ComponentChildren;
  endContent?: ComponentChildren;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  closeButtonAriaLabel?: string;
  className?: string;
}

export function DrawerHeader({
  title,
  description = '',
  badge,
  startContent,
  endContent,
  onOpenChange,
  onClose,
  showCloseButton,
  closeButtonAriaLabel = 'Fechar painel',
  className = '',
}: DrawerHeaderProps) {
  const ctx = useContext(DrawerContext);
  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
    if (!onOpenChange && !onClose) {
      ctx?.close();
    }
  };

  const hasCloseHandler = Boolean(onOpenChange || onClose || ctx);
  const shouldRenderClose =
    showCloseButton !== undefined ? showCloseButton : hasCloseHandler || (ctx ? !ctx.modal : false);

  return (
    <header class={['ui-drawer__header', className].filter(Boolean).join(' ')}>
      <div class="ui-drawer__header-main">
        {startContent && <div class="ui-drawer__header-start">{startContent}</div>}
        <div class="ui-drawer__header-titles">
          <div class="ui-drawer__title-row">
            <h3 id={ctx?.titleId} class="ui-drawer__title">
              {title}
            </h3>
            {badge}
          </div>
          {description && <p class="ui-drawer__description">{description}</p>}
        </div>
      </div>
      {(endContent || shouldRenderClose) && (
        <div class="ui-drawer__header-actions">
          {endContent}
          {shouldRenderClose && (
            <Button
              variant="ghost"
              size="small"
              aria-label={closeButtonAriaLabel}
              onClick={handleClose}
              className="ui-drawer__close"
            >
              <Icon name="x" size={16} />
            </Button>
          )}
        </div>
      )}
    </header>
  );
}

export interface DrawerBodyProps {
  className?: string;
  children?: ComponentChildren;
}

export function DrawerBody({ className = '', children }: DrawerBodyProps) {
  return <div class={['ui-drawer__body', className].filter(Boolean).join(' ')}>{children}</div>;
}

export interface DrawerFooterProps {
  className?: string;
  children?: ComponentChildren;
}

export function DrawerFooter({ className = '', children }: DrawerFooterProps) {
  return (
    <footer class={['ui-drawer__footer', className].filter(Boolean).join(' ')}>{children}</footer>
  );
}
