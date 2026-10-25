import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Button } from './button.js';

export type DialogProps = JSX.IntrinsicElements['dialog'] & {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ComponentChildren;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  className = '',
  maxWidth = 'md',
  ...rest
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [open]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <dialog
      ref={dialogRef}
      class={`p-0 rounded border border-border-default bg-surface-card text-primary shadow-xl backdrop:bg-navy/40 w-full ${maxWidthClasses[maxWidth]}${className ? ` ${className}` : ''}`}
      onCancel={e => {
        e.preventDefault();
        onClose();
      }}
      {...rest}
    >
      <div class="flex flex-col">
        <header class="flex items-center justify-between p-4 border-b border-border-default bg-surface-subtle">
          <h3 class="text-base font-semibold font-display text-primary m-0">{title}</h3>
          <Button
            variant="ghost"
            size="small"
            onClick={onClose}
            aria-label="Fechar"
            class="min-h-0 p-1 text-secondary hover:text-primary"
          >
            ✕
          </Button>
        </header>
        <div class="p-4 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </dialog>
  );
}
