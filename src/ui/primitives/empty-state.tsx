import type { ComponentChildren, JSX } from 'preact';

export type EmptyStateProps = JSX.IntrinsicElements['div'] & {
  title: string;
  message?: string;
  action?: ComponentChildren;
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  title,
  message = '',
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
      <strong>{title}</strong>
      {message && <p>{message}</p>}
      {action && <div class="mt-3">{action}</div>}
    </div>
  );
}
