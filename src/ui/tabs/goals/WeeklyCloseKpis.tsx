import { formatDateBR } from '../../../core/format-date.js';
import { formatDecimal } from '../../../core/format-number.js';

export function WeeklyCloseKpis({
  model,
  formatMinutes,
}: {
  model: Record<string, any>;
  formatMinutes: (value: number) => string;
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

  return (
    <>
      {summary && period?.evaluatedEnd && (
        <p class="analytics-note">
          Aderência de {formatDateBR(period.start)} até {formatDateBR(period.evaluatedEnd)}
          {scope && ` · ${scope}`}. Dias futuros não entram nestes indicadores.
        </p>
      )}
      <section class="weekly-kpis" aria-label="Resultado da semana">
        <div>
          <strong>{planned == null ? '—' : formatMinutes(planned)}</strong>
          <span>Planejado</span>
        </div>
        <div>
          <strong>{formatMinutes(executed)}</strong>
          <span>Realizado</span>
        </div>
        <div>
          <strong>{credit == null ? '—' : `${formatDecimal(credit)}%`}</strong>
          <span>{summary ? 'Crédito ao plano' : 'Volume de carga'}</span>
        </div>
      </section>
      {summary && Number(planned) > 0 && Number(executed) > 0 && Number(credit) === 0 && (
        <p class="analytics-note">
          Sessões sem vínculo com as tarefas planejadas entram no tempo realizado, mas não geram
          crédito ao plano.
        </p>
      )}
    </>
  );
}
