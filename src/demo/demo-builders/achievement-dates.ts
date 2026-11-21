interface Session { date?: string; topicId?: string }
interface Feedback { date?: string; completed?: boolean; outcome?: { state?: string; measuredAt?: string } }
interface Exam { date?: string }
interface Topic { id: string; examImportance?: number }
interface DemoState {
  studySessions?: Session[];
  recommendationFeedback?: Feedback[];
  exams?: Exam[];
  subjects?: Array<{ topics?: Topic[] }>;
}

const dateOf = (value: unknown): string | null =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;

const dayNumber = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

/** Primeiro dia em que uma sequência de `length` dias seguidos com sessão se completa. */
function streakCompletionDate(sessionDates: string[], length: number): string | null {
  const days = [...new Set(sessionDates)].sort();
  let run = 0;
  for (let index = 0; index < days.length; index++) {
    run = index > 0 && dayNumber(days[index]) - dayNumber(days[index - 1]) === 1 ? run + 1 : 1;
    if (run >= length) return days[index];
  }
  return null;
}

const nth = (dates: Array<string | null>, n: number) => {
  const sorted = dates.filter((item): item is string => Boolean(item)).sort();
  return sorted.length >= n ? sorted[n - 1] : null;
};

/**
 * Datas das conquistas que o app não infere do histórico (sequências, recomendações, estratégicas).
 * A demo controla seus dados, então grava a data real em vez de "desbloqueada antes de hoje" (T22).
 * Só devolve as que o histórico da demo cumpre.
 */
export function buildDemoAchievementUnlocks(state: DemoState): Record<string, { unlockedAt: string; source: 'migrated' }> {
  const sessions = state.studySessions || [];
  const feedback = state.recommendationFeedback || [];
  const exams = state.exams || [];
  const topics = new Map<string, Topic>(
    (state.subjects || []).flatMap(subject =>
      (subject.topics || []).map(topic => [topic.id, topic] as const)
    )
  );

  const firstStudyByTopic = new Map<string, string>();
  for (const session of sessions) {
    const date = dateOf(session.date);
    if (!date || !session.topicId) continue;
    const previous = firstStudyByTopic.get(session.topicId);
    if (!previous || date < previous) firstStudyByTopic.set(session.topicId, date);
  }
  const highImpactDates = [...firstStudyByTopic.entries()]
    .filter(([id]) => Number(topics.get(id)?.examImportance) >= 0.75)
    .map(([, date]) => date);

  const completedFeedback = feedback.filter(item => item.completed);
  const found: Record<string, string | null> = {
    streak3: streakCompletionDate(sessions.map(item => dateOf(item.date) || ''), 3),
    streak7: streakCompletionDate(sessions.map(item => dateOf(item.date) || ''), 7),
    recommendation1: nth(completedFeedback.map(item => dateOf(item.date)), 1),
    recommendationPositive: nth(
      feedback
        .filter(item => item.outcome?.state === 'positive')
        .map(item => dateOf(item.outcome?.measuredAt) || dateOf(item.date)),
      1
    ),
    strategist: nth(highImpactDates, 10),
    mappedExam: nth(exams.map(item => dateOf(item.date)), 4),
  };
  return Object.fromEntries(
    Object.entries(found)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([id, unlockedAt]) => [id, { unlockedAt, source: 'migrated' as const }])
  );
}
