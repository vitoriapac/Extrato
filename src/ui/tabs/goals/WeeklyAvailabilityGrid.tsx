import type { JSX } from 'preact';

export interface WeeklyAvailabilitySummary {
  totalMinutes: number;
  activeDays: number;
  averageHours: number;
  state?: string;
}

export interface DayGoalItem {
  dayIndex: number;
  label: string;
  isToday: boolean;
  hours: number | string;
}

export interface WeeklyAvailabilityGridProps {
  summary: WeeklyAvailabilitySummary;
  formattedTotal: string;
  formattedAverage: string;
  formattedToday: string;
  days: DayGoalItem[];
}

export function WeeklyAvailabilityGrid({
  summary,
  formattedTotal,
  formattedAverage,
  formattedToday,
  days,
}: WeeklyAvailabilityGridProps): JSX.Element {
  return (
    <>
      <div class="weekly-availability-summary">
        <div>
          <strong>{formattedTotal}</strong>
          <span>disponíveis por semana</span>
        </div>
        <div>
          <strong>{summary.activeDays}</strong>
          <span>dias com estudo</span>
        </div>
        <div>
          <strong>{formattedAverage}</strong>
          <span>média por dia ativo</span>
        </div>
        <div>
          <strong>{formattedToday}</strong>
          <span>disponíveis hoje</span>
        </div>
      </div>

      {summary.state === 'empty' && (
        <p class="availability-warning">
          Defina ao menos um dia para habilitar recomendações e planejamento.
        </p>
      )}

      <div class="weekday-goal-actions">
        <button
          type="button"
          class="btn ghost small"
          data-delegated-click="applyTodayGoalToAllDays()"
        >
          Aplicar hoje a todos
        </button>
        <button type="button" class="btn ghost small" data-delegated-click="clearWeekendGoals()">
          Limpar fim de semana
        </button>
      </div>

      <div class="weekday-goals">
        {days.map(d => (
          <label key={d.dayIndex} class={`weekday-goal ${d.isToday ? 'today' : ''}`}>
            <span>
              {d.label}
              {d.isToday ? ' · hoje' : ''}
            </span>
            <div>
              <input
                type="number"
                min="0"
                max="24"
                step="0.25"
                value={d.hours}
                data-delegated-blur={`updateMetaHoursDay(${d.dayIndex},this.value)`}
                aria-label={`Disponibilidade em horas de ${d.label}`}
              />
              <small>h</small>
            </div>
          </label>
        ))}
      </div>
    </>
  );
}
