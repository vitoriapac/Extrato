import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import { Button } from './button.js';
import { Icon } from './icon.js';

export type BottomSheetProps = Omit<JSX.IntrinsicElements['dialog'], 'title'> & {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  description?: string;
  descriptionId?: string;
  footer?: ComponentChildren;
  maxWidth?: 'sm' | 'md' | 'lg';
  closeOnBackdropClick?: boolean;
  restoreFocusOnClose?: boolean;
  className?: string;
  children?: ComponentChildren;
};

export function BottomSheet({
  open,
  onClose,
  title,
  titleId: customTitleId,
  description = '',
  descriptionId: customDescId,
  footer,
  maxWidth = 'md',
  closeOnBackdropClick = true,
  restoreFocusOnClose = true,
  className = '',
  children,
  onCancel,
  onClick,
  ...rest
}: BottomSheetProps) {
  const generatedId = useId();
  const titleId = customTitleId || `${generatedId}-title`;
  const descId = customDescId || `${generatedId}-desc`;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof document === 'undefined') return;

    if (open) {
      if (
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
    } else if (wasOpenRef.current || dialog.open) {
      wasOpenRef.current = false;
      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      }
      const targetToFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      if (restoreFocusOnClose && targetToFocus && typeof targetToFocus.focus === 'function') {
        if (targetToFocus.isConnected) {
          targetToFocus.focus();
        }
        queueMicrotask(() => {
          if (targetToFocus.isConnected && document.activeElement !== targetToFocus) {
            targetToFocus.focus();
          }
        });
      }
    }
  }, [open, restoreFocusOnClose]);

  const sizeClass =
    maxWidth === 'sm'
      ? 'ui-bottom-sheet--sm'
      : maxWidth === 'lg'
        ? 'ui-bottom-sheet--lg'
        : 'ui-bottom-sheet--md';

  const sheetClass = ['ui-bottom-sheet', sizeClass, className].filter(Boolean).join(' ');
  const ssrOpenAttr = typeof document === 'undefined' && open ? true : undefined;

  return (
    <dialog
      ref={dialogRef}
      open={ssrOpenAttr}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      class={sheetClass}
      onCancel={event => {
        event.preventDefault();
        onCancel?.(event);
        onClose();
      }}
      onClick={event => {
        onClick?.(event);
        if (closeOnBackdropClick && event.target === dialogRef.current) {
          onClose();
        }
      }}
      {...rest}
    >
      <div class="ui-bottom-sheet__inner">
        <div class="ui-bottom-sheet__handle" aria-hidden="true" />
        <header class="ui-bottom-sheet__header">
          <div class="min-w-0">
            <h3 id={titleId} class="ui-bottom-sheet__title">
              {title}
            </h3>
            {description && (
              <p id={descId} class="ui-bottom-sheet__description">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="small"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 p-1.5 text-secondary hover:text-text"
          >
            <Icon name="x" size={16} />
          </Button>
        </header>

        <div class="ui-bottom-sheet__body">{children}</div>

        {footer && <footer class="ui-bottom-sheet__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
