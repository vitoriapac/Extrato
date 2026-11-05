import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import { simulationTrendGeometry } from './geometry.js';
import type { SimulationTrendVisualModel } from '../../../domain/practice/practice-visual-models.js';

export interface SimulationTrendChartProps {
  visual: SimulationTrendVisualModel;
  label?: string;
  className?: string;
}

export function SimulationTrendChart({
  visual,
  label = 'Trajetória de notas de simulados e linha de meta de aprovação',
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

  const geom = simulationTrendGeometry(simulations, targetScore, { width: 560, height: 160 });

  return (
    <div
      class={`chart-simulation-trend chart-card-interactive space-y-3.5 p-4 rounded-xl bg-surface-elevated border border-border-default shadow-xs ${className}`}
      role="region"
      aria-label={label}
    >
      {/* Cards de KPIs Rápidos */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div class="p-2.5 rounded-lg bg-surface-ground border border-border-subtle">
          <span class="text-content-secondary text-[11px] block mb-0.5">Média Recente</span>
          <div class="text-base font-bold font-mono text-content-primary">
            {averageScore !== null ? `${averageScore}%` : '—'}
          </div>
        </div>

        <div class="p-2.5 rounded-lg bg-surface-ground border border-border-subtle">
          <span class="text-content-secondary text-[11px] block mb-0.5">Melhor Nota</span>
          <div class="text-base font-bold font-mono text-success-emphasis">
            {bestScore !== null ? `${bestScore}%` : '—'}
          </div>
        </div>

        <div class="p-2.5 rounded-lg bg-surface-ground border border-border-subtle">
          <span class="text-content-secondary text-[11px] block mb-0.5">Último Simulado</span>
          <div class="flex items-center gap-1.5">
            <span class="text-base font-bold font-mono text-content-primary">
              {latestScore !== null ? `${latestScore}%` : '—'}
            </span>
            {scoreDelta !== null && (
              <span
                class={`inline-flex items-center gap-0.5 text-[11px] font-mono font-medium ${
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
                    stroke={2.5}
                  />
                )}
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} p.p.
              </span>
            )}
          </div>
        </div>

        <div class="p-2.5 rounded-lg bg-surface-ground border border-border-subtle">
          <span class="text-content-secondary text-[11px] block mb-0.5">Na Meta (≥ {targetScore}%)</span>
          <div class="text-base font-bold font-mono text-content-primary">
            {onTargetCount} de {simulations.length}
          </div>
        </div>
      </div>

      {/* Gráfico SVG de Notas vs Meta */}
      <div class="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${geom.width} ${geom.height}`}
          class="w-full h-auto min-w-[340px] max-h-[170px] overflow-visible"
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

          {/* Linha de Meta Benchmark de Aprovação */}
          <line
            x1={geom.padLeft}
            x2={geom.width - geom.padRight}
            y1={geom.targetY}
            y2={geom.targetY}
            stroke="var(--accent, #6366f1)"
            stroke-width="1.5"
            stroke-dasharray="4 3"
            opacity={0.8}
          />
          <text
            x={geom.width - geom.padRight}
            y={geom.targetY - 4}
            text-anchor="end"
            class="text-[9px] fill-accent-emphasis font-medium"
          >
            Meta: {targetScore}%
          </text>

          {/* Rótulos de escala Y */}
          <text x={geom.padLeft - 6} y={geom.padTop + 4} text-anchor="end" class="text-[9px] fill-content-secondary font-mono">100%</text>
          <text x={geom.padLeft - 6} y={geom.padTop + geom.plotH * 0.5 + 3} text-anchor="end" class="text-[9px] fill-content-secondary font-mono">50%</text>
          <text x={geom.padLeft - 6} y={geom.padTop + geom.plotH} text-anchor="end" class="text-[9px] fill-content-secondary font-mono">0%</text>

          {/* Curva de evolução de notas dos simulados */}
          {geom.pathD && (
            <path
              d={geom.pathD}
              fill="none"
              stroke="currentColor"
              class="text-content-primary"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          )}

          {/* Pontos de cada simulado */}
          {geom.points.map(pt => {
            const isTarget = pt.onTarget;
            const ptColor = isTarget ? 'var(--color-success, #10b981)' : 'var(--color-warning, #f59e0b)';

            return (
              <g key={`sim-pt-${pt.index}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={5}
                  fill="var(--surface-ground, #fff)"
                  stroke={ptColor}
                  stroke-width="2.5"
                  class="cursor-pointer hover:r-6 transition-all chart-point-interactive"
                >
                  <title>{`${pt.name} (${pt.date}): ${pt.score}% (${pt.correct}/${pt.total})`}</title>
                </circle>

                {/* Rótulo com a nota acima do ponto */}
                <text
                  x={pt.x}
                  y={pt.y - 8}
                  text-anchor="middle"
                  class="text-[9px] font-bold font-mono fill-content-primary"
                >
                  {pt.score}%
                </text>

                {/* Data ou número do simulado abaixo */}
                <text
                  x={pt.x}
                  y={geom.height - 6}
                  text-anchor="middle"
                  class="text-[9px] fill-content-secondary font-mono truncate"
                >
                  {pt.date !== '—' && pt.date.length >= 5 ? pt.date.slice(5) : `S${pt.index + 1}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div class="flex items-center justify-between text-[11px] text-content-secondary pt-1 border-t border-border-subtle">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-success-emphasis"></span>
          Atingiu a meta
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-warning-emphasis"></span>
          Abaixo da meta
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 border-t border-dashed border-accent-emphasis"></span>
          Linha de aprovação ({targetScore}%)
        </span>
      </div>
    </div>
  );
}
