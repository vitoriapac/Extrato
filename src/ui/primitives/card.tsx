import type { ComponentChildren, JSX } from 'preact';
import { formatDateBR } from '../../core/format-date.js';

export type CardProps = JSX.IntrinsicElements['div'] & {
  variant?: 'default' | 'insight' | 'attention' | 'primary' | 'muted';
  children?: ComponentChildren;
  className?: string;
  as?: 'article' | 'section' | 'div';
};

export function Card({
  variant = 'default',
  children,
  className = '',
  as = 'article',
  ...rest
}: CardProps) {
  const variantClasses: Record<string, string> = {
    default: 'card--default bg-surface-card border-border-default text-primary',
    insight: 'card--insight bg-surface-card border-border-emphasis text-primary',
    attention: 'card--attention bg-surface-highlight border-amber text-primary',
    primary: 'card--primary bg-navy text-on-navy border-navy',
    muted: 'card--muted bg-surface-subtle border-border-default text-secondary',
  };

  const baseClass = 'card border rounded p-4 relative overflow-hidden transition-all';
  const combinedClass = [baseClass, variantClasses[variant] || variantClasses.default, className]
    .filter(Boolean)
    .join(' ');

  if (as === 'section') {
    return (
      <section class={combinedClass} {...(rest as any)}>
        {children}
      </section>
    );
  }
  if (as === 'div') {
    return (
      <div class={combinedClass} {...rest}>
        {children}
      </div>
    );
  }
  return (
    <article class={combinedClass} {...(rest as any)}>
      {children}
    </article>
  );
}

export interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  level?: 2 | 3 | 4 | 5 | 6;
  compact?: boolean;
  className?: string;
  period?: string;
}

export function SectionHeader({
  title,
  description = '',
  eyebrow = '',
  level = 3,
  compact = false,
  className = '',
  period = '',
}: SectionHeaderProps) {
  const HeadingTag = `h${Math.max(2, Math.min(6, level))}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  const formattedPeriod = period
    ? `Período: ${String(period).split(' a ').map(formatDateBR).join(' a ')}`
    : '';

  return (
    <header
      class={`module-heading${compact ? ' module-heading--compact' : ''}${className ? ` ${className}` : ''}`}
    >
      {eyebrow && <span class="module-heading__eyebrow">{eyebrow}</span>}
      <HeadingTag class="module-heading__title">{title}</HeadingTag>
      {description && <p class="module-heading__description">{description}</p>}
      {formattedPeriod && <p class="chart-frame__period">{formattedPeriod}</p>}
    </header>
  );
}
