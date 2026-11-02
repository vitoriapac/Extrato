import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { bulletGeometry, isFiniteNumber, ringGeometry, sparklinePaths, stackedSegments } from './geometry.js';

// Colors come from tokens through CSS (`.chart-*` rules in app.css); the markup only names a tone.
const formatNumber = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export interface RingGaugeProps {
  value: number | null | undefined;
  max?: number;
  /** Below this value the ring takes the attention tone. */
  target?: number;
  label: string;
  size?: number;
  stroke?: number;
  showValue?: boolean;
  className?: string;
}

export function RingGauge({
  value,
  max = 100,
  target,
  label,
  size = 64,
  stroke = 6,
  showValue = true,
  className = '',
}: RingGaugeProps) {
  const r = 32 - stroke / 2;
  const geometry = ringGeometry(value, max, r);
  const below = geometry && isFiniteNumber(target) ? (value as number) < target : false;
  const description = geometry
    ? `${label}: ${formatNumber(value as number)} de ${formatNumber(max)}${isFiniteNumber(target) ? (below ? `, abaixo da meta de ${target}` : `, na meta de ${target} ou acima`) : ''}`
    : `${label}: sem dados suficientes`;
  const tone = !geometry ? 'empty' : below ? 'attention' : 'ok';
  return (
    <svg
      class={`chart-ring chart-ring--${tone}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={description}
    >
      <circle class="chart-ring__track" cx="32" cy="32" r={r} fill="none" stroke-width={stroke} />
      {geometry && geometry.ratio > 0 && (
        <circle
          class="chart-ring__value"
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke-width={stroke}
          stroke-linecap="round"
          stroke-dasharray={geometry.circumference.toFixed(2)}
          stroke-dashoffset={geometry.offset.toFixed(2)}
          transform="rotate(-90 32 32)"
        />
      )}
      {showValue && (
        <text class="chart-ring__text" x="32" y="32" text-anchor="middle" dominant-baseline="central" aria-hidden="true">
          {geometry ? formatNumber(value as number) : '—'}
        </text>
      )}
    </svg>
  );
}

export interface SparklineProps {
  values: Array<number | null | undefined>;
  label: string;
  unit?: string;
  width?: number;
  height?: number;
  /** Draw the line across missing periods instead of breaking it. */
  connectGaps?: boolean;
  className?: string;
}

const unitSuffix = (unit: string) => (!unit ? '' : unit === '%' ? '%' : ` ${unit}`);

export function Sparkline({
  values,
  label,
  unit = '',
  width = 96,
  height = 28,
  connectGaps = false,
  className = '',
}: SparklineProps) {
  const paths = sparklinePaths(values, width, height, 2, connectGaps);
  const suffix = unitSuffix(unit);
  const description = paths
    ? `${label}: de ${formatNumber(paths.first)}${suffix} a ${formatNumber(paths.last.value)}${suffix}, com dados em ${paths.count} de ${values.length} períodos`
    : `${label}: histórico insuficiente`;
  return (
    <svg
      class={`chart-sparkline${paths ? '' : ' chart-sparkline--empty'}${className ? ` ${className}` : ''}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={description}
    >
      {paths ? (
        <>
          {paths.runs.map(d => (
            <path class="chart-sparkline__line" d={d} fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          ))}
          {paths.dots.map(dot => (
            <circle class="chart-sparkline__point" cx={dot.x} cy={dot.y} r="1.5" />
          ))}
          <circle class="chart-sparkline__dot" cx={paths.last.x} cy={paths.last.y} r="2" />
        </>
      ) : (
        <line class="chart-sparkline__baseline" x1="2" x2={width - 2} y1={height / 2} y2={height / 2} stroke-dasharray="2 3" />
      )}
    </svg>
  );
}

export interface BulletBarProps {
  value: number | null | undefined;
  target?: number;
  max?: number;
  label: string;
  unit?: string;
  className?: string;
}

export function BulletBar({ value, target, max = 100, label, unit = '%', className = '' }: BulletBarProps) {
  const geometry = bulletGeometry(value, target, max);
  const text = geometry ? `${formatNumber(value as number)}${unit}` : 'sem dados';
  const description = geometry
    ? `${label}: ${text}${isFiniteNumber(target) ? `, meta ${formatNumber(target)}${unit}${geometry.below ? ', abaixo da meta' : ''}` : ''}`
    : `${label}: sem dados suficientes`;
  return (
    <div class={`chart-bullet${className ? ` ${className}` : ''}`}>
      <svg class="chart-bullet__svg" viewBox="0 0 100 8" preserveAspectRatio="none" role="img" aria-label={description}>
        <rect class="chart-bullet__track" x="0" y="1" width="100" height="6" rx="1" />
        {geometry && (
          <rect class={`chart-bullet__fill${geometry.below ? ' is-below' : ''}`} x="0" y="1" width={geometry.fill} height="6" rx="1" />
        )}
        {geometry?.target != null && <rect class="chart-bullet__target" x={Math.max(0, geometry.target - 0.5)} y="0" width="1" height="8" />}
      </svg>
      <span class="chart-bullet__value" aria-hidden="true">{text}</span>
    </div>
  );
}

export interface StackedBarPart {
  label: string;
  value: number | null | undefined;
  tone?: 'primary' | 'primary-soft' | 'primary-faint' | 'secondary' | 'target' | 'muted' | 'empty';
}

export interface StackedBarProps {
  parts: StackedBarPart[];
  label: string;
  unit?: string;
  className?: string;
}

export function StackedBar({ parts, label, unit = '', className = '' }: StackedBarProps) {
  const segments = stackedSegments(parts);
  const suffix = unitSuffix(unit);
  const description = segments
    ? `${label}: ${parts.map((part, i) => `${part.label} ${formatNumber(Number(part.value) || 0)}${suffix} (${segments[i].share}%)`).join(', ')}`
    : `${label}: sem dados suficientes`;
  return (
    <div class={`chart-stacked${className ? ` ${className}` : ''}`}>
      <svg class="chart-stacked__svg" viewBox="0 0 100 8" preserveAspectRatio="none" role="img" aria-label={description}>
        <rect class="chart-stacked__track" x="0" y="0" width="100" height="8" rx="1" />
        {segments?.map((segment, i) =>
          segment.width > 0 ? (
            <rect class={`chart-stacked__part chart-stacked__part--${parts[i].tone || 'primary'}`} x={segment.start} y="0" width={segment.width} height="8" />
          ) : null
        )}
      </svg>
      {segments && (
        <ul class="chart-stacked__legend" aria-hidden="true">
          {parts.map((part, i) => (
            <li>
              <span class={`chart-stacked__swatch chart-stacked__part--${part.tone || 'primary'}`} />
              {part.label} {formatNumber(Number(part.value) || 0)}
              {suffix} ({segments[i].share}%)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// String output for the renderers that still build HTML by hand.
export const renderRingGauge = (props: RingGaugeProps) => render(h(RingGauge, props));
export const renderSparkline = (props: SparklineProps) => render(h(Sparkline, props));
export const renderBulletBar = (props: BulletBarProps) => render(h(BulletBar, props));
export const renderStackedBar = (props: StackedBarProps) => render(h(StackedBar, props));
