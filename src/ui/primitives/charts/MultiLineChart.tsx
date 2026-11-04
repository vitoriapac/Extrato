import type { JSX } from 'preact';
import { multiLineGeometry, MultiLineSeriesInput } from './geometry.js';
import { formatDecimal } from '../../../core/format-number.js';

export interface MultiLineChartProps {
  series: MultiLineSeriesInput[];
  periodLabels: string[];
  width?: number;
  height?: number;
  label?: string;
  className?: string;
}

export function MultiLineChart({
  series,
  periodLabels,
  width = 620,
  height = 240,
  label = 'Evolução da taxa de acerto por disciplina',
  className = '',
}: MultiLineChartProps): JSX.Element {
  const geom = multiLineGeometry(series, periodLabels.length, { width, height });
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div class={`chart-multiline-wrap ${className}`}>
      <svg
        class="chart-multiline"
        viewBox={`0 0 ${geom.width} ${geom.height}`}
        role="img"
        aria-label={label}
      >
        {/* Linhas de grade percentuais */}
        {yTicks.map(val => {
          const y = geom.yFor(val);
          return (
            <g key={`grid-y-${val}`}>
              <line
                class="chart-multiline__grid"
                x1={geom.padLeft}
                y1={y}
                x2={geom.width - geom.padRight}
                y2={y}
              />
              <text
                x={geom.padLeft - 6}
                y={y + 3}
                class="chart-multiline__label"
                text-anchor="end"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Linhas de cada disciplina */}
        {geom.series.map(s => (
          <g key={`series-${s.id}`}>
            {s.runs.map((d, rIdx) => (
              <path
                key={`run-${s.id}-${rIdx}`}
                class={`chart-multiline__line subject-stroke-${s.colorSlot}`}
                d={d}
              />
            ))}
            {s.dots.map((dot, dIdx) => (
              <circle
                key={`dot-${s.id}-${dIdx}`}
                class={`chart-multiline__point subject-stroke-${s.colorSlot}`}
                cx={dot.x}
                cy={dot.y}
                r={3.5}
              >
                <title>{`${s.name} (${periodLabels[dot.periodIndex]}): ${formatDecimal(dot.accuracy)}%`}</title>
              </circle>
            ))}
          </g>
        ))}

        {/* Rótulos do eixo X (períodos) */}
        {periodLabels.map((lbl, idx) => {
          const x = geom.xFor(idx);
          return (
            <text
              key={`x-lbl-${idx}`}
              x={x}
              y={geom.height - 8}
              class="chart-multiline__label"
              text-anchor="middle"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
