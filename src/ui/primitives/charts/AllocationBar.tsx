import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import type { WeeklyAllocationBarVisualModel } from '../../../domain/planning/planning-visual-models.js';

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
  const flexPct = capacityTotal > 0 && flexMinutes > 0 ? +((flexMinutes / capacityTotal) * 100).toFixed(1) : 0;

  return (
    <div
      class={`chart-allocation-bar space-y-4 p-4 rounded-xl bg-surface-elevated border border-border-default shadow-xs ${className}`}
      role="region"
      aria-label={label}
    >
      {/* Header com totais */}
      <div class="flex items-center justify-between gap-3 text-xs">
        <div>
          <span class="font-semibold text-content-primary">Capacidade Semanal Alocada</span>
          <div class="text-[11px] text-content-secondary">
            {formatMinutes(totalWeeklyMinutes)} planejados
            {weeklyCapacityMinutes > 0 && ` de ${formatMinutes(weeklyCapacityMinutes)} de meta`}
          </div>
        </div>
        {flexMinutes > 0 && (
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-accent-emphasis bg-accent-subtle">
            <Icon name="clock" size={12} stroke={2} />
            {formatMinutes(flexMinutes)} livres
          </span>
        )}
      </div>

      {/* Barra segmentada contínua */}
      <div
        class="h-3 w-full bg-surface-sunken rounded-full overflow-hidden flex shadow-inner"
        role="progressbar"
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
              title={`${s.subjectName}: ${formatMinutes(s.minutes)} (${s.percentage}%)`}
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
      <div class="flex flex-wrap gap-2 pt-1">
        {subjects.map(s => (
          <div
            key={s.subjectId}
            class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-sunken/60 text-[11px] text-content-primary border border-border-subtle"
          >
            <span
              class={`w-2 h-2 rounded-full subject-bg-${s.colorSlot}`}
              aria-hidden="true"
            />
            <span class="font-medium truncate max-w-[120px]">{s.subjectName}</span>
            <span class="text-content-secondary font-mono">{formatMinutes(s.minutes)}</span>
            <span class="text-content-secondary text-[10px]">({s.percentage}%)</span>
          </div>
        ))}
      </div>

      {/* Mix de Atividades da Semana (Teoria × Questões × Revisão) */}
      {mix.totalMinutes > 0 && (
        <div class="pt-2 border-t border-border-subtle">
          <div class="flex items-center justify-between text-[11px] font-medium text-content-secondary mb-2">
            <span>Mix Pedagógico Previsto</span>
            <span>{mix.theoryPercentage}% T • {mix.questionsPercentage}% Q • {mix.reviewsPercentage}% R</span>
          </div>
          <div class="h-1.5 w-full bg-surface-sunken rounded-full overflow-hidden flex">
            {mix.theoryPercentage > 0 && (
              <div
                class="h-full bg-info-emphasis transition-all"
                style={{ width: `${mix.theoryPercentage}%` }}
                title={`Teoria: ${formatMinutes(mix.theoryMinutes)} (${mix.theoryPercentage}%)`}
              />
            )}
            {mix.questionsPercentage > 0 && (
              <div
                class="h-full bg-accent-emphasis transition-all"
                style={{ width: `${mix.questionsPercentage}%` }}
                title={`Questões: ${formatMinutes(mix.questionsMinutes)} (${mix.questionsPercentage}%)`}
              />
            )}
            {mix.reviewsPercentage > 0 && (
              <div
                class="h-full bg-success-emphasis transition-all"
                style={{ width: `${mix.reviewsPercentage}%` }}
                title={`Revisões: ${formatMinutes(mix.reviewsMinutes)} (${mix.reviewsPercentage}%)`}
              />
            )}
          </div>
          <div class="flex items-center justify-between text-[10px] text-content-secondary mt-1.5 px-0.5">
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-info-emphasis"></span>
              Teoria: {formatMinutes(mix.theoryMinutes)}
            </span>
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-accent-emphasis"></span>
              Questões: {formatMinutes(mix.questionsMinutes)}
            </span>
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-success-emphasis"></span>
              Revisões: {formatMinutes(mix.reviewsMinutes)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
