import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import { Button } from './button.js';
import { Icon } from './icon.js';

export type BottomSheetProps = Omit<JSX.IntrinsicElements['dialog'], 'title'> & {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ComponentChildren;
  maxWidth?: 'sm' | 'md' | 'lg';
  closeOnBackdropClick?: boolean;
  className?: string;
  children?: ComponentChildren;
};

export function BottomSheet({
  open,
  onClose,
  title,
  description = '',
  footer,
  maxWidth = 'md',
  closeOnBackdropClick = true,
  className = '',
  children,
  onCancel,
  onClick,
  ...rest
}: BottomSheetProps) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descId = `${generatedId}-desc`;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof document === 'undefined') return;

    if (open) {
      if (document.activeElement && document.activeElement !== document.body) {
        previousFocusRef.current = document.activeElement as HTMLElement;
      }
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      }
    } else if (dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
      previousFocusRef.current = null;
    }
  }, [open]);

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
