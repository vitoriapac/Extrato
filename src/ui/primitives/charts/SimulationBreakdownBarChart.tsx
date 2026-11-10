import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import type { SimulationBreakdownVisualModel } from '../../../domain/practice/practice-visual-models.js';

export interface SimulationBreakdownBarChartProps {
  visual: SimulationBreakdownVisualModel;
  label?: string;
  className?: string;
}

export function SimulationBreakdownBarChart({
  visual,
  label = 'Aproveitamento por disciplina no simulado em relação à média geral',
  className = '',
}: SimulationBreakdownBarChartProps): JSX.Element {
  const { rows, overallScore, highestSubject, lowestSubject } = visual;

  if (!rows || rows.length === 0) {
    return (
      <div class={`p-3 text-center text-xs text-content-secondary ${className}`}>
        <p>Nenhuma disciplina detalhada neste simulado.</p>
      </div>
    );
  }

  return (
    <div
      class={`chart-simulation-breakdown space-y-3 p-3.5 rounded-default bg-surface-ground/70 border border-border-subtle ${className}`}
      role="region"
      aria-label={label}
    >
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-content-primary">Raio-X do Simulado</span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-data font-semibold text-warning-emphasis bg-warning-subtle">
            Média da prova: {overallScore}%
          </span>
        </div>

        <div class="flex items-center gap-3 text-xs text-content-secondary">
          {highestSubject && (
            <span class="inline-flex items-center gap-1 text-success-emphasis">
              <Icon name="trending-up" size={12} />
              Destaque: <strong class="font-medium text-content-primary">{highestSubject}</strong>
            </span>
          )}
          {lowestSubject && lowestSubject !== highestSubject && (
            <span class="inline-flex items-center gap-1 text-warning-emphasis">
              <Icon name="alert-triangle" size={12} />
              Atenção: <strong class="font-medium text-content-primary">{lowestSubject}</strong>
            </span>
          )}
        </div>
      </div>

      <div class="space-y-2 pt-1">
        {rows.map(row => {
          const widthPct = Math.min(100, Math.max(0, row.score));
          const isAbove = row.isAboveAverage;

          return (
            <div key={row.id} class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span
                    class={`w-2.5 h-2.5 rounded-full flex-shrink-0 subject-bg-${row.colorSlot}`}
                    aria-hidden="true"
                  />
                  <span class="font-medium text-content-primary truncate">
                    {row.subjectName}
                  </span>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
                  <span class="text-content-secondary text-xs">
                    {row.correct}/{row.total}
                  </span>
                  <span class="font-bold text-content-primary">
                    {row.score}%
                  </span>
                  <span
                    class={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      isAbove
                        ? 'text-success-emphasis bg-success-subtle'
                        : 'text-warning-emphasis bg-warning-subtle'
                    }`}
                    title={`Diferença para a média geral da prova (${overallScore}%)`}
                  >
                    {row.relativeGap >= 0 ? `+${row.relativeGap}` : row.relativeGap} p.p.
                  </span>
                </div>
              </div>

              {/* Barra horizontal com linha de corte da média da prova */}
              <div class="relative h-2 w-full bg-surface-sunken rounded-full overflow-hidden flex">
                <div
                  class={`h-full subject-bg-${row.colorSlot} rounded-full transition-all duration-300`}
                  style={{ width: `${widthPct}%` }}
                  title={`${row.subjectName}: ${row.score}%`}
                />
                {/* Marcador vertical da média do simulado em destaque laranja */}
                <div
                  class="absolute top-0 bottom-0 w-0.5 bg-warning-emphasis z-10"
                  style={{ left: `${overallScore}%` }}
                  title={`Média geral: ${overallScore}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
