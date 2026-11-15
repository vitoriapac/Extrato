/** Tópicos por semana necessários para concluir o que falta até a prova; null sem prazo válido. */
export function neededTopicsPerWeek(
  remaining: number,
  daysToExam: number | null | undefined
): number | null {
  const days = Number(daysToExam);
  if (!Number.isFinite(days) || days <= 0 || !(Number(remaining) > 0)) return null;
  return Number(remaining) / (days / 7);
}

export interface RhythmGoalWarning {
  kind: 'goal-below' | 'late';
  goal: number | null;
  needed: number | null;
}

/**
 * Aviso do ritmo: a meta semanal de tópicos fica abaixo do necessário, ou o ritmo atual termina depois
 * da prova. A meta abaixo do necessário tem prioridade porque é a que a pessoa pode mudar.
 */
export function buildRhythmGoalWarning(input: {
  goal: number | null | undefined;
  remaining: number;
  daysToExam: number | null | undefined;
  comparativo?: string | null;
}): RhythmGoalWarning | null {
  const needed = neededTopicsPerWeek(input.remaining, input.daysToExam);
  const goal =
    input.goal == null || !Number.isFinite(Number(input.goal)) ? null : Number(input.goal);
  if (needed != null && goal != null && goal > 0 && goal < needed)
    return { kind: 'goal-below', goal, needed };
  if (input.comparativo === 'atrasado') return { kind: 'late', goal, needed };
  return null;
}
