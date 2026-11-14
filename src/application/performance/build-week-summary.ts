import { formatReadableMinutes } from './build-weekly-performance-brief.js';

type Row = Record<string, any>;

export type WeekSummaryCase =
  | 'no_study'
  | 'normal'
  | 'above_plan'
  | 'below_plan'
  | 'small_sample'
  | 'no_plan';

export interface WeekSummary {
  periodLabel: string;
  kind: WeekSummaryCase;
  /** De uma a três frases curtas: o que você fez, um sinal, a ação (a mesma da Leitura). */
  paragraphs: string[];
}

const MIN_QUESTIONS = 30;

/**
 * Resumo dos últimos 7 dias da Visão geral. Regras determinísticas, sem IA: o mesmo estado gera o mesmo
 * texto. No máximo três números no texto todo; a ação é a da Leitura, citada pelo nome.
 */
export function buildWeekSummary({
  brief = null,
  nextBestAction = null,
}: {
  brief?: Row | null;
  nextBestAction?: Row | null;
} = {}): WeekSummary | null {
  const week = brief?.current;
  if (!brief || !week) return null;
  const action = nextBestAction?.action
    ? `A próxima ação é ${nextBestAction.topicName}${nextBestAction.subjectName ? ` (${nextBestAction.subjectName})` : ''}, em Hoje.`
    : 'A próxima ação está em Hoje.';

  if (!brief.hasActivity)
    return {
      periodLabel: brief.periodLabel,
      kind: 'no_study',
      paragraphs: [`Nenhuma sessão nos últimos 7 dias. ${action}`],
    };

  const hasPlan = week.plannedMinutes > 0 && week.planFulfillmentPct != null;
  const pct = hasPlan ? Number(week.planFulfillmentPct) : null;
  const planClause = !hasPlan
    ? ''
    : pct! > 110
      ? ', mais do que o plano previa'
      : pct! < 80
        ? ', menos do que o plano previa'
        : ', perto do que o plano previa';
  const days = week.activeDays === 1 ? '1 dia' : `${week.activeDays} dias`;
  const done = `Você estudou ${formatReadableMinutes(week.studiedMinutes)} em ${days}${planClause}.`;

  const enoughQuestions = week.resolved >= MIN_QUESTIONS;
  const signal = enoughQuestions
    ? `A precisão em questões foi ${week.accuracy}%.`
    : week.resolved > 0
      ? 'Poucas questões na semana (menos de 30): leia a precisão como indício.'
      : '';
  const noPlan = hasPlan ? '' : 'Sem plano ativo nesta semana, o ritmo fica sem referência.';

  const kind: WeekSummaryCase = !hasPlan
    ? 'no_plan'
    : !enoughQuestions
      ? 'small_sample'
      : pct! > 110
        ? 'above_plan'
        : pct! < 80
          ? 'below_plan'
          : 'normal';
  // Pouca evidência: a frase diz isso e o sinal de precisão some. Sem plano, a nota ocupa o lugar do sinal.
  const second = noPlan || signal;
  return {
    periodLabel: brief.periodLabel,
    kind,
    paragraphs: [done, ...(second ? [second] : []), action],
  };
}
