/**
 * retention-simulator.ts
 * Cálculo didático puro da Curva do Esquecimento (Ebbinghaus) e do ganho
 * da repetição espaçada no StudyTrack.
 */

export interface EbbinghausSimulationResult {
  days: number;
  withReviews: boolean;
  retentionPct: number;
  decayStage: 'critical' | 'declining' | 'consolidated';
  stageLabel: string;
  stageDescription: string;
  reviewPoints: number[];
  retainedPointsEstimate: number;
}

export const SCHEDULED_REVIEW_DAYS: readonly number[] = Object.freeze([1, 7, 21]);

/**
 * Calcula a retenção estimada de acordo com o dia decorrido e a presença de revisões programadas.
 *
 * Sem revisão, a retenção decai exponencialmente para ~15% após 30 dias.
 * Com revisões programadas em D+1, D+7 e D+21, a retenção estabiliza acima de 85%.
 */
export function calculateEbbinghausRetention(
  days: number,
  withReviews: boolean
): EbbinghausSimulationResult {
  const boundedDays = Math.max(0, Math.min(30, Math.round(Number(days) || 0)));

  const noReviewRetention = boundedDays === 0
    ? 100
    : Math.max(8, Math.round(100 / (1 + 0.32 * Math.pow(boundedDays, 0.9))));

  let retentionPct = noReviewRetention;

  if (withReviews) {
    if (boundedDays === 0) {
      retentionPct = 100;
    } else if (boundedDays < 1) {
      retentionPct = Math.round(100 - boundedDays * 20);
    } else if (boundedDays < 7) {
      const daysSince = boundedDays - 1;
      retentionPct = Math.round(96 - daysSince * 1.8);
    } else if (boundedDays < 21) {
      const daysSince = boundedDays - 7;
      retentionPct = Math.round(94 - daysSince * 0.5);
    } else {
      const daysSince = boundedDays - 21;
      retentionPct = Math.round(92 - daysSince * 0.3);
    }
    retentionPct = Math.max(0, Math.min(100, retentionPct));
  }

  let decayStage: 'critical' | 'declining' | 'consolidated' = 'critical';
  let stageLabel = 'Crítico — esquecimento iminente';
  let stageDescription =
    'A maior parte dos detalhes já foi perdida. Releitura quase total será necessária.';

  if (retentionPct >= 80) {
    decayStage = 'consolidated';
    stageLabel = 'Excelente — memória de longo prazo';
    stageDescription =
      'Conceitos e detalhes consolidados. Reativação rápida ao resolver questões.';
  } else if (retentionPct >= 50) {
    decayStage = 'declining';
    stageLabel = 'Atenção — declínio da retenção';
    stageDescription =
      'A ideia geral permanece, mas detalhes essenciais e pegadinhas de prova começam a se perder.';
  }

  return {
    days: boundedDays,
    withReviews,
    retentionPct,
    decayStage,
    stageLabel,
    stageDescription,
    reviewPoints: [...SCHEDULED_REVIEW_DAYS],
    retainedPointsEstimate: noReviewRetention,
  };
}
