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

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
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

  // Balanço de minutos do dia (metáfora de extrato: Disponível - Executado)
  const remainingMinutes = Math.max(0, validAvailable - validExecuted);
  const remainingFormatted = formatMinutes(remainingMinutes);

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
      label: 'Livre',
      value: flexMinutes,
      tone: 'empty',
    });
  }

  const hasStackedData = stackedParts.length > 0 && (validPlanned > 0 || validExecuted > 0);

  return (
    <section
      class={`today-statement-summary today-execution-summary${goalMet ? ' is-goal-met' : ''}`}
      aria-label="Resumo de execução de hoje"
    >
      <header class="today-statement-header">
        <h3 class="today-statement-title">Extrato do Dia</h3>
        <span class="today-statement-date">{dateFormatted}</span>
      </header>

      <div class="today-statement-ledger">
        <div class="today-ledger-row">
          <span class="today-ledger-label">Disponível hoje</span>
          <strong class="today-ledger-value">{availableMinutesFormatted}</strong>
        </div>
        <div class="today-ledger-row">
          <span class="today-ledger-label">Planejado</span>
          <strong class="today-ledger-value">{plannedMinutesFormatted}</strong>
        </div>
        <div class="today-ledger-row">
          <span class="today-ledger-label">Executado</span>
          <strong class="today-ledger-value">{executedMinutesFormatted}</strong>
        </div>
        {validAvailable > 0 && (
          <div class="today-ledger-row today-ledger-row--balance">
            <span class="today-ledger-label">Saldo do dia</span>
            <strong class="today-ledger-value">{remainingFormatted}</strong>
          </div>
        )}
      </div>

      <div class="today-execution-progress">
        {progressPercent !== null && (
          <RingGauge
            value={progressPercent}
            label="Progresso do plano de hoje"
            size={40}
            stroke={6}
            showValue={false}
          />
        )}
        <div class="today-execution-progress-text">
          {progressPercent === null ? (
            <p class="today-progress-status">
              Plano diário ainda não montado · Defina suas atividades para iniciar
            </p>
          ) : (
            <p class="today-progress-status">
              <strong>
                {executedMinutesFormatted} de {plannedMinutesFormatted}
              </strong>{' '}
              · {progressPercent}% do plano executado
            </p>
          )}
          {goalMet && (
            <p class="today-goal-met" role="status">
              <Icon name="circle-check" size={16} class="icon-inline" />
              <span>
                <strong>Plano do dia cumprido</strong> · Meta de tempo alcançada
              </span>
            </p>
          )}
        </div>
      </div>

      {hasStackedData && (
        <div class="today-execution-budget-track" aria-label="Distribuição do orçamento de tempo">
          <StackedBar parts={stackedParts} label="Distribuição do tempo de hoje" unit="min" />
        </div>
      )}
    </section>
  );
}
