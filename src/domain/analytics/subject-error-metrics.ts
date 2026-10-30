/**
 * Métricas de taxa de erro e inatividade recente agregadas por disciplina.
 *
 * Camada: Domain (sem dependências de DOM, Preact ou storage).
 */

export interface SubjectQuestionItem {
  subjectId?: string | null;
  resolved?: number | null;
  correct?: number | null;
  [key: string]: any;
}

export interface SimulationBreakdownItem {
  subjectId?: string | null;
  total?: number | null;
  correct?: number | null;
  [key: string]: any;
}

export interface SimulationItem {
  breakdown?: SimulationBreakdownItem[];
  [key: string]: any;
}

/**
 * Calcula a taxa percentual de erro (0 a 100%) em questões e simulados
 * para uma disciplina específica, arredondada para uma casa decimal.
 */
export function calculateSubjectErrorRate(
  subjectId: string,
  questions: SubjectQuestionItem[],
  simulations: SimulationItem[],
  resolveEntitySubjectId: (item: Record<string, any>) => string | null
): number {
  let total = 0;
  let correct = 0;

  questions
    .filter(q => resolveEntitySubjectId(q) === subjectId)
    .forEach(q => {
      total += Number(q.resolved) || 0;
      correct += Number(q.correct) || 0;
    });

  simulations.forEach(sim => {
    (sim.breakdown || [])
      .filter(b => resolveEntitySubjectId(b) === subjectId)
      .forEach(b => {
        total += Number(b.total) || 0;
        correct += Number(b.correct) || 0;
      });
  });

  if (total === 0) return 0;
  return Math.round((1 - correct / total) * 1000) / 10;
}

export interface LatestActivityInputs {
  subjectId: string;
  topicHistoryDates: Array<string | null | undefined>;
  questionDates: Array<string | null | undefined>;
  calendarDates: Array<string | null | undefined>;
  reviewDates: Array<string | null | undefined>;
  sessionDates: Array<string | null | undefined>;
}

/**
 * Identifica a data civil mais recente em que houve atividade registrada na disciplina.
 */
export function findSubjectLatestActivityDate(inputs: LatestActivityInputs): string | null {
  const allDates: string[] = [
    ...inputs.topicHistoryDates,
    ...inputs.questionDates,
    ...inputs.calendarDates,
    ...inputs.reviewDates,
    ...inputs.sessionDates,
  ].filter((d): d is string => Boolean(d));

  if (allDates.length === 0) return null;

  return allDates.reduce(
    (latest, current) => (!latest || current > latest ? current : latest),
    allDates[0]
  );
}

/**
 * Calcula a quantidade de dias transcorridos desde o último estudo da disciplina.
 */
export function calculateDaysSinceSubjectStudy(
  lastActivityDate: string | null,
  daysToTargetDate: (targetDate: string) => number | null
): number {
  if (!lastActivityDate) return 0;
  const d = daysToTargetDate(lastActivityDate);
  return d !== null ? Math.max(0, -d) : 21;
}
