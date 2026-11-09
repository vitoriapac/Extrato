import type { JSX } from 'preact';
import { stackedColumnsGeometry, StackedColumnDayInput } from './geometry.js';
import { formatDecimal } from '../../../core/format-number.js';

export interface StackedColumnChartProps {
  days: StackedColumnDayInput[];
  width?: number;
  height?: number;
  label?: string;
  minYMax?: number;
  className?: string;
}

const formatHours = (seconds: number) => {
  const h = seconds / 3600;
  return `${formatDecimal(h)}h`;
};

export function StackedColumnChart({
  days,
  width = 620,
  height = 200,
  label = 'Linha do tempo de estudos diários por disciplina',
  minYMax = 3600,
  className = '',
}: StackedColumnChartProps): JSX.Element {
  const geom = stackedColumnsGeometry(days, { width, height, minYMax });
  const maxH = geom.maxSeconds / 3600;
  const gridTicks = [0, maxH / 2, maxH];
  // No máximo ~6 datas no eixo X: com 30 colunas os rótulos se sobrepunham.
  const labelStep = Math.max(1, Math.ceil(geom.columns.length / 6));

  return (
    <div
      class={`chart-stacked-columns-wrap ${className}`}
      tabIndex={0}
      role="region"
      aria-label={`${label}, com rolagem horizontal`}
    >
      <svg
        class="chart-stacked-columns"
        viewBox={`0 0 ${geom.width} ${geom.height}`}
        role="img"
        aria-label={label}
      >
        {/* Linhas de grade horizontais com rótulos de horas */}
        {gridTicks.map(val => {
          const y = geom.yFor(val * 3600);
          return (
            <g key={`grid-${val}`}>
              <line
                class="chart-stacked-columns__grid"
                x1={geom.padLeft}
                y1={y}
                x2={geom.width - geom.padRight}
                y2={y}
              />
              <text
                x={geom.padLeft - 6}
                y={y + 3}
                class="chart-stacked-columns__label"
                text-anchor="end"
              >
                {formatDecimal(val)}h
              </text>
            </g>
          );
        })}

        {/* Colunas empilhadas */}
        {geom.columns.map((col, colIndex) => {
          const [, m, d] = col.date.split('-');
          const dateLabel = `${d}/${m}`;
          return (
            <g key={`col-${col.date}`}>
              {/* Barra base vazia para dias sem estudo */}
              {col.zero ? (
                <rect
                  class="chart-stacked-columns__bar"
                  x={col.x}
                  y={geom.padTop + geom.plotH - 2}
                  width={col.width}
                  height={2}
                  fill="var(--surface-card-muted)"
                >
                  <title>{`${col.date}: sem estudo registrado`}</title>
                </rect>
              ) : (
                col.segments.map((seg, sIdx) => (
                  <rect
                    key={`seg-${col.date}-${sIdx}`}
                    class={`chart-stacked-columns__bar chart-bar-interactive subject-fill-${seg.colorSlot}`}
                    x={seg.x}
                    y={seg.y}
                    width={seg.width}
                    height={seg.height}
                  >
                    <title>{`${col.date} · ${seg.subjectName}: ${formatHours(seg.seconds)}`}</title>
                  </rect>
                ))
              )}

              {/* Rótulo da data no eixo X (espaçado) */}
              {(colIndex % labelStep === 0 || colIndex === geom.columns.length - 1) && (
                <text
                  x={col.cx}
                  y={geom.height - 8}
                  class="chart-stacked-columns__label"
                  text-anchor="middle"
                >
                  {dateLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
