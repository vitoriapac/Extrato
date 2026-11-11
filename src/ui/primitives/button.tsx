import type { ComponentChildren, JSX } from 'preact';
import { Icon, type IconName } from './icon.js';

export type ButtonProps = JSX.IntrinsicElements['button'] & {
  variant?: 'primary' | 'secondary' | 'tonal' | 'tertiary' | 'ghost' | 'danger' | 'icon';
  size?: 'default' | 'small' | 'touch';
  /** Decorative icons beside the label; they replace +, → and ▾ typed into the text. */
  iconLeft?: IconName;
  iconRight?: IconName;
  children?: ComponentChildren;
  className?: string;
};

export function Button({
  variant = 'secondary',
  size = 'default',
  iconLeft,
  iconRight,
  children,
  className = '',
  class: classProp = '',
  type = 'button',
  disabled = false,
  ...rest
}: ButtonProps) {
  const variantClasses: Record<string, string> = {
    primary:
      'btn-primary bg-brand-primary text-primary-contrast hover:bg-action-primary-hover active:brightness-95',
    secondary:
      'btn-secondary ghost bg-transparent text-heading border border-action-outline hover:bg-brand-primary hover:text-primary-contrast',
    tonal:
      'btn-tonal tonal bg-action-tonal-bg text-action-tonal-text border-0 hover:bg-action-tonal-hover',
    tertiary:
      'btn-tertiary tertiary inline-flex items-center gap-1 bg-transparent text-heading border-0 px-1 underline underline-offset-3 hover:decoration-2',
    ghost:
      'btn-ghost ghost border-transparent bg-transparent text-secondary hover:text-text hover:bg-surface-subtle',
    danger:
      'btn-danger danger bg-transparent text-red border border-red hover:bg-red hover:text-danger-contrast',
    icon: 'btn-icon ghost border-transparent p-1 bg-transparent text-secondary hover:text-text hover:bg-surface-subtle',
  };

  const sizeClasses: Record<string, string> = {
    default: 'text-sm',
    small: 'btn-small text-xs',
    touch: 'ui-btn--touch text-base',
  };

  const baseClass =
    'btn ui-btn inline-flex items-center justify-center gap-2 font-medium font-body rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

  const combinedClass = [
    baseClass,
    variantClasses[variant] || variantClasses.secondary,
    sizeClasses[size] || sizeClasses.default,
    classProp,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} class={combinedClass} disabled={disabled} {...rest}>
      {iconLeft && <Icon name={iconLeft} size={14} class="shrink-0" />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} class="shrink-0" />}
    </button>
  );
}
