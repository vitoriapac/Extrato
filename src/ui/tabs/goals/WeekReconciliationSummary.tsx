import { formatPlanMinutes } from '../../../core/format-duration.js';
import { LedgerLine } from '../../primitives/ledger-line.js';
import type { WeekReconciliation } from './week-reconciliation.js';

// Formato único de duração do app (1h20, 2h, 48min), o mesmo do restante de Planejamento.
const fmt = formatPlanMinutes;

export function WeekReconciliationSummary({ data }: { data: WeekReconciliation }) {
  const multiple =
    data.multiple !== null && Math.round(data.multiple * 10) / 10 > 2 ? data.multiple : null;
  // Capacidade quase toda sem tarefa também merece o aviso, mesmo sem estudo extra.
  const lowCoverage =
    multiple === null &&
    data.plannedMin > 0 &&
    data.capacityMin > 0 &&
    data.plannedMin / data.capacityMin < 0.5;
  return (
    <section class="week-reconciliation" aria-label={`Conciliação da semana, ${data.periodLabel}`}>
      <p class="week-reconciliation__period">{data.periodLabel}</p>
      <LedgerLine label="Capacidade da semana" value={fmt(data.capacityMin)} />
      <LedgerLine
        label="Com tarefa marcada"
        hint="Semana inteira: inclui dias futuros"
        value={fmt(data.plannedMin)}
      />
      <LedgerLine
        label="Estudado até hoje"
        hint="Todas as provas"
        value={fmt(data.studiedMin)}
        total
      />
      <LedgerLine
        label="Estudo extra, sem tarefa marcada"
        hint="Estudado até hoje além do que tinha tarefa marcada"
        value={fmt(data.offPlanMin)}
      />
      {multiple !== null && (
        <p class="week-reconciliation__note">
          Você estudou {multiple.toFixed(1).replace('.', ',')}× o tempo com tarefa marcada: só{' '}
          {fmt(data.plannedMin)} dos {fmt(data.capacityMin)} de capacidade têm tarefa marcada.
        </p>
      )}
      {lowCoverage && (
        <p class="week-reconciliation__note">
          Só {fmt(data.plannedMin)} dos {fmt(data.capacityMin)} de capacidade têm tarefa marcada.
        </p>
      )}
    </section>
  );
}
