/**
 * Modo iniciante de Desempenho: até haver registro suficiente, as abas analíticas (Disciplinas, Diagnóstico
 * e Provas) mostram um estado vazio que diz quando ficam úteis. Visão geral e Ritmo ficam sempre completas.
 * Registro suficiente = pelo menos 30 questões pessoais OU pelo menos 2 semanas desde o primeiro registro.
 */
export const BEGINNER_QUESTION_LIMIT = 30;
export const BEGINNER_DAYS_LIMIT = 14;

export interface BeginnerAssessment {
  beginner: boolean;
  questionCount: number;
  /** Dias desde o primeiro registro (sessão ou questão); 0 sem nenhum registro. */
  recordDays: number;
}

type Row = Record<string, any>;
const dayNumber = (iso: unknown) => {
  const time = Date.parse(`${String(iso ?? '').slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(time) ? time / 86_400_000 : null;
};

export function assessBeginner({
  questions = [],
  sessions = [],
  today,
}: {
  questions?: Row[];
  sessions?: Row[];
  today: string;
}): BeginnerAssessment {
  const questionCount = questions.reduce(
    (sum, item) => sum + Math.max(0, Number(item.resolved) || 0),
    0
  );
  const first = [...questions, ...sessions]
    .map(item => dayNumber(item.date ?? item.startedAt))
    .filter((day): day is number => day !== null)
    .reduce<number | null>((min, day) => (min === null || day < min ? day : min), null);
  const now = dayNumber(today);
  const recordDays = first === null || now === null ? 0 : Math.max(0, Math.round(now - first));
  return {
    beginner: questionCount < BEGINNER_QUESTION_LIMIT && recordDays < BEGINNER_DAYS_LIMIT,
    questionCount,
    recordDays,
  };
}
