import type { ComponentChildren, JSX } from 'preact';
import { Icon, type IconName } from './icon.js';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'insufficient';

export type BadgeProps = JSX.IntrinsicElements['span'] & {
  variant?: BadgeVariant;
  /** Overrides the variant icon; `false` removes it. */
  icon?: IconName | false;
  children?: ComponentChildren;
  className?: string;
};

// Each state carries a shape as well as a color, so color is never the only signal.
export const BADGE_VARIANT_ICONS: Record<BadgeVariant, IconName | null> = {
  default: null,
  success: 'circle-check',
  warning: 'alert-triangle',
  danger: 'alert-circle',
  info: 'info-circle',
  insufficient: 'circle-dashed',
};

export function Badge({
  variant = 'default',
  icon,
  children,
  className = '',
  ...rest
}: BadgeProps) {
  const variantClasses: Record<string, string> = {
    default: 'status-pill--default bg-surface-subtle text-secondary',
    success: 'status-pill--success bg-green-bg text-green',
    warning: 'status-pill--warning bg-amber-bg text-amber',
    danger: 'status-pill--danger bg-red-bg text-red',
    info: 'status-pill--info bg-info-bg text-brand-secondary',
    insufficient: 'status-pill--insufficient bg-surface-subtle text-muted',
  };

  const baseClass =
    'status-pill badge inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-body font-medium';

  const combinedClass = [baseClass, variantClasses[variant] || variantClasses.default, className]
    .filter(Boolean)
    .join(' ');

  const iconName = icon === false ? null : icon || BADGE_VARIANT_ICONS[variant] || null;

  return (
    <span class={combinedClass} {...rest}>
      {iconName && <Icon name={iconName} size={14} class="shrink-0" />}
      {children}
    </span>
  );
}

export const StatusPill = Badge;
