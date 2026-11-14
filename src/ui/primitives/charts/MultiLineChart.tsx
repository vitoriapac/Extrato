import type { JSX } from 'preact';
import { multiLineGeometry, MultiLineSeriesInput } from './geometry.js';
import { formatDecimal } from '../../../core/format-number.js';
import { chartSize } from './chart-size.js';

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
  width = chartSize(620, 240).width,
  height = chartSize(620, 240).height,
  label = 'Evolução da taxa de acerto por disciplina',
  className = '',
}: MultiLineChartProps): JSX.Element {
  const geom = multiLineGeometry(series, periodLabels.length, { width, height });
  const yTicks = [0, 25, 50, 75, 100];
  // A paleta tem 8 cores para até 17 disciplinas: quem repete uma cor ganha traço tracejado, para não depender só da cor.
  const slotUses = new Map<number, number>();
  const dashFor = (slot: number) => {
    const uses = slotUses.get(slot) ?? 0;
    slotUses.set(slot, uses + 1);
    return uses === 0 ? undefined : uses === 1 ? '7 4' : '2 4';
  };

  return (
    <div
      class={`chart-multiline-wrap ${className}`}
      tabIndex={0}
      role="region"
      aria-label="Gráfico com rolagem horizontal"
    >
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
              <text x={geom.padLeft - 6} y={y + 3} class="chart-multiline__label" text-anchor="end">
                {val}%
              </text>
            </g>
          );
        })}

        {/* Linhas de cada disciplina */}
        {geom.series.map(s => {
          const dash = dashFor(s.colorSlot);
          return (
            <g key={`series-${s.id}`}>
              {s.runs.map((d, rIdx) => (
                <path
                  key={`run-${s.id}-${rIdx}`}
                  class={`chart-multiline__line subject-stroke-${s.colorSlot}`}
                  d={d}
                  stroke-dasharray={dash}
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
          );
        })}

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
