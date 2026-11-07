import type { JSX } from 'preact';
import { RingGauge, StackedBar, type StackedBarPart } from '../../primitives/charts/charts.js';
import { Icon } from '../../primitives/icon.js';
import { LedgerLine } from '../../primitives/ledger-line.js';
import { buildDayReconciliation } from './day-reconciliation.js';

export interface TodayExecutionSummaryProps {
  availableMinutesFormatted: string;
  plannedMinutesFormatted: string;
  executedMinutesFormatted: string;
  dateFormatted: string;
  progressPercent: number | null;
  availableMinutes?: number;
  plannedMinutes?: number;
  executedMinutes?: number;
  planCompletedMinutes?: number;
  planRemainingMinutes?: number;
  needsPlanReview?: boolean;
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
  plannedMinutesFormatted,
  executedMinutesFormatted,
  dateFormatted,
  progressPercent,
  availableMinutes,
  plannedMinutes,
  executedMinutes,
  planCompletedMinutes,
  planRemainingMinutes,
  needsPlanReview = false,
}: TodayExecutionSummaryProps): JSX.Element {
  const goalMet = progressPercent !== null && progressPercent >= 100;

  const validAvailable = Math.max(0, Number(availableMinutes) || 0);
  const validPlanned = Math.max(0, Number(plannedMinutes) || 0);
  const validExecuted = Math.max(0, Number(executedMinutes) || 0);

  const reconciliation = buildDayReconciliation({ available: validAvailable, planned: validPlanned, executed: validExecuted });

  const stackedParts: StackedBarPart[] = [];
  if (validExecuted > 0) {
    stackedParts.push({
      label: 'Executado',
      value: validExecuted,
      tone: 'primary',
    });
  }
  const remainingPlanned = planRemainingMinutes ?? Math.max(0, validPlanned - validExecuted);
  if (remainingPlanned > 0) {
    stackedParts.push({
      label: 'A realizar',
      value: remainingPlanned,
      tone: 'secondary',
    });
  }
  const flexMinutes = Math.max(0, validAvailable - validExecuted - remainingPlanned);
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

      {progressPercent !== null && (
        <div class="today-statement-ledger">
          {reconciliation.rows.map((row) => (
            <LedgerLine
              key={row.key}
              label={row.label}
              value={row.key === 'overrun' ? `−${formatMinutes(row.minutes)}` : formatMinutes(row.minutes)}
              tone={row.key === 'overrun' ? 'negative' : 'neutral'}
              total={row.key === 'overrun' || row.key === 'free'}
            />
          ))}
        </div>
      )}
      {needsPlanReview && <p class="context-note context-note--info">Há atividades preservadas que não estão vinculadas ao plano semanal atual. Confira a distribuição em Planejamento.</p>}
      {progressPercent !== null && reconciliation.status !== 'within' && (
        <p class="today-progress-status">
          {reconciliation.status === 'over'
            ? `O plano passa ${reconciliation.overrunMinutes} min da sua disponibilidade. `
            : 'Sem disponibilidade declarada para hoje. '}
          <a href="#planejamento/semana">Ajustar o dia</a>
        </p>
      )}

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
                {planCompletedMinutes == null ? executedMinutesFormatted : formatMinutes(planCompletedMinutes)} de {plannedMinutesFormatted}
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
