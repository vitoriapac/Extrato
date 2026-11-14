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
      <LedgerLine
        label="Capacidade da semana"
        hint="Soma da disponibilidade dos 7 dias"
        value={fmt(data.capacityMin)}
      />
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
      {data.linkedMin !== null && data.unlinkedMin !== null ? (
        <>
          <LedgerLine label="Vinculado a atividades desta semana" hint="Tempo registrado, inclusive acima do previsto" value={fmt(data.linkedMin)} />
          <LedgerLine label="Sem vínculo com atividade" value={fmt(data.unlinkedMin)} />
          {data.incompatibleMin > 0 && <LedgerLine label="Vínculo incompatível ou inativo" value={fmt(data.incompatibleMin)} />}
          {data.otherPeriodMin > 0 && <LedgerLine label="Vinculado a outro período" value={fmt(data.otherPeriodMin)} />}
          {data.classifiedStudyMin !== null && Math.round(data.classifiedStudyMin) !== Math.round(data.studiedMin) && (
            <p class="week-reconciliation__note">A análise de vínculos considera {fmt(data.classifiedStudyMin)} em sessões únicas, com data de execução válida; o total acima usa as datas registradas nas sessões.</p>
          )}
        </>
      ) : <p class="week-reconciliation__note">Detalhamento dos vínculos indisponível.</p>}
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
