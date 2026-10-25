import type { ComponentChildren, JSX } from 'preact';

export type ButtonProps = JSX.IntrinsicElements['button'] & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  size?: 'default' | 'small' | 'touch';
  children?: ComponentChildren;
  className?: string;
};

export function Button({
  variant = 'secondary',
  size = 'default',
  children,
  className = '',
  type = 'button',
  disabled = false,
  ...rest
}: ButtonProps) {
  const variantClasses: Record<string, string> = {
    primary: 'btn-primary bg-navy text-on-navy hover:brightness-110 active:brightness-95',
    secondary:
      'btn-secondary bg-surface-card text-primary border border-border-default hover:bg-surface-subtle',
    ghost: 'btn-ghost bg-transparent text-secondary hover:text-primary hover:bg-surface-subtle',
    danger: 'btn-danger bg-red text-white hover:brightness-110',
    icon: 'btn-icon p-1 bg-transparent text-secondary hover:text-primary',
  };

  const sizeClasses: Record<string, string> = {
    default: 'min-h-[36px] px-3 py-1.5 text-sm',
    small: 'btn-small min-h-[28px] px-2 py-1 text-xs',
    touch: 'min-h-[44px] min-w-[44px] px-4 py-2 text-base',
  };

  const baseClass =
    'btn inline-flex items-center justify-center font-medium font-body rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold';

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
      {children}
    </button>
  );
}
