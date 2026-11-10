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
    zoom: true,
  });

  // Com muitas disciplinas as siglas se sobrepõem: só as 5 de menor domínio recebem rótulo; as demais seguem no tooltip.
  const labeled = new Set(
    [...geom.bubbles]
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 5)
      .map(b => b.id)
  );
  const drawOrder = [...geom.bubbles].sort((a, b) => b.r - a.r);

  return (
    <div
      class={`chart-matrix-wrap ${className}`}
      tabIndex={0}
      role="region"
      aria-label="Gráfico com rolagem horizontal"
    >
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

        {/* Valores nas pontas dos eixos: a escala acompanha os dados, então precisa estar escrita. */}
        <text
          class="chart-stacked-columns__label"
          x={geom.padLeft}
          y={geom.height - geom.padBottom + 14}
          text-anchor="start"
        >
          {geom.domain.xMin}%
        </text>
        <text
          class="chart-stacked-columns__label"
          x={geom.width - geom.padRight}
          y={geom.height - geom.padBottom + 14}
          text-anchor="end"
        >
          {geom.domain.xMax}%
        </text>
        <text
          class="chart-stacked-columns__label"
          x={geom.padLeft - 4}
          y={geom.height - geom.padBottom}
          text-anchor="end"
        >
          {geom.domain.yMin}%
        </text>
        <text
          class="chart-stacked-columns__label"
          x={geom.padLeft - 4}
          y={geom.padTop + 8}
          text-anchor="end"
        >
          {geom.domain.yMax}%
        </text>

        {/* Bolhas das Disciplinas */}
        {drawOrder.map(b => (
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
            {labeled.has(b.id) && (
              <text class="chart-matrix__bubble-text" x={b.cx} y={b.cy + 3} text-anchor="middle">
                {b.name.slice(0, 3).toUpperCase()}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
