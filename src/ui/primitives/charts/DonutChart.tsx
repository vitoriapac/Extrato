import type { JSX } from 'preact';
import { donutGeometry } from './geometry.js';
import { formatDecimal } from '../../../core/format-number.js';

export interface DonutChartSliceInput {
  subjectId: string;
  subjectName: string;
  colorSlot: number;
  seconds: number;
  percentage: number;
  ratio: number;
  startRatio: number;
}

export interface DonutChartProps {
  slices: DonutChartSliceInput[];
  totalSeconds: number;
  centerLabel?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function DonutChart({
  slices,
  totalSeconds,
  centerLabel = 'Tempo total',
  size = 200,
  strokeWidth = 20,
  label = 'Distribuição do tempo de estudo por disciplina',
  className = '',
}: DonutChartProps): JSX.Element {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const geom = donutGeometry(slices, r);

  const totalHours = totalSeconds / 3600;
  const formattedHours = `${formatDecimal(totalHours)}h`;

  return (
    <svg
      class={`chart-donut ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label}: total de ${formattedHours}`}
    >
      {/* Círculo de fundo/trilha */}
      <circle
        class="chart-donut__track"
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke-width={strokeWidth}
      />

      {/* Fatias/Arcos na cor de cada disciplina */}
      {slices.map((slice, idx) => {
        const item = geom.items[idx];
        if (!item || item.length <= 0) return null;
        return (
          <circle
            key={`slice-${slice.subjectId}`}
            class={`chart-donut__slice subject-stroke-${slice.colorSlot}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke-width={strokeWidth}
            stroke-dasharray={item.dasharray}
            stroke-dashoffset={item.dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
          >
            <title>{`${slice.subjectName}: ${formatDecimal(slice.seconds / 3600)}h (${formatDecimal(slice.percentage)}%)`}</title>
          </circle>
        );
      })}

      {/* Rótulo central de horas */}
      <g text-anchor="middle" dominant-baseline="central">
        <text class="chart-donut__text-val" x={cx} y={cy - 6}>
          {formattedHours}
        </text>
        <text class="chart-donut__text-sub" x={cx} y={cy + 16}>
          {centerLabel}
        </text>
      </g>
    </svg>
  );
}
