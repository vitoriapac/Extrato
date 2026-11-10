import type { ComponentChildren } from 'preact';
import { Button } from './button.js';
import { Icon, type IconName } from './icon.js';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export const TOAST_VARIANT_ICONS: Record<ToastVariant, IconName> = {
  info: 'info-circle',
  success: 'circle-check',
  warning: 'alert-triangle',
  danger: 'alert-circle',
};

export interface ToastProps {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

export function Toast({
  id,
  title,
  description = '',
  variant = 'info',
  actionLabel,
  onAction,
  onDismiss,
  dismissLabel = 'Dispensar notificação',
  className = '',
}: ToastProps) {
  const isAssertive = variant === 'danger' || variant === 'warning';
  const rootClass = ['ui-toast', `ui-toast--${variant}`, className].filter(Boolean).join(' ');
  const iconName = TOAST_VARIANT_ICONS[variant] || TOAST_VARIANT_ICONS.info;

  return (
    <div
      id={id}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      class={rootClass}
    >
      <Icon name={iconName} size={18} class="ui-toast__icon" />
      <div class="ui-toast__content">
        <strong class="ui-toast__title">{title}</strong>
        {description && <p class="ui-toast__description">{description}</p>}
      </div>
      {(actionLabel || onDismiss) && (
        <div class="ui-toast__actions">
          {actionLabel && onAction && (
            <Button variant="tertiary" size="small" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {onDismiss && (
            <button
              type="button"
              class="ui-toast__dismiss"
              aria-label={dismissLabel}
              onClick={onDismiss}
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export interface ToastViewportProps {
  children?: ComponentChildren;
  label?: string;
  className?: string;
}

export function ToastViewport({
  children,
  label = 'Notificações do sistema',
  className = '',
}: ToastViewportProps) {
  const viewportClass = ['ui-toast-viewport', className].filter(Boolean).join(' ');
  return (
    <section role="region" aria-label={label} class={viewportClass}>
      {children}
    </section>
  );
}
