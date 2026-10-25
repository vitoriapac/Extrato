import type { JSX } from 'preact';

export interface TodayExecutionSummaryProps {
  availableMinutesFormatted: string;
  plannedMinutesFormatted: string;
  executedMinutesFormatted: string;
  dateFormatted: string;
  progressPercent: number | null;
}

export function TodayExecutionSummary({
  availableMinutesFormatted,
  plannedMinutesFormatted,
  executedMinutesFormatted,
  dateFormatted,
  progressPercent,
}: TodayExecutionSummaryProps): JSX.Element {
  const progressLabel =
    progressPercent === null
      ? 'Plano diário ainda não montado'
      : `${progressPercent}% do plano executado`;

  return (
    <section
      class="study-plan-summary today-execution-summary"
      aria-label="Resumo de execução de hoje"
    >
      <div>
        <strong>{availableMinutesFormatted}</strong>
        <span>Disponível hoje</span>
      </div>
      <div>
        <strong>{plannedMinutesFormatted}</strong>
        <span>Planejado</span>
      </div>
      <div>
        <strong>{executedMinutesFormatted}</strong>
        <span>Executado</span>
      </div>
      <div class="today-execution-progress">
        <div>
          <span>
            {dateFormatted} · {progressLabel}
          </span>
          {progressPercent !== null && <strong>{progressPercent}%</strong>}
        </div>
        <progress
          max={100}
          value={progressPercent ?? 0}
          aria-label={progressLabel}
          hidden={progressPercent === null}
        />
      </div>
    </section>
  );
}
