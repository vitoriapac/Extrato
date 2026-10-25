import type { JSX } from 'preact';

export type ProgressBarProps = JSX.IntrinsicElements['div'] & {
  value: number;
  max?: number;
  label?: string;
  showValueText?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
};

export function ProgressBar({
  value,
  max = 100,
  label = '',
  showValueText = false,
  variant = 'default',
  className = '',
  ...rest
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clampedValue = Math.max(0, Math.min(value, safeMax));
  const percentage = Math.round((clampedValue / safeMax) * 100);

  const fillColors: Record<string, string> = {
    default: 'bg-navy',
    success: 'bg-green',
    warning: 'bg-amber',
    danger: 'bg-red',
  };

  const fillColor = fillColors[variant] || fillColors.default;

  return (
    <div
      class={`ui-progress flex flex-col gap-1 w-full${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {(label || showValueText) && (
        <div class="flex justify-between items-center text-xs font-data text-secondary">
          {label && <span class="ui-progress__label">{label}</span>}
          {showValueText && <span class="ui-progress__value font-medium">{percentage}%</span>}
        </div>
      )}
      <div
        class="bar-track w-full h-2 bg-surface-subtle border border-border-default rounded overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label || 'Progresso'}
      >
        <div
          class={`bar-fill h-full transition-all duration-300 ease-out ${fillColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
