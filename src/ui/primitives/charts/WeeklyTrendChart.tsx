import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import { weeklyTrendGeometry } from './geometry.js';
import type { SubjectWeeklyTrendVisualModel } from '../../../domain/practice/practice-visual-models.js';

export interface WeeklyTrendChartProps {
  visual: SubjectWeeklyTrendVisualModel;
  label?: string;
  className?: string;
}

export function WeeklyTrendChart({
  visual,
  label = 'Tendência semanal de acertos e volume de questões nas últimas 8 semanas',
  className = '',
}: WeeklyTrendChartProps): JSX.Element {
  const { points, trendDirection, trendLabel, trendDelta, maxResolved, averageAccuracy, colorSlot } = visual;

  if (!points || points.length === 0) {
    return (
      <div class={`p-4 text-center text-xs text-content-secondary ${className}`}>
        <p>Nenhuma questão registrada nas últimas 8 semanas.</p>
      </div>
    );
  }

  const geom = weeklyTrendGeometry(points, maxResolved, { width: 520, height: 160 });

  let trendIcon = 'minus';
  let trendBadgeClass = 'text-content-secondary bg-surface-sunken';
  if (trendDirection === 'improving') {
    trendIcon = 'trending-up';
    trendBadgeClass = 'text-success-emphasis bg-success-subtle';
  } else if (trendDirection === 'worsening') {
    trendIcon = 'trending-down';
    trendBadgeClass = 'text-warning-emphasis bg-warning-subtle';
  } else if (trendDirection === 'stable') {
    trendIcon = 'arrow-right';
    trendBadgeClass = 'text-info-emphasis bg-info-subtle';
  }

  return (
    <div
      class={`chart-weekly-trend chart-card-interactive space-y-3 p-4 rounded-xl bg-surface-elevated border border-border-default shadow-xs ${className}`}
      role="region"
      aria-label={label}
    >
      {/* Topo com indicador de tendência e média de acerto */}
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-content-primary">Evolução Semanal</span>
          <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${trendBadgeClass}`}>
            <Icon name={trendIcon} size={12} stroke={2.5} />
            {trendLabel}
            {trendDelta !== null && ` (${trendDelta > 0 ? '+' : ''}${trendDelta} p.p.)`}
          </span>
        </div>

        <div class="flex items-center gap-3 text-[11px] text-content-secondary">
          <span class="flex items-center gap-1.5">
            <span class={`inline-block w-2.5 h-2.5 rounded-sm subject-bg-${colorSlot} opacity-50`}></span>
            Volume
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-0.5 bg-accent-emphasis"></span>
            Precisão
          </span>
          {averageAccuracy !== null && (
            <span class="font-mono font-medium text-content-primary pl-1 border-l border-border-subtle">
              Média: {averageAccuracy}%
            </span>
          )}
        </div>
      </div>

      {/* Gráfico SVG Combinado */}
      <div class="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${geom.width} ${geom.height}`}
          class="w-full h-auto min-w-[320px] max-h-[170px] overflow-visible"
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

          {/* Rótulos de escala Y */}
          <text x={geom.padLeft - 6} y={geom.padTop + 4} text-anchor="end" class="text-[9px] fill-content-secondary font-mono">100%</text>
          <text x={geom.padLeft - 6} y={geom.padTop + geom.plotH * 0.5 + 3} text-anchor="end" class="text-[9px] fill-content-secondary font-mono">50%</text>
          <text x={geom.padLeft - 6} y={geom.padTop + geom.plotH} text-anchor="end" class="text-[9px] fill-content-secondary font-mono">0%</text>

          {/* Barras de volume na base do gráfico */}
          {geom.items.map(it => (
            <rect
              key={`bar-${it.index}`}
              x={it.barX}
              y={it.barY}
              width={it.barW}
              height={it.barH}
              rx={2}
              class={`subject-fill-${colorSlot} opacity-40 hover:opacity-75 transition-opacity chart-bar-interactive`}
            >
              <title>{`${it.label}: ${it.resolved} questões resolvidas`}</title>
            </rect>
          ))}

          {/* Curva de precisão contínua */}
          {geom.pathD && (
            <path
              d={geom.pathD}
              fill="none"
              stroke="var(--accent, #6366f1)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          )}

          {/* Pontos de precisão e rótulos das semanas */}
          {geom.items.map(it => (
            <g key={`pt-${it.index}`}>
              {/* Rótulo da semana no eixo X */}
              <text
                x={it.x}
                y={geom.height - 6}
                text-anchor="middle"
                class="text-[10px] fill-content-secondary font-mono"
              >
                {it.label}
              </text>

              {/* Ponto de precisão */}
              {it.y !== null ? (
                <circle
                  cx={it.x}
                  cy={it.y}
                  r={4}
                  fill="var(--surface-ground, #fff)"
                  stroke="var(--accent, #6366f1)"
                  stroke-width="2"
                  class="cursor-pointer hover:r-5 transition-all chart-point-interactive"
                >
                  <title>{`${it.label}: ${it.accuracy}% de acerto (${it.resolved} questões)`}</title>
                </circle>
              ) : (
                <circle
                  cx={it.x}
                  cy={geom.padTop + geom.plotH - 2}
                  r={2}
                  fill="currentColor"
                  class="text-content-secondary opacity-30"
                >
                  <title>{`${it.label}: dados insuficientes`}</title>
                </circle>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
