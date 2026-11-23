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

interface ScoredSimulation extends ScoreCounts {
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

export interface MinimumMiss {
  subjectId: string;
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
