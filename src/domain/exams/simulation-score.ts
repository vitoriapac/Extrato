import type { ExamBlockConfig } from '../../core/types.ts';

/**
 * Nota de simulado. Em prova "Certo ou errado" (Cebraspe) cada erro anula um acerto e a
 * questão em branco vale zero: nota líquida = (acertos − erros) ÷ total.
 */
export type SimulationScoring = 'padrao' | 'certo-errado';

export interface ScoreCounts {
  correct?: unknown;
  total?: unknown;
  wrong?: unknown;
}

export interface WeightedBlueprintSubject {
  subjectId: string | null;
  questionWeight?: number | null;
  minScore?: number | null;
  blockId?: string | null;
}

export interface ScoredSimulation extends ScoreCounts {
  scoring?: string | null;
  breakdown?: Array<ScoreCounts & { subjectId?: string | null }> | null;
}

const count = (value: unknown) => Math.max(0, Math.floor(Number(value) || 0));

/** Erradas declaradas; sem o campo, toda questão não acertada conta como errada (nenhuma em branco). */
export function wrongCount(counts: ScoreCounts): number {
  const total = count(counts.total);
  const correct = Math.min(count(counts.correct), total);
  const declared =
    counts.wrong == null || counts.wrong === '' ? total - correct : count(counts.wrong);
  return Math.min(declared, total - correct);
}

export function blankCount(counts: ScoreCounts): number {
  const total = count(counts.total);
  return total - Math.min(count(counts.correct), total) - wrongCount(counts);
}

/** Percentual de 0 a 100; 0 sem questões. */
export function scorePercent(counts: ScoreCounts, scoring?: string | null): number {
  const total = count(counts.total);
  if (!total) return 0;
  const correct = Math.min(count(counts.correct), total);
  const points = scoring === 'certo-errado' ? correct - wrongCount(counts) : correct;
  // shortcut: nota líquida negativa vira 0 para caber nos gráficos de 0 a 100; mostrar o negativo se alguém pedir.
  return (Math.max(0, points) / total) * 100;
}

/** Totais do simulado: a soma das disciplinas, quando há detalhamento, ou os campos do próprio simulado. */
export function simulationTotals(sim: ScoredSimulation): {
  correct: number;
  total: number;
  wrong: number;
} {
  const rows = sim.breakdown?.length ? sim.breakdown : [sim];
  return rows.reduce<{ correct: number; total: number; wrong: number }>(
    (acc, row) => {
      const total = count(row.total);
      acc.total += total;
      acc.correct += Math.min(count(row.correct), total);
      acc.wrong += wrongCount(row);
      return acc;
    },
    { correct: 0, total: 0, wrong: 0 }
  );
}

export function simulationScore(sim: ScoredSimulation): number {
  return scorePercent(simulationTotals(sim), sim.scoring);
}

function subjectWeightMap(blueprintSubjects: WeightedBlueprintSubject[] = []): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of blueprintSubjects || []) {
    if (!item?.subjectId) continue;
    const rawWeight = item.questionWeight == null ? 1 : Number(item.questionWeight);
    map.set(item.subjectId, Number.isFinite(rawWeight) ? Math.max(0, rawWeight) : 1);
  }
  return map;
}

/**
 * Nota percentual do simulado ponderada pelos pesos do edital (`questionWeight`) quando há breakdown.
 * Sem detalhamento ou pesos configurados, delega exatamente para `simulationScore(sim)`.
 */
export function weightedSimulationScore(
  sim: ScoredSimulation,
  blueprintSubjects: WeightedBlueprintSubject[] = []
): number {
  const rows = sim.breakdown?.length ? sim.breakdown : [];
  if (!rows.length) return simulationScore(sim);
  const weights = subjectWeightMap(blueprintSubjects);
  if (!weights.size) return simulationScore(sim);

  let weightedPoints = 0;
  let weightedTotal = 0;
  for (const row of rows) {
    const total = count(row.total);
    if (!total) continue;
    const weight = row.subjectId && weights.has(row.subjectId) ? weights.get(row.subjectId)! : 1;
    if (weight <= 0) continue;
    const correct = Math.min(count(row.correct), total);
    const points = sim.scoring === 'certo-errado' ? correct - wrongCount(row) : correct;
    weightedPoints += points * weight;
    weightedTotal += total * weight;
  }

  if (weightedTotal <= 0) return simulationScore(sim);
  return (Math.max(0, weightedPoints) / weightedTotal) * 100;
}

export interface MinimumMiss {
  subjectId: string;
  score: number;
  minimum: number;
}

export interface BlockMinimumMiss {
  blockId: string;
  blockName: string;
  score: number;
  minimum: number;
}

/** Disciplinas do simulado abaixo do mínimo eliminatório configurado na prova. */
export function subjectsBelowMinimum(
  sim: ScoredSimulation,
  blueprintSubjects: Array<{ subjectId: string | null; minScore?: number | null }> = []
): MinimumMiss[] {
  const minimums = new Map(
    blueprintSubjects
      .filter(item => item.subjectId && item.minScore != null && Number(item.minScore) > 0)
      .map(item => [item.subjectId as string, Number(item.minScore)])
  );
  if (!minimums.size) return [];
  const bySubject = new Map<string, { correct: number; total: number; wrong: number }>();
  for (const row of sim.breakdown || []) {
    if (!row.subjectId || !minimums.has(row.subjectId) || !count(row.total)) continue;
    const acc = bySubject.get(row.subjectId) || { correct: 0, total: 0, wrong: 0 };
    const total = count(row.total);
    acc.total += total;
    acc.correct += Math.min(count(row.correct), total);
    acc.wrong += wrongCount(row);
    bySubject.set(row.subjectId, acc);
  }
  return [...bySubject]
    .map(([subjectId, totals]) => ({
      subjectId,
      score: scorePercent(totals, sim.scoring),
      minimum: minimums.get(subjectId)!,
    }))
    .filter(item => item.score < item.minimum);
}

