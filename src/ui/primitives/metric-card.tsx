import type { JSX } from 'preact';

export type MetricCardProps = JSX.IntrinsicElements['article'] & {
  label: string;
  value: string | number;
  detail?: string;
  className?: string;
};

export function MetricCard({
  label,
  value,
  detail = '',
  className = '',
  ...rest
}: MetricCardProps) {
  return (
    <article class={`performance-kpi ui-metric${className ? ` ${className}` : ''}`} {...rest}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}
