import type { JSX } from 'preact';
import { Icon, type IconName } from './icon.js';

export type MetricCardProps = JSX.IntrinsicElements['article'] & {
  label: string;
  value: string | number;
  detail?: string;
  icon?: IconName;
  className?: string;
};

export function MetricCard({
  label,
  value,
  detail = '',
  icon,
  className = '',
  ...rest
}: MetricCardProps) {
  return (
    <article class={`performance-kpi ui-metric${className ? ` ${className}` : ''}`} {...rest}>
      <span class={icon ? 'inline-flex items-center gap-1' : undefined}>
        {icon && <Icon name={icon} size={14} class="shrink-0" />}
        {label}
      </span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}
