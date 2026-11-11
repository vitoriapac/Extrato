import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import type { WeeklyAllocationBarVisualModel } from '../../../domain/planning/planning-visual-models.js';
import { formatDecimal } from '../../../core/format-number.js';

export interface AllocationBarProps {
  visual: WeeklyAllocationBarVisualModel;
  weeklyCapacityMinutes?: number;
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

const VISIBLE_CHIPS = 5;

function chip(s: WeeklyAllocationBarVisualModel['subjects'][number]): JSX.Element {
  return (
    <div
      key={s.subjectId}
      class="flex items-center gap-2 px-2 py-1 rounded bg-surface-sunken/60 text-xs text-content-primary border border-border-subtle"
    >
      <span class={`w-2 h-2 rounded-full subject-bg-${s.colorSlot}`} aria-hidden="true" />
      <span class="font-medium break-words min-w-0">{s.subjectName}</span>
      <span class="text-content-secondary font-mono">{formatMinutes(s.minutes)}</span>
      <span class="text-content-secondary text-xs">({formatDecimal(s.percentage)}%)</span>
    </div>
  );
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

  const capacityTotal = Math.max(totalWeeklyMinutes, weeklyCapacityMinutes, 1);
  const flexPct =
    capacityTotal > 0 && flexMinutes > 0 ? +((flexMinutes / capacityTotal) * 100).toFixed(1) : 0;

  return (
    <div
      class={`chart-allocation-bar space-y-4 p-4 rounded-default bg-surface-elevated border border-border-default ${className}`}
      role="region"
      aria-label={label}
    >
      {/* Header com totais */}
      <div class="flex items-center justify-between gap-3 text-xs">
        <div>
          <span class="font-semibold text-content-primary">Capacidade Semanal Alocada</span>
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

      {/* Barra segmentada contínua */}
      <div
        class="h-3 w-full bg-surface-sunken rounded-full overflow-hidden flex"
        role="progressbar"
        aria-label={label || 'Capacidade semanal alocada'}
        aria-valuenow={Math.min(100, Math.round((totalWeeklyMinutes / capacityTotal) * 100))}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {subjects.map(s => {
          const slicePct = Math.max(1, (s.minutes / capacityTotal) * 100);
          return (
            <div
              key={s.subjectId}
              class={`h-full subject-bg-${s.colorSlot} transition-all duration-300 hover:brightness-110`}
              style={{ width: `${slicePct}%` }}
              title={`${s.subjectName}: ${formatMinutes(s.minutes)} (${formatDecimal(s.percentage)}%)`}
            />
          );
        })}
        {flexPct > 0 && (
          <div
            class="h-full bg-surface-sunken border-l border-border-subtle"
            style={{ width: `${flexPct}%` }}
            title={`Tempo livre: ${formatMinutes(flexMinutes)}`}
          />
        )}
      </div>

      {/* Fatias das disciplinas (Badges com cores oficiais) */}
      <div class="flex flex-wrap gap-2 pt-1">{subjects.slice(0, VISIBLE_CHIPS).map(chip)}</div>
      {subjects.length > VISIBLE_CHIPS && (
        <details class="allocation-more">
          <summary class="text-xs font-medium text-content-secondary cursor-pointer">
            Mostrar mais · +{subjects.length - VISIBLE_CHIPS}
          </summary>
          <div class="flex flex-wrap gap-2 pt-2">{subjects.slice(VISIBLE_CHIPS).map(chip)}</div>
        </details>
      )}

      {/* Mix de Atividades da Semana (Teoria × Questões × Revisão) */}
      {mix.totalMinutes > 0 && (
        <div class="pt-2 border-t border-border-subtle">
          <div class="flex items-center justify-between text-xs font-medium text-content-secondary mb-2">
            <span>Divisão por tipo de estudo</span>
            <span>
              {formatDecimal(mix.theoryPercentage)}% teoria ·{' '}
              {formatDecimal(mix.questionsPercentage)}% questões ·{' '}
              {formatDecimal(mix.reviewsPercentage)}% revisões
            </span>
          </div>
          <div class="h-2 w-full bg-surface-sunken rounded-full overflow-hidden flex">
            {mix.theoryPercentage > 0 && (
              <div
                class="h-full bg-info-emphasis transition-all"
                style={{ width: `${mix.theoryPercentage}%` }}
                title={`Teoria: ${formatMinutes(mix.theoryMinutes)} (${formatDecimal(mix.theoryPercentage)}%)`}
              />
            )}
            {mix.questionsPercentage > 0 && (
              <div
                class="h-full bg-accent-emphasis transition-all"
                style={{ width: `${mix.questionsPercentage}%` }}
                title={`Questões: ${formatMinutes(mix.questionsMinutes)} (${formatDecimal(mix.questionsPercentage)}%)`}
              />
            )}
            {mix.reviewsPercentage > 0 && (
              <div
                class="h-full bg-success-emphasis transition-all"
                style={{ width: `${mix.reviewsPercentage}%` }}
                title={`Revisões: ${formatMinutes(mix.reviewsMinutes)} (${formatDecimal(mix.reviewsPercentage)}%)`}
              />
            )}
          </div>
          <div class="flex items-center justify-between text-xs text-content-secondary mt-2 px-1">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-info-emphasis"></span>
              Teoria: {formatMinutes(mix.theoryMinutes)}
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-accent-emphasis"></span>
              Questões: {formatMinutes(mix.questionsMinutes)}
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-success-emphasis"></span>
              Revisões: {formatMinutes(mix.reviewsMinutes)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
