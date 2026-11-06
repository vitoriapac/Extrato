import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import type { SubjectDistributionRowVisual } from '../../../domain/planning/planning-visual-models.js';

export interface GroupedBarChartProps {
  rows: SubjectDistributionRowVisual[];
  maxMinutes?: number;
  label?: string;
  className?: string;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function GroupedBarChart({
  rows,
  maxMinutes: providedMax,
  label = 'Distribuição de estudo por matéria: Planejado vs Realizado',
  className = '',
}: GroupedBarChartProps): JSX.Element {
  if (!rows || rows.length === 0) {
    return (
      <div class={`p-6 text-center text-sm text-content-secondary ${className}`}>
        <p>Nenhuma matéria com horas planejadas ou estudadas nesta semana.</p>
      </div>
    );
  }

  const maxVal = Math.max(
    60,
    providedMax || 0,
    ...rows.map(r => Math.max(r.plannedMinutes, r.studiedMinutes))
  );

  return (
    <div
      class={`chart-grouped-bars chart-card-interactive space-y-3.5 ${className}`}
      role="region"
      aria-label={label}
    >
      <div class="flex items-center justify-between text-xs text-content-secondary pb-1 border-b border-border-subtle">
        <span class="font-medium">Disciplina</span>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5 rounded-sm bg-surface-sunken border border-border-default"></span>
            Planejado
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5 rounded-sm bg-accent-emphasis"></span>
            Realizado
          </span>
        </div>
      </div>

      <div class="space-y-3">
        {rows.map(row => {
          const plannedPct = Math.min(100, Math.max(0, (row.plannedMinutes / maxVal) * 100));
          const studiedPct = Math.min(100, Math.max(0, (row.studiedMinutes / maxVal) * 100));

          let statusIcon = 'check';
          let statusText = 'No ritmo';
          let statusBadgeClass = 'text-content-secondary bg-surface-sunken';

          if (row.status === 'surplus') {
            statusIcon = 'trending-up';
            statusText = `+${formatMinutes(row.diffMinutes)}`;
            statusBadgeClass = 'text-success-emphasis bg-success-subtle';
          } else if (row.status === 'deficit') {
            statusIcon = 'alert-triangle';
            statusText = `-${formatMinutes(Math.abs(row.diffMinutes))}`;
            statusBadgeClass = 'text-warning-emphasis bg-warning-subtle';
          } else if (row.status === 'unplanned') {
            statusIcon = 'plus';
            statusText = 'Extra';
            statusBadgeClass = 'text-accent-emphasis bg-accent-subtle';
          }

          return (
            <div
              key={row.subjectId}
              class="group p-2 rounded-lg transition-colors hover:bg-surface-sunken/50"
            >
              <div class="flex items-center justify-between gap-2 mb-1.5 text-xs">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class={`w-2.5 h-2.5 rounded-full flex-shrink-0 subject-bg-${row.colorSlot}`}
                    aria-hidden="true"
                  />
                  <span class="font-medium text-content-primary truncate">
                    {row.name}
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-content-secondary font-mono text-xs">
                    {formatMinutes(row.studiedMinutes)} / {formatMinutes(row.plannedMinutes)}
                  </span>
                  <span
                    class={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${statusBadgeClass}`}
                    title={`Diferença: ${row.diffMinutes > 0 ? '+' : ''}${row.diffMinutes} min`}
                  >
                    <Icon name={statusIcon} size={11} stroke={2.5} />
                    {statusText}
                  </span>
                </div>
              </div>

              {/* Par de barras horizontais */}
              <div class="space-y-1">
                {/* Barra Planejado */}
                <div class="h-2 w-full bg-surface-sunken rounded-full overflow-hidden flex">
                  <div
                    class="h-full bg-content-secondary/30 rounded-full transition-all duration-300"
                    style={{ width: `${plannedPct}%` }}
                    title={`Planejado: ${formatMinutes(row.plannedMinutes)} (${row.plannedShare}%)`}
                  />
                </div>

                {/* Barra Realizado com cor da disciplina */}
                <div class="h-2 w-full bg-surface-sunken rounded-full overflow-hidden flex">
                  <div
                    class={`h-full subject-bg-${row.colorSlot} rounded-full transition-all duration-300`}
                    style={{ width: `${studiedPct}%` }}
                    title={`Realizado: ${formatMinutes(row.studiedMinutes)} (${row.studiedShare}%)`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
