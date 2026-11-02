import type { JSX } from 'preact';
import { RingGauge } from '../../primitives/charts/charts.js';

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
        {/* Without a plan there is nothing to fill, so the ring is left out instead of drawn empty. */}
        {progressPercent !== null && (
          <RingGauge value={progressPercent} label="Progresso do plano de hoje" size={44} stroke={7} showValue={false} />
        )}
        <p>
          {progressPercent === null ? (
            <>{dateFormatted} · Plano diário ainda não montado</>
          ) : (
            <>
              <strong>
                {executedMinutesFormatted} de {plannedMinutesFormatted}
              </strong>{' '}
              · {progressPercent}% do plano executado · {dateFormatted}
            </>
          )}
        </p>
      </div>
    </section>
  );
}
