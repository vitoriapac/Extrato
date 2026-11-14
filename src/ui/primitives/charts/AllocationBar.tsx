import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import { formatPlanMinutes as formatMinutes } from '../../../core/format-duration.js';
import type { WeeklyAllocationBarVisualModel } from '../../../domain/planning/planning-visual-models.js';
import { StackedBar, type StackedBarPart } from './charts.js';

export interface AllocationBarProps {
  visual: WeeklyAllocationBarVisualModel;
  weeklyCapacityMinutes?: number;
  label?: string;
  className?: string;
}

export function AllocationBar({
  visual,
  weeklyCapacityMinutes = 0,
  label = 'Alocação de capacidade semanal por disciplina',
  className = '',
}: AllocationBarProps): JSX.Element {
  const { subjects, mix, totalWeeklyMinutes, flexMinutes } = visual;

  if (!subjects || subjects.length === 0) {
    return (
      <div class={`p-4 text-center text-xs text-content-secondary ${className}`}>
        <p>Nenhuma alocação de tempo definida no plano semanal.</p>
      </div>
    );
  }

  return (
    <div
      class={`chart-allocation-bar space-y-4 p-4 rounded-default bg-surface-elevated border border-border-default ${className}`}
      role="region"
      aria-label={label}
    >
      {/* Header com totais */}
      <div class="flex items-center justify-between gap-3 text-xs">
        <div>
          <span class="font-semibold text-content-primary">Capacidade semanal alocada</span>
          <div class="text-xs text-content-secondary">
            {formatMinutes(totalWeeklyMinutes)} divididos entre as disciplinas
            {weeklyCapacityMinutes > 0 &&
              ` · meta semanal de ${formatMinutes(weeklyCapacityMinutes)}`}
          </div>
        </div>
        {flexMinutes > 0 && (
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-warning-emphasis bg-warning-subtle">
            <Icon name="clock" size={12} />
            {formatMinutes(flexMinutes)} livres
          </span>
        )}
      </div>

      {/* A lista de disciplinas vive num só lugar: "Plano × estudado por disciplina", no Resumo. */}
      {mix.totalMinutes > 0 && (
        <div class="pt-2 border-t border-border-subtle">
          <p class="text-xs font-medium text-content-secondary mb-2">Divisão por tipo de estudo</p>
          <StackedBar
            label="Divisão do plano por tipo de estudo"
            formatValue={formatMinutes}
            parts={(
              [
                { label: 'Teoria', value: mix.theoryMinutes, tone: 'primary' },
                { label: 'Questões', value: mix.questionsMinutes, tone: 'secondary' },
                { label: 'Revisões', value: mix.reviewsMinutes, tone: 'primary-soft' },
              ] as StackedBarPart[]
            ).filter(part => Number(part.value) > 0)}
          />
        </div>
      )}
    </div>
  );
}
