import { formatDecimal } from '../../core/format-number.js';
import { formatDateBR } from '../../core/format-date.js';
import { formatPlanMinutes } from '../../core/format-duration.js';

/** Volume estudado sobre o previsto: percentual até 2×, depois "N,N×" (o mesmo corte do Resumo da semana). */
export function volumeLabel(percent: number | null | undefined): string {
  if (percent == null) return '—';
  return percent > 200
    ? `${formatDecimal(Math.round(percent / 10) / 10)}× o previsto`
    : `${formatDecimal(percent)}% do previsto`;
}

/** Tempo prioritário com o recorte dito: o Fechamento só avalia os dias até hoje; a Semana, a semana inteira. */
export function priorityMinutesLabel(
  executed: number,
  planned: number,
  evaluatedEnd?: string | null
): string {
  const cut = evaluatedEnd
    ? `dias até ${formatDateBR(evaluatedEnd).slice(0, 5)}`
    : 'período avaliado';
  return `${formatPlanMinutes(executed)} de ${formatPlanMinutes(planned)} prioritárias (${cut})`;
}

/** Duração no formato único do app; ausência vira "—". */
export const planMin = (value: number | null | undefined): string =>
  value == null ? '—' : formatPlanMinutes(value);

/** Variação de duração com sinal (+1h20, −45min). */
export function planMinDelta(value: number | null | undefined): string {
  if (value == null) return 'Sem base comparável';
  const rounded = Math.round(Number(value) || 0);
  return (rounded > 0 ? '+' : rounded < 0 ? '−' : '') + formatPlanMinutes(Math.abs(rounded));
}
