export interface ObjectiveScoreBand {
  low: number;
  central: number;
  high: number;
}

export interface GradedEssayLike {
  kind?: string;
  essayStatus?: string | null;
  essayScore?: number | null;
  essayMaxScore?: number | null;
  date?: string | null;
}

export interface CompositeScoreProjectionInput {
  objectiveBand: ObjectiveScoreBand | null | undefined;
  essayRecords?: GradedEssayLike[];
  essayMaxScore?: number | null;
  essayWeightPercent?: number | null;
  essayMinPercent?: number | null;
}

export interface CompositeScoreProjectionResult {
  available: boolean;
  reason?: string;
  objectiveWeightPercent: number;
  essayWeightPercent: number;
  essayAveragePercent: number | null;
  gradedEssaysCount: number;
  belowEssayMinimum: boolean;
  compositeBand: ObjectiveScoreBand | null;
}

const clamp100 = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

/**
 * Combina a faixa projetada da prova objetiva com a média recente das discursivas corrigidas
 * quando o edital configura peso percentual para a etapa discursiva.
 */
export function buildCompositeScoreProjection({
  objectiveBand,
  essayRecords = [],
  essayMaxScore = null,
  essayWeightPercent = null,
  essayMinPercent = null,
}: CompositeScoreProjectionInput): CompositeScoreProjectionResult {
  const rawWeight = Number(essayWeightPercent);
  const essayW =
    Number.isFinite(rawWeight) && rawWeight > 0 && rawWeight < 100 ? rawWeight : 0;
  const objW = 100 - essayW;

  if (!objectiveBand || essayW <= 0) {
    return {
      available: false,
      reason: 'Projeção composta requer faixa objetiva e peso da discursiva configurados.',
      objectiveWeightPercent: objW,
      essayWeightPercent: essayW,
      essayAveragePercent: null,
      gradedEssaysCount: 0,
      belowEssayMinimum: false,
      compositeBand: null,
    };
  }

  const graded = (essayRecords || [])
    .filter(item => {
      if (item.kind && item.kind !== 'essay') return false;
      if (item.essayStatus && item.essayStatus !== 'graded') return false;
      const score = Number(item.essayScore);
      const max = Number(item.essayMaxScore ?? essayMaxScore);
      return Number.isFinite(score) && score >= 0 && Number.isFinite(max) && max > 0;
    })
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 5);

  if (!graded.length) {
    return {
      available: false,
      reason: 'Aguardando discursivas corrigidas para calcular a nota composta.',
      objectiveWeightPercent: objW,
      essayWeightPercent: essayW,
      essayAveragePercent: null,
      gradedEssaysCount: 0,
      belowEssayMinimum: false,
      compositeBand: null,
    };
  }

  const avgEssayPct =
    graded.reduce((sum, item) => {
      const max = Number(item.essayMaxScore ?? essayMaxScore);
      return sum + (Number(item.essayScore) / max) * 100;
    }, 0) / graded.length;

  const roundedEssayAvg = clamp100(avgEssayPct);
  const minPct = Number(essayMinPercent);
  const belowEssayMinimum = Number.isFinite(minPct) && minPct > 0 && roundedEssayAvg < minPct;

  const combine = (objValue: number) =>
    clamp100((objValue * objW + roundedEssayAvg * essayW) / 100);

  return {
    available: true,
    objectiveWeightPercent: objW,
    essayWeightPercent: essayW,
    essayAveragePercent: roundedEssayAvg,
    gradedEssaysCount: graded.length,
    belowEssayMinimum,
    compositeBand: {
      low: combine(objectiveBand.low),
      central: combine(objectiveBand.central),
      high: combine(objectiveBand.high),
    },
  };
}
