import type { ComponentChildren, JSX } from 'preact';

export type BadgeProps = JSX.IntrinsicElements['span'] & {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'insufficient';
  children?: ComponentChildren;
  className?: string;
};

export function Badge({ variant = 'default', children, className = '', ...rest }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    default: 'status-pill--default bg-surface-subtle text-secondary',
    success: 'status-pill--success bg-green-bg text-green',
    warning: 'status-pill--warning bg-amber-bg text-amber',
    danger: 'status-pill--danger bg-red-bg text-red',
    info: 'status-pill--info bg-info-bg text-blue',
    insufficient: 'status-pill--insufficient bg-surface-subtle text-muted',
  };

  const baseClass =
    'status-pill badge inline-flex items-center px-2 py-0.5 rounded text-xs font-data font-medium tracking-wide';

  const combinedClass = [baseClass, variantClasses[variant] || variantClasses.default, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span class={combinedClass} {...rest}>
      {children}
    </span>
  );
}

export const StatusPill = Badge;
