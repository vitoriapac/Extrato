export interface QuestionGoalShare {
  id: string;
  meta: number;
}

/**
 * Reparte `total` questões por semana entre as metas atuais, proporcionalmente (método do maior resto).
 * Cada meta fica com no mínimo 1; metas zeradas ficam de fora.
 * Devolve null quando não dá para fechar a soma (sem metas, total inválido ou total menor que o número de metas).
 */
export function splitQuestionGoal(
  goals: QuestionGoalShare[],
  total: number
): Map<string, number> | null {
  const active = goals.filter(goal => Number(goal.meta) > 0);
  const target = Math.floor(Number(total));
  const sum = active.reduce((acc, goal) => acc + Number(goal.meta), 0);
  if (!active.length || !(target >= active.length) || !(sum > 0)) return null;

  const rows = active.map(goal => {
    const exact = (Number(goal.meta) * target) / sum;
    return {
      id: goal.id,
      meta: Number(goal.meta),
      share: Math.max(1, Math.floor(exact)),
      frac: exact % 1,
    };
  });
  let diff = target - rows.reduce((acc, row) => acc + row.share, 0);
  // Sobra: um a mais para quem tem a maior fração. Falta (por causa do mínimo de 1): tira das maiores metas.
  const byFraction = [...rows].sort((a, b) => b.frac - a.frac || b.meta - a.meta);
  const byMeta = [...rows].sort((a, b) => b.meta - a.meta);
  for (let i = 0; diff > 0; i = (i + 1) % byFraction.length, diff--) byFraction[i]!.share++;
  for (let i = 0; diff < 0; i = (i + 1) % byMeta.length) {
    if (byMeta.every(row => row.share === 1)) return null;
    if (byMeta[i]!.share > 1) {
      byMeta[i]!.share--;
      diff++;
    }
  }
  return new Map(rows.map(row => [row.id, row.share]));
}
