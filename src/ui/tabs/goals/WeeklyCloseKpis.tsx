import { formatDateBR } from '../../../core/format-date.js';
import { formatDecimal } from '../../../core/format-number.js';
import { weekSummaryParts } from './WeekReconciliationSummary.js';
import type { WeekReconciliation } from './week-reconciliation.js';

export function WeeklyCloseKpis({
  model,
  formatMinutes,
  reconciliation,
}: {
  model: Record<string, any>;
  formatMinutes: (value: number) => string;
  /** Mesma conciliação do Resumo da semana; sem ela, o retrato antigo mantém os três números. */
  reconciliation?: WeekReconciliation | null;
}) {
  const adherenceModel = model.adherence?.model;
  const summary = adherenceModel?.summary;
  const period = adherenceModel?.period;
  const planned = summary?.plannedMinutes ?? model.investment?.plannedMinutes;
  const executed = summary?.executedMinutes ?? model.investment?.executedMinutes ?? 0;
  const credit = summary ? summary.temporalAdherence : model.investment?.adherence;
  const scope = Array.isArray(adherenceModel?.activeExamTags)
    ? adherenceModel.activeExamTags.length
      ? 'provas ativas'
      : 'todas as provas'
    : null;
  const unlinkedStudy =
    summary && Number(planned) > 0 && Number(executed) > 0 && Number(credit) === 0;
  const note = unlinkedStudy && (
    <p class="analytics-note">
      Estudo avulso, sem ligação com as tarefas marcadas, entra no tempo estudado, mas não conta na
      aderência ao plano: estudar fora do plano não é perder tempo de estudo.
      {reconciliation && (
        <>
          {' '}
          <button
            type="button"
            class="btn ghost small"
            data-delegated-click="openWeeklyAdherencePlanning()"
          >
            Marcar o restante do plano
          </button>
        </>
      )}
    </p>
  );
  const cutoff = summary && period?.evaluatedEnd && (
    <p class="analytics-note">
      Aderência de {formatDateBR(period.start)} até {formatDateBR(period.evaluatedEnd)}
      {scope && ` · ${scope}`}. Dias futuros não entram nestes indicadores.
    </p>
  );

  if (reconciliation) {
    // O detalhe da conciliação (barra de saldo, ledger) mora em Plano da semana: aqui só a leitura em uma linha.
    const sentence = weekSummaryParts(reconciliation);
    return (
      <>
        {note}
        <section class="weekly-close-line" aria-label="Resumo da semana">
          <p class="weekly-close-line__period">{reconciliation.periodLabel}</p>
          {sentence && (
            <p class="weekly-close-line__sentence">
              {sentence.before}
              <strong>{sentence.hero}</strong>
              {sentence.after}
            </p>
          )}
          <p class="weekly-close-adherence">
            <span>Aderência ao plano · semana</span>
            <strong>{credit == null ? '—' : `${formatDecimal(credit)}%`}</strong>
          </p>
        </section>
        {cutoff}
      </>
    );
  }

  return (
    <>
      {cutoff}
      <section class="weekly-kpis" aria-label="Resultado da semana">
        <div>
          <strong>{planned == null ? '—' : formatMinutes(planned)}</strong>
          <span>Com tarefa marcada</span>
        </div>
        <div>
          <strong>{formatMinutes(executed)}</strong>
          <span>Estudado</span>
        </div>
        <div>
          <strong>{credit == null ? '—' : `${formatDecimal(credit)}%`}</strong>
          <span>{summary ? 'Aderência ao plano · semana' : 'Volume de carga'}</span>
        </div>
      </section>
      {note}
    </>
  );
}
