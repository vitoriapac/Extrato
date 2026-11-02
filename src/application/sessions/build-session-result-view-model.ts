export function buildSessionResultViewModel(
  session: Record<string, any>,
  nextPriority: Record<string, any> | null | undefined,
  priorityChanged: boolean,
  {
    subjectName,
    topicName,
    formatMinutes,
    day = null,
    planNext = null,
    outcome = null,
    formatDate = (iso: string) => iso,
  }: any = {}
) {
  const typeLabels: Record<string, string> = {
    study: 'Estudo teórico',
    review: 'Revisão',
    questions: 'Questões',
    simulation: 'Simulado',
  };
  const subject = session.subjectId ? subjectName(session.subjectId) : 'Sem disciplina';
  const topic = session.topicId ? topicName(session.topicId) : null;
  const questions =
    session.questionsResolved > 0
      ? {
          resolved: session.questionsResolved,
          correct: session.correctAnswers,
          accuracy: Math.round((session.correctAnswers / session.questionsResolved) * 100),
        }
      : null;
  const minutes = Math.round(session.durationSeconds / 60);
  // Today's statement moves only when the day progress before and after the save is known.
  // A session too short to credit a whole minute posts what was actually done instead of "+0min".
  const changed = (before: unknown, after: unknown) =>
    before === after ? null : { before, after };
  const seconds = `${Math.max(0, Math.round(Number(session.durationSeconds) || 0))} s`,
    duration = minutes > 0 ? formatMinutes(minutes) : seconds;
  const credit =
    minutes > 0
      ? `+${duration}`
      : questions
        ? `+${questions.resolved} ${questions.resolved === 1 ? 'questão' : 'questões'}`
        : `+${seconds}`;
  const ledger =
    day?.before && day?.after
      ? {
          credit,
          detail: minutes === 0 && questions ? `${questions.accuracy}% de acerto` : null,
          studied: changed(
            formatMinutes(Math.round(day.before.studiedMinutes)),
            formatMinutes(Math.round(day.after.studiedMinutes))
          ),
          plan:
            day.after.progress == null
              ? null
              : changed(`${day.before.progress ?? 0}%`, `${day.after.progress}%`),
          completed:
            day.after.completedActivities > day.before.completedActivities
              ? { done: day.after.completedActivities, total: day.total }
              : null,
        }
      : null;
  return {
    type: typeLabels[session.type] || 'Sessão',
    subject,
    topic,
    questions,
    ledger,
    effects: sessionEffects(outcome, formatDate, day, formatMinutes),
    duration,
    // A pending plan item is the next step; the engine's pick is only a suggestion when it points elsewhere.
    plan: planNext
      ? {
          label: `${planNext.subjectName || 'Disciplina'} — ${planNext.topicName || 'Sem tópico'} · ${formatMinutes(Math.ceil(planNext.remainingSeconds / 60))}`,
          suggestion:
            nextPriority &&
            !(
              nextPriority.subjectId === planNext.subjectId &&
              nextPriority.topicId === planNext.topicId
            )
              ? `${nextPriority.subjectName} — ${nextPriority.topicName}`
              : null,
        }
      : null,
    next:
      !planNext && nextPriority
        ? {
            label: `${nextPriority.subjectName} — ${nextPriority.topicName} · ${formatMinutes(nextPriority.estimatedMinutes)}`,
            changed: Boolean(priorityChanged),
          }
        : null,
    simulation: session.type === 'simulation',
  };
}

/** What the save changed beyond today's statement: readiness and reviews it scheduled. */
function sessionEffects(
  outcome: any,
  formatDate: (iso: string) => string,
  day: any,
  formatMinutes: (minutes: number) => string
) {
  if (!outcome) return null;
  const planned = Number(day?.after?.plannedMinutes) || 0;
  const goal = planned
    ? `${formatMinutes(Math.round(day.after.studiedMinutes))} de ${formatMinutes(planned)}${day.after.studiedMinutes >= planned ? ' · cumprida' : ''}`
    : null;
  const { before, after } = outcome.readiness || {};
  const readiness =
    after == null
      ? null
      : before == null
        ? { text: `${after}/100`, delta: null }
        : { text: `${before} → ${after}/100`, delta: after - before };
  const dates: string[] = outcome.reviewDates || [];
  const reviews = dates.length
    ? {
        count: dates.length,
        text: `${dates.length} ${dates.length === 1 ? 'revisão' : 'revisões'} · próxima em ${formatDate(dates[0])}`,
      }
    : null;
  return readiness || reviews || goal ? { readiness, reviews, goal } : null;
}