export function blocksBelowMinimum(
  sim: ScoredSimulation,
  blocks: ExamBlockConfig[] = [],
  blueprintSubjects: WeightedBlueprintSubject[] = []
): BlockMinimumMiss[] {
  const activeBlocks = (blocks || []).filter(
    block => block?.id && block.minScore != null && Number(block.minScore) > 0
  );
  if (!activeBlocks.length || !sim.breakdown?.length) return [];

  const subjectMeta = new Map<string, { blockId: string; weight: number }>();
  for (const item of blueprintSubjects || []) {
    if (!item?.subjectId || !item.blockId) continue;
    const rawWeight = item.questionWeight == null ? 1 : Number(item.questionWeight);
    const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;
    subjectMeta.set(item.subjectId, { blockId: item.blockId, weight });
  }
  if (!subjectMeta.size) return [];

  const byBlock = new Map<string, { weightedPoints: number; weightedTotal: number }>();
  for (const row of sim.breakdown || []) {
    const total = count(row.total);
    if (!row.subjectId || !total) continue;
    const meta = subjectMeta.get(row.subjectId);
    if (!meta) continue;
    const correct = Math.min(count(row.correct), total);
    const points = sim.scoring === 'certo-errado' ? correct - wrongCount(row) : correct;
    const acc = byBlock.get(meta.blockId) || { weightedPoints: 0, weightedTotal: 0 };
    acc.weightedPoints += points * meta.weight;
    acc.weightedTotal += total * meta.weight;
    byBlock.set(meta.blockId, acc);
  }

  const misses: BlockMinimumMiss[] = [];
  for (const block of activeBlocks) {
    const acc = byBlock.get(block.id);
    if (!acc || acc.weightedTotal <= 0) continue;
    const minimum = Number(block.minScore);
    const score = (Math.max(0, acc.weightedPoints) / acc.weightedTotal) * 100;
    if (score < minimum) {
      misses.push({
        blockId: block.id,
        blockName: block.name || block.id,
        score,
        minimum,
      });
    }
  }
  return misses;
}

interface PacedSimulation extends ScoredSimulation {
  durationMinutes?: unknown;
  guessed?: unknown;
  guessedCorrect?: unknown;
}

/**
 * Minutos por questão que a prova permite: (duração − reserva para discursiva/gabarito) ÷ questões previstas.
 * Null sem duração ou sem total de questões.
 */
export function examMinutesPerQuestion(
  blueprint?: {
    durationMinutes?: number | null;
    overheadMinutes?: number | null;
    subjects?: Array<{ expectedQuestions?: unknown }> | null;
  } | null
): number | null {
  const questions = (blueprint?.subjects || []).reduce(
    (sum, item) => sum + Math.max(0, Number(item.expectedQuestions) || 0),
    0
  );
  const minutes = Number(blueprint?.durationMinutes);
  const overhead = Math.max(0, Number(blueprint?.overheadMinutes) || 0);
  const netMinutes = minutes > overhead ? minutes - overhead : minutes;
  return netMinutes > 0 && questions > 0 ? Math.round((netMinutes / questions) * 10) / 10 : null;
}

export interface PaceAndGuess {
  /** Minutos por questão da prova (tempo gasto ÷ total); null sem tempo registrado. */
  minutesPerQuestion: number | null;
  /** Minutos por questão que a prova real permite; null sem configuração. */
  examMinutesPerQuestion: number | null;
  guessed: number;
  guessedCorrect: number;
  /** Pontos percentuais que os chutes somaram à nota (negativo: custaram); null sem chutes registrados. */
  guessGain: number | null;
}

/** Ritmo e chutes do simulado, com os chutes limitados às questões respondidas. */
export function paceAndGuess(sim: PacedSimulation, examPace: number | null = null): PaceAndGuess {
  const totals = simulationTotals(sim);
  const minutes = Number(sim.durationMinutes);
  const guessed = Math.min(count(sim.guessed), totals.correct + totals.wrong);
  const guessedCorrect = Math.min(count(sim.guessedCorrect), guessed, totals.correct);
  // Sem os chutes, essas questões ficariam em branco: saem dos acertos e das erradas.
  const withoutGuesses = {
    total: totals.total,
    correct: totals.correct - guessedCorrect,
    wrong: totals.wrong - (guessed - guessedCorrect),
  };
  return {
    minutesPerQuestion: minutes > 0 && totals.total > 0 ? minutes / totals.total : null,
    examMinutesPerQuestion: examPace,
    guessed,
    guessedCorrect,
    guessGain:
      sim.guessed == null || sim.guessed === '' || !totals.total
        ? null
        : scorePercent(totals, sim.scoring) - scorePercent(withoutGuesses, sim.scoring),
  };
}
