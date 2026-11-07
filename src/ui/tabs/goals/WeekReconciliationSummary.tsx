import { LedgerLine } from '../../primitives/ledger-line.js';
import type { WeekReconciliation } from './week-reconciliation.js';

const fmt = (value: number) => `${Math.floor(value / 60)}h${String(Math.round(value) % 60).padStart(2, '0')}`;

export function WeekReconciliationSummary({ data }: { data: WeekReconciliation }) {
  const multiple = data.multiple !== null && data.multiple > 2 ? data.multiple : null;
  return (
    <section class="week-reconciliation" aria-label={`Conciliação da semana, ${data.periodLabel}`}>
      <p class="week-reconciliation__period">{data.periodLabel}</p>
      <LedgerLine label="Capacidade" value={fmt(data.capacityMin)} />
      <LedgerLine label="Planejado nos dias" value={fmt(data.plannedMin)} />
      <LedgerLine label="Estudo fora do plano" value={fmt(data.offPlanMin)} tone={data.offPlanMin > 0 ? 'positive' : 'neutral'} />
      <LedgerLine label="Realizado" value={fmt(data.studiedMin)} total />
      {multiple !== null && (
        <p class="week-reconciliation__note">
          Você estudou {multiple.toFixed(1).replace('.', ',')}× o planejado. O plano está curto.{' '}
          <a href="#metasPlanning">Distribuir a capacidade</a>
        </p>
      )}
    </section>
  );
}
