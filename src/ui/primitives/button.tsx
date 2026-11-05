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
  type = 'button',
  disabled = false,
  ...rest
}: ButtonProps) {
  const variantClasses: Record<string, string> = {
    primary: 'btn-primary bg-brand text-on-brand hover:brightness-110 active:brightness-95',
    secondary:
      'btn-secondary ghost bg-surface-card text-text border border-border-default hover:bg-surface-subtle',
    tonal: 'btn-tonal tonal',
    tertiary: 'btn-tertiary tertiary',
    ghost: 'btn-ghost ghost border-transparent bg-transparent text-secondary hover:text-text hover:bg-surface-subtle',
    danger: 'btn-danger danger bg-red text-white hover:brightness-110',
    icon: 'btn-icon ghost border-transparent p-1 bg-transparent text-secondary hover:text-text',
  };

  const sizeClasses: Record<string, string> = {
    default: 'min-h-[36px] px-3 py-1.5 text-sm',
    small: 'btn-small min-h-[28px] px-2 py-1 text-xs',
    touch: 'min-h-[44px] min-w-[44px] px-4 py-2 text-base',
  };

  const baseClass =
    'btn inline-flex items-center justify-center gap-1.5 font-medium font-body rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

  const combinedClass = [
    baseClass,
    variantClasses[variant] || variantClasses.secondary,
    sizeClasses[size] || sizeClasses.default,
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
