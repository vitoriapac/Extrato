import type { ComponentChildren, JSX } from 'preact';
import { Icon, type IconName } from './icon.js';

export type EmptyStateProps = JSX.IntrinsicElements['div'] & {
  title: string;
  message?: string;
  icon?: IconName;
  action?: ComponentChildren;
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  title,
  message = '',
  icon,
  action,
  compact = true,
  className = '',
  ...rest
}: EmptyStateProps) {
  return (
    <div
      class={`empty-state empty-state--compact${className ? ` ${className}` : ''}`}
      role="status"
      {...rest}
    >
      {icon && <Icon name={icon} size={32} stroke={1.5} class="empty-state__icon text-muted" />}
      <strong>{title}</strong>
      {message && <p>{message}</p>}
      {action && <div class="mt-3">{action}</div>}
    </div>
  );
}
