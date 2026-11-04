import type { JSX } from 'preact';
import { RingGauge, StackedBar, type StackedBarPart } from '../../primitives/charts/charts.js';
import { Icon } from '../../primitives/icon.js';

export interface TodayExecutionSummaryProps {
  availableMinutesFormatted: string;
  plannedMinutesFormatted: string;
  executedMinutesFormatted: string;
  dateFormatted: string;
  progressPercent: number | null;
  availableMinutes?: number;
  plannedMinutes?: number;
  executedMinutes?: number;
}

export function TodayExecutionSummary({
  availableMinutesFormatted,
  plannedMinutesFormatted,
  executedMinutesFormatted,
  dateFormatted,
  progressPercent,
  availableMinutes,
  plannedMinutes,
  executedMinutes,
}: TodayExecutionSummaryProps): JSX.Element {
  const goalMet = progressPercent !== null && progressPercent >= 100;

  const validAvailable = Math.max(0, Number(availableMinutes) || 0);
  const validPlanned = Math.max(0, Number(plannedMinutes) || 0);
  const validExecuted = Math.max(0, Number(executedMinutes) || 0);

  const stackedParts: StackedBarPart[] = [];
  if (validExecuted > 0) {
    stackedParts.push({
      label: 'Executado',
      value: validExecuted,
      tone: 'primary',
    });
  }
  const remainingPlanned = Math.max(0, validPlanned - validExecuted);
  if (remainingPlanned > 0) {
    stackedParts.push({
      label: 'A realizar',
      value: remainingPlanned,
      tone: 'secondary',
    });
  }
  const flexMinutes = Math.max(0, validAvailable - Math.max(validPlanned, validExecuted));
  if (flexMinutes > 0) {
    stackedParts.push({
      label: 'Flexível',
      value: flexMinutes,
      tone: 'empty',
    });
  }

  const hasStackedData = stackedParts.length > 0 && (validPlanned > 0 || validExecuted > 0);

  return (
    <section
      class={`study-plan-summary today-execution-summary${goalMet ? ' is-goal-met' : ''}`}
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
        {goalMet && (
          <p class="today-goal-met" role="status">
            <Icon name="circle-check" size={14} class="icon-inline" />
            Plano do dia cumprido
          </p>
        )}
      </div>
      {hasStackedData && (
        <div class="today-execution-budget-track" aria-label="Distribuição do orçamento de tempo">
          <StackedBar parts={stackedParts} label="Distribuição do tempo de hoje" unit="min" />
        </div>
      )}
    </section>
  );
}
