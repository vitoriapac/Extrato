import { LedgerLine } from '../../primitives/ledger-line.js';
import type { WeekReconciliation } from './week-reconciliation.js';

const fmt = (value: number) => {
  const m = Math.round(value);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
};

export function WeekReconciliationSummary({ data }: { data: WeekReconciliation }) {
  const multiple =
    data.multiple !== null && Math.round(data.multiple * 10) / 10 > 2 ? data.multiple : null;
  return (
    <section class="week-reconciliation" aria-label={`Conciliação da semana, ${data.periodLabel}`}>
      <p class="week-reconciliation__period">{data.periodLabel}</p>
      <p class="week-reconciliation__note">
        <a href="#metasPlanning">Ir para as ações do plano semanal</a>
      </p>
      <LedgerLine label="Capacidade" value={fmt(data.capacityMin)} />
      <LedgerLine label="Distribuído nos dias" value={fmt(data.plannedMin)} />
      <LedgerLine
        label="Realizado acima do distribuído"
        value={fmt(data.offPlanMin)}
        tone={data.offPlanMin > 0 ? 'positive' : 'neutral'}
      />
      <LedgerLine label="Realizado" value={fmt(data.studiedMin)} total />
      <p class="week-reconciliation__note">
        Distribuído cobre a semana inteira e inclui dias futuros. Realizado soma as sessões até
        hoje, em todas as provas.
      </p>
      {multiple !== null && (
        <p class="week-reconciliation__note">
          Você estudou {multiple.toFixed(1).replace('.', ',')}× o tempo distribuído nos dias: só{' '}
          {fmt(data.plannedMin)} dos {fmt(data.capacityMin)} de capacidade têm tarefa marcada.{' '}
          <a href="#metasPlanning">Distribuir a semana nos dias</a>
        </p>
      )}
    </section>
  );
}
