import type { JSX } from 'preact';
import { pedagogicalMatrixGeometry, PedagogicalMatrixItemInput } from './geometry.js';
import { formatDecimal } from '../../../core/format-number.js';

export interface PedagogicalMatrixChartProps {
  items: PedagogicalMatrixItemInput[];
  thresholdMastery?: number;
  thresholdRetention?: number;
  width?: number;
  height?: number;
  label?: string;
  className?: string;
}

export function PedagogicalMatrixChart({
  items,
  thresholdMastery = 70,
  thresholdRetention = 60,
  width = 560,
  height = 360,
  label = 'Matriz Pedagógica: Domínio vs Retenção por disciplina',
  className = '',
}: PedagogicalMatrixChartProps): JSX.Element {
  const geom = pedagogicalMatrixGeometry(items, {
    width,
    height,
    thresholdMastery,
    thresholdRetention,
  });

  return (
    <div class={`chart-matrix-wrap ${className}`} tabIndex={0} role="region" aria-label="Gráfico com rolagem horizontal">
      <svg
        class="chart-matrix"
        viewBox={`0 0 ${geom.width} ${geom.height}`}
        role="img"
        aria-label={label}
      >
        {/* Fundo dos 4 quadrantes */}
        {/* Quadrante Consolidado (Superior Direito: Domínio Alto, Retenção Alta) */}
        <rect
          class="chart-matrix__quadrant-bg"
          x={geom.thresholdX}
          y={geom.padTop}
          width={geom.width - geom.padRight - geom.thresholdX}
          height={geom.thresholdY - geom.padTop}
        />
        {/* Rótulos dos Quadrantes */}
        <text
          class="chart-matrix__quadrant-label"
          x={geom.width - geom.padRight - 8}
          y={geom.padTop + 14}
          text-anchor="end"
        >
          Consolidada
        </text>
        <text
          class="chart-matrix__quadrant-label"
          x={geom.padLeft + 8}
          y={geom.padTop + 14}
          text-anchor="start"
        >
          Risco de Esquecimento
        </text>
        <text
          class="chart-matrix__quadrant-label"
          x={geom.width - geom.padRight - 8}
          y={geom.height - geom.padBottom - 8}
          text-anchor="end"
        >
          Em Construção
        </text>
        <text
          class="chart-matrix__quadrant-label"
          x={geom.padLeft + 8}
          y={geom.height - geom.padBottom - 8}
          text-anchor="start"
        >
          Vulnerabilidade Crítica
        </text>

        {/* Linhas de demarcação dos limites (Thresholds) */}
        <line
          class="chart-matrix__threshold"
          x1={geom.thresholdX}
          y1={geom.padTop}
          x2={geom.thresholdX}
          y2={geom.height - geom.padBottom}
        />
        <line
          class="chart-matrix__threshold"
          x1={geom.padLeft}
          y1={geom.thresholdY}
          x2={geom.width - geom.padRight}
          y2={geom.thresholdY}
        />

        {/* Eixos com borda */}
        <line
          class="chart-matrix__grid"
          x1={geom.padLeft}
          y1={geom.height - geom.padBottom}
          x2={geom.width - geom.padRight}
          y2={geom.height - geom.padBottom}
        />
        <line
          class="chart-matrix__grid"
          x1={geom.padLeft}
          y1={geom.padTop}
          x2={geom.padLeft}
          y2={geom.height - geom.padBottom}
        />

        {/* Rótulos dos Eixos */}
        <text
          x={geom.width / 2}
          y={geom.height - 10}
          class="chart-stacked-columns__label"
          text-anchor="middle"
        >
          Retenção / Memória →
        </text>
        <text
          x={12}
          y={geom.height / 2}
          class="chart-stacked-columns__label"
          text-anchor="middle"
          transform={`rotate(-90 12 ${geom.height / 2})`}
        >
          Domínio / Precisão →
        </text>

        {/* Bolhas das Disciplinas */}
        {geom.bubbles.map(b => (
          <g key={`bubble-${b.id}`}>
            <circle
              class={`chart-matrix__bubble subject-fill-${b.colorSlot}`}
              cx={b.cx}
              cy={b.cy}
              r={b.r}
              stroke="var(--surface-card)"
              stroke-width={2}
            >
              <title>{`${b.name} · Domínio: ${formatDecimal(b.mastery)}% · Retenção: ${formatDecimal(b.retention)}% · Estudo: ${formatDecimal(b.studyMinutes / 60)}h`}</title>
            </circle>
            <text
              class="chart-matrix__bubble-text"
              x={b.cx}
              y={b.cy + 3}
              text-anchor="middle"
            >
              {b.name.slice(0, 3).toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
