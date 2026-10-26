import { historicalExecutionItem } from '../../domain/planning/plan-execution-snapshot.js';
import {
  EXCLUDED_DAILY_STATUSES,
  sessionMatchesDailyItem,
  executionDate as dateOf,
  executionSeconds as seconds,
  executionCredit,
  indexExecutionItems,
} from '../../domain/planning/execution-contract.js';
export {
  EXCLUDED_DAILY_STATUSES,
  dailyActivityType,
  sessionMatchesDailyItem,
} from '../../domain/planning/execution-contract.js';
import { classifyEvidenceScope, indexExamTopics } from '../../domain/exams/exam-evidence-scope.js';
import { normalizeExamTags, isTopicInExamScope } from '../../domain/exams/exam-scope.js';

type Row = Record<string, any>;
const scopeKey = (tags: unknown) => JSON.stringify(normalizeExamTags(tags));

export function dailyItemEligible(item: Row, subjects: Row[], activeExamTags: string[]) {
  if (EXCLUDED_DAILY_STATUSES.has(item.status) || item.archived) return false;
  const subject = subjects.find((row: any) => row.id === item.subjectId);
  if (!subject || subject.archived) return false;
  const topic = subject.topics?.find((row: any) => row.id === item.topicId);
  return (
    !item.topicId || Boolean(topic && !topic.archived && isTopicInExamScope(topic, activeExamTags))
  );
}

// A session needs an explicit, unambiguous link and matching activity to credit a task.
export function reconcileDailyExecution({
  today,
  dailyPlans = [],
  sessions = [],
  subjects = [],
  activeExamTags = [],
}: any = {}) {
  const plans = dailyPlans.filter(
    (plan: any) =>
      plan.date === today &&
      (!Array.isArray(plan.activeExamTags) ||
        scopeKey(plan.activeExamTags) === scopeKey(activeExamTags))
  );
  const items = plans.flatMap((plan: any) =>
    (plan.items || [])
      .filter((item: any) => dailyItemEligible(item, subjects, activeExamTags))
      .map((item: any) => ({
        ...structuredClone(historicalExecutionItem(item)),
        dailyPlanId: plan.id,
        date: today,
      }))
  );
  const globalIndex = indexExecutionItems(dailyPlans.flatMap((plan: any) => plan.items || []));
  const { eligible, byId, resolve } = indexExecutionItems(
    items.filter((item: any) => globalIndex.byId.has(item.id))
  );
  const ambiguousItemCount = items.length - eligible.length;
  const execution = new Map(
    eligible.map(item => [
      item.id,
      { todaySeconds: 0, previousSeconds: 0, mismatchedSeconds: 0, sessionIds: [] as string[] },
    ])
  );
  const seen = new Set(),
    todaySessions = [];
  let studiedSeconds = 0,
    additionalSeconds = 0,
    mismatchedSeconds = 0;
  const topicIndex = indexExamTopics(subjects);
  for (const session of sessions) {
    if (session.id && seen.has(session.id)) continue;
    if (session.id) seen.add(session.id);
    const date = dateOf(session),
      duration = seconds(session.durationSeconds);
    if (
      !date ||
      date > today ||
      !classifyEvidenceScope(session, subjects, activeExamTags, topicIndex).includedInExamMetrics
    )
      continue;
    const current = date === today;
    if (current) {
      studiedSeconds += duration;
      todaySessions.push({ ...structuredClone(session), date });
    }
    const id = resolve(session),
      item = byId.get(id);
    const matches = sessionMatchesDailyItem(session, item);
    if (!matches) {
      if (current) {
        if (id) {
          mismatchedSeconds += duration;
          if (item) execution.get(id)!.mismatchedSeconds += duration;
        } else additionalSeconds += duration;
      }
      continue;
    }
    const row = execution.get(id);
    row![current ? 'todaySeconds' : 'previousSeconds'] += duration;
    if (session.id) row!.sessionIds.push(session.id);
  }
  const reconciled = eligible.map(item => {
    const row = execution.get(item.id),
      plannedSeconds = seconds(item.plannedMinutes) * 60,
      credit = executionCredit(plannedSeconds, row!.todaySeconds, row!.previousSeconds),
      creditedToday = credit.creditedSeconds;
    const remainingSeconds = credit.remainingSeconds;
    return {
      ...item,
      plannedMinutes: plannedSeconds / 60,
      executedSeconds: row!.previousSeconds + row!.todaySeconds,
      executedTodaySeconds: row!.todaySeconds,
      creditedTodaySeconds: creditedToday,
      remainingSeconds,
      mismatchedSeconds: row!.mismatchedSeconds,
      sessionIds: row!.sessionIds,
      status:
        remainingSeconds === 0
          ? 'completed'
          : row!.previousSeconds + row!.todaySeconds > 0
            ? 'partial'
            : 'planned',
    };
  });
  return {
    items: reconciled,
    todaySessions,
    hasPlan: plans.length > 0,
    ambiguousItemCount,
    studiedSeconds,
    additionalSeconds,
    mismatchedSeconds,
  };
}
