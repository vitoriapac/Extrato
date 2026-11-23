export interface SubjectPart {
  subjectId: string | null;
  value: number;
}

interface BlueprintSubjectPoints {
  subjectId: string | null;
  expectedQuestions?: number | null;
  questionWeight?: number | null;
}

/** Pontos que a disciplina vale na prova: questões previstas × peso por questão. */
export function subjectExamPoints(config: BlueprintSubjectPoints | undefined): number {
  if (!config) return 0;
  const questions = Math.max(0, Number(config.expectedQuestions) || 0);
  const weight = Math.max(0, Number(config.questionWeight ?? 1) || 0);
  return questions * weight;
}

/**
 * Média dos valores por disciplina, pesada pelos pontos de cada uma na prova.
 * Devolve null quando nenhuma disciplina das partes tem pontos no edital.
 */
export function blueprintWeightedMean(
  parts: SubjectPart[],
  subjects: BlueprintSubjectPoints[] | null | undefined
): number | null {
  const points = new Map<string, number>();
  (subjects || []).forEach(item => {
    if (item.subjectId) points.set(item.subjectId, subjectExamPoints(item));
  });
  const weights = parts.map(part => (part.subjectId && points.get(part.subjectId)) || 0);
  if (!weights.some(weight => weight > 0)) return null;
  const configured = [...points.values()].filter(weight => weight > 0);
  // shortcut: disciplina sem pontos no edital pesa como a média das configuradas; trocar se o edital passar a ser obrigatório.
  const fallback = configured.reduce((sum, weight) => sum + weight, 0) / configured.length;
  const effective = weights.map(weight => weight || fallback);
  const total = effective.reduce((sum, weight) => sum + weight, 0);
  return parts.reduce((sum, part, index) => sum + part.value * effective[index], 0) / total;
}
