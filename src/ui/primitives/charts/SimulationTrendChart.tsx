import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import { simulationTrendGeometry } from './geometry.js';
import type { SimulationTrendVisualModel } from '../../../domain/practice/practice-visual-models.js';
import { chartSize } from './chart-size.js';

export interface SimulationTrendChartProps {
  visual: SimulationTrendVisualModel;
  label?: string;
  className?: string;
}

export function SimulationTrendChart({
  visual,
  label = 'Trajetória de notas de simulados e meta configurada',
  className = '',
}: SimulationTrendChartProps): JSX.Element {
  const {
    simulations,
    targetScore,
    averageScore,
    bestScore,
    latestScore,
    scoreDelta,
    onTargetCount,
  } = visual;

  if (!simulations || simulations.length === 0) {
    return (
      <div class={`p-4 text-center text-xs text-content-secondary ${className}`}>
        <p>Nenhum simulado com dados registrado para traçar a evolução.</p>
      </div>
    );
  }

  // Escala ajustada aos dados (0–100 achatava notas entre 77% e 84%); no máximo 80 de piso.
  const lowest = Math.min(...simulations.map(sim => sim.score), targetScore);
  const yMin = Math.min(80, Math.max(0, Math.floor((lowest - 10) / 10) * 10));
  const geom = simulationTrendGeometry(simulations, targetScore, { ...chartSize(560, 160), yMin });

  return (
    <div
      class={`chart-simulation-trend chart-card-interactive space-y-4 p-4 rounded-default bg-surface-elevated border border-border-default ${className}`}
      role="region"
      aria-label={label}
    >
      {/* Cards de KPIs Rápidos */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="p-3 rounded-default bg-surface-subtle border border-border-subtle">
          <span class="text-content-secondary text-xs block font-medium mb-1">Média Recente</span>
          <div class="text-base font-semibold font-data text-content-primary">
            {averageScore !== null ? `${averageScore}%` : '—'}
          </div>
        </div>

        <div class="p-3 rounded-default bg-surface-subtle border border-border-subtle">
          <span class="text-content-secondary text-xs block font-medium mb-1">Melhor Nota</span>
          <div class="text-base font-semibold font-data text-success-emphasis">
            {bestScore !== null ? `${bestScore}%` : '—'}
          </div>
        </div>

        <div class="p-3 rounded-default bg-surface-subtle border border-border-subtle">
          <span class="text-content-secondary text-xs block font-medium mb-1">
            Último Simulado
          </span>
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold font-data text-content-primary">
              {latestScore !== null ? `${latestScore}%` : '—'}
            </span>
            {scoreDelta !== null && (
              <span
                class={`inline-flex items-center gap-1 text-xs font-data font-medium ${
                  scoreDelta > 0
                    ? 'text-success-emphasis'
                    : scoreDelta < 0
                      ? 'text-warning-emphasis'
                      : 'text-content-secondary'
                }`}
                title="Variação em relação ao simulado anterior"
              >
                {scoreDelta !== 0 && (
                  <Icon
                    name={scoreDelta > 0 ? 'trending-up' : 'trending-down'}
                    size={12}
                  />
                )}
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} p.p.
              </span>
            )}
          </div>
        </div>

        <div class="p-3 rounded-default bg-surface-subtle border border-border-subtle">
          <span class="text-content-secondary text-xs block font-medium mb-1">
            Na Meta (≥ {targetScore}%)
          </span>
          <div class="text-base font-semibold font-data text-amber">
            {onTargetCount} de {simulations.length}
          </div>
        </div>
      </div>

      {/* Gráfico SVG de Notas vs Meta */}
      {/* Largura mínima = viewBox: o texto do eixo nunca renderiza abaixo de 12px; row-reverse abre a rolagem no dado mais recente. */}
      <div
        class="w-full overflow-x-auto flex flex-row-reverse"
        role="region"
        aria-label="Gráfico de notas de simulados contra a meta, rolável na horizontal"
        tabIndex={0}
      >
        <svg
          viewBox={`0 0 ${geom.width} ${geom.height}`}
          style={{ minWidth: `${geom.width}px` }}
          class="w-full h-auto max-h-[170px] overflow-visible"
          role="img"
          aria-hidden="true"
        >
          {/* Linhas de grade horizontal (0%, 50%, 100%) */}
          <line
            x1={geom.padLeft}
            x2={geom.width - geom.padRight}
            y1={geom.padTop}
            y2={geom.padTop}
            stroke="currentColor"
            class="text-border-subtle"
            stroke-dasharray="2 3"
          />
          <line
            x1={geom.padLeft}
            x2={geom.width - geom.padRight}
            y1={geom.padTop + geom.plotH * 0.5}
            y2={geom.padTop + geom.plotH * 0.5}
            stroke="currentColor"
            class="text-border-subtle"
            stroke-dasharray="2 3"
          />
          <line
            x1={geom.padLeft}
            x2={geom.width - geom.padRight}
            y1={geom.padTop + geom.plotH}
            y2={geom.padTop + geom.plotH}
            stroke="currentColor"
            class="text-border-default"
          />

          {/* Linha de Meta Benchmark de Aprovação em destaque laranja */}
          <line
            x1={geom.padLeft}
            x2={geom.width - geom.padRight}
            y1={geom.targetY}
            y2={geom.targetY}
            stroke="var(--chart-series-secondary)"
            stroke-width="1.5"
            stroke-dasharray="4 3"
            opacity={0.9}
          />

          {/* Rótulos de escala Y */}
          <text
            x={geom.padLeft - 6}
            y={geom.padTop + 4}
            text-anchor="end"
            class="text-xs fill-content-secondary font-mono"
          >
            100%
          </text>
          <text
            x={geom.padLeft - 6}
            y={geom.padTop + geom.plotH * 0.5 + 3}
            text-anchor="end"
            class="text-xs fill-content-secondary font-mono"
          >
            {Math.round((100 + geom.yMin) / 2)}%
          </text>
          <text
            x={geom.padLeft - 6}
            y={geom.padTop + geom.plotH}
            text-anchor="end"
            class="text-xs fill-content-secondary font-mono"
          >
            {geom.yMin}%
          </text>

          {/* Curva de evolução de notas dos simulados */}
          {geom.pathD && (
            <path
              d={geom.pathD}
              fill="none"
              stroke="var(--chart-series-primary)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          )}

          {/* Pontos de cada simulado */}
          {geom.points.map(pt => {
            const isTarget = pt.onTarget;
            const ptColor = isTarget ? 'var(--status-positive)' : 'var(--chart-series-secondary)';

            return (
              <g key={`sim-pt-${pt.index}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={5}
                  fill="var(--surface-card)"
                  stroke={ptColor}
                  stroke-width="2.5"
                  class="cursor-pointer chart-point-interactive"
                >
                  <title>{`${pt.name} (${pt.date}): ${pt.score}% (${pt.correct}/${pt.total})`}</title>
                </circle>

                {/* Rótulo com a nota acima do ponto */}
                <text
                  x={pt.x}
                  y={pt.y - 8}
                  text-anchor="middle"
                  class="text-xs font-semibold font-mono fill-content-primary"
                >
                  {pt.score}%
                </text>

                {/* Data ou número do simulado abaixo */}
                <text
                  x={pt.x}
                  y={geom.height - 6}
                  text-anchor="middle"
                  class="text-xs fill-content-secondary font-mono truncate"
                >
                  {/^\d{4}-\d{2}-\d{2}$/.test(pt.date) ? `${pt.date.slice(8, 10)}/${pt.date.slice(5, 7)}` : `S${pt.index + 1}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div class="flex items-center justify-between text-xs text-content-secondary pt-1 border-t border-border-subtle">
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-success-emphasis"></span>
          Atingiu a meta
        </span>
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-warning-emphasis"></span>
          Abaixo da meta
        </span>
        <span class="flex items-center gap-2">
          <span class="w-3 h-0.5 border-t border-dashed border-amber"></span>
          Meta configurada ({targetScore}%)
        </span>
      </div>
    </div>
  );
}
