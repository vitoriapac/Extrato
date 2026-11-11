import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import { Button } from './button.js';
import { Icon } from './icon.js';

export type DialogMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export type DialogProps = Omit<JSX.IntrinsicElements['dialog'], 'title'> & {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleId?: string;
  description?: string;
  descriptionId?: string;
  footer?: ComponentChildren;
  showHeader?: boolean;
  showCloseButton?: boolean;
  closeButtonId?: string;
  closeButtonAriaLabel?: string;
  maxWidth?: DialogMaxWidth;
  closeOnBackdropClick?: boolean;
  restoreFocusOnClose?: boolean;
  unstyled?: boolean;
  innerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  className?: string;
  children?: ComponentChildren;
};

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(',');

function getDialogFocusableElements(container: HTMLElement): HTMLElement[] {
  const hasLayout = typeof container.getClientRects === 'function' && container.getClientRects().length > 0;
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

export function isBackdropClick(event: MouseEvent): boolean {
  const target = event.target;
  const currentTarget = event.currentTarget as HTMLElement | null;
  if (!target || !currentTarget || target !== currentTarget) return false;
  if (!event.clientX && !event.clientY) return true;
  if (typeof currentTarget.getBoundingClientRect !== 'function') return false;
  const rect = currentTarget.getBoundingClientRect();
  if (!rect.width && !rect.height) return true;
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

export function syncDialogOpen(
  doc: Document | null | undefined,
  id: string,
  isOpen: boolean
): void {
  const dialog = doc?.getElementById(id) as HTMLDialogElement | null | undefined;
  if (!dialog) return;
  if (isOpen) {
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    }
    return;
  }
  const hasOpenAttr = typeof dialog.hasAttribute === 'function' && dialog.hasAttribute('open');
  if (dialog.open || hasOpenAttr) {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }
}

export function Dialog({
  open,
  onClose,
  title = '',
  titleId: customTitleId,
  description = '',
  descriptionId: customDescId,
  footer,
  showHeader = true,
  showCloseButton = true,
  closeButtonId,
  closeButtonAriaLabel = 'Fechar',
  maxWidth = 'md',
  closeOnBackdropClick = true,
  restoreFocusOnClose = true,
  unstyled = false,
  innerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  className = '',
  class: classProp = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  onCancel,
  onClick,
  onKeyDown,
  children,
  ...rest
}: DialogProps) {
  const generatedId = useId();
  const resolvedTitleId = customTitleId || `${generatedId}-title`;
  const resolvedDescId = customDescId || `${generatedId}-desc`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof document === 'undefined') return;

    if (open) {
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
      const targetToFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      const active = document.activeElement;
      const shouldRestore =
        restoreFocusOnClose &&
        (!active || active === document.body || dialog.contains(active));
      if (shouldRestore && targetToFocus && typeof targetToFocus.focus === 'function') {
        if (targetToFocus.isConnected) {
          targetToFocus.focus();
        }
        queueMicrotask(() => {
          const currentActive = document.activeElement;
          if (
            targetToFocus.isConnected &&
            (!currentActive || currentActive === document.body || currentActive === dialog)
          ) {
            targetToFocus.focus();
          }
        });
      }
    }
  }, [open, restoreFocusOnClose]);

  const sizeClass: Record<DialogMaxWidth, string> = {
    sm: 'ui-dialog--sm',
    md: 'ui-dialog--md',
    lg: 'ui-dialog--lg',
    xl: 'ui-dialog--xl',
    '2xl': 'ui-dialog--2xl',
    '3xl': 'ui-dialog--3xl',
    '4xl': 'ui-dialog--4xl',
  };

  const dialogClass = unstyled
    ? ['ui-dialog', 'ui-dialog--bare', classProp, className].filter(Boolean).join(' ')
    : ['ui-dialog', sizeClass[maxWidth] || sizeClass.md, classProp, className]
        .filter(Boolean)
        .join(' ');

  const ssrOpenAttr = typeof document === 'undefined' && open ? true : undefined;
  const resolvedAriaLabelledBy =
    ariaLabelledBy ??
    (!ariaLabel && (customTitleId || (showHeader && title)) ? resolvedTitleId : undefined);
  const resolvedAriaDescribedBy =
    ariaDescribedBy ?? (description ? resolvedDescId : undefined);

  const handleCancel: NonNullable<JSX.IntrinsicElements['dialog']['onCancel']> = event => {
    event.preventDefault();
    onCancel?.(event);
    onClose();
  };

  const handleClick: NonNullable<JSX.IntrinsicElements['dialog']['onClick']> = event => {
    onClick?.(event);
    if (closeOnBackdropClick && !event.defaultPrevented && isBackdropClick(event)) {
      onClose();
    }
  };

  const handleKeyDown: NonNullable<JSX.IntrinsicElements['dialog']['onKeyDown']> = event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !open || event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog || typeof document === 'undefined') return;
    const focusables = getDialogFocusableElements(dialog);
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

  return (
    <dialog
      ref={dialogRef}
      open={ssrOpenAttr}
      aria-label={ariaLabel}
      aria-labelledby={resolvedAriaLabelledBy}
      aria-describedby={resolvedAriaDescribedBy}
      class={dialogClass}
      onCancel={handleCancel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {unstyled ? (
        children
      ) : (
        <div class={['ui-dialog__inner', innerClassName].filter(Boolean).join(' ')}>
          {showHeader && (
            <header class="ui-dialog__header">
              <div class="min-w-0">
                {title && (
                  <h3 id={resolvedTitleId} class="ui-dialog__title">
                    {title}
                  </h3>
                )}
                {description && (
                  <p id={resolvedDescId} class="ui-dialog__description">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  id={closeButtonId}
                  variant="ghost"
                  size="small"
                  onClick={onClose}
                  aria-label={closeButtonAriaLabel}
                  className="ui-dialog__close"
                >
                  <Icon name="x" size={16} />
                </Button>
              )}
            </header>
          )}
          <div class={['ui-dialog__body', bodyClassName].filter(Boolean).join(' ')}>
            {children}
          </div>
          {footer && (
            <footer class={['ui-dialog__footer', footerClassName].filter(Boolean).join(' ')}>
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
