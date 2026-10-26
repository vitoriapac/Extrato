import { historicalExecutionItem } from './plan-execution-snapshot.js';
import { localDateFromTimestamp } from '../sessions/study-session.js';
import { parseLocalDate } from '../../core/date-utils.js';

type Row = Record<string, any>;

export const EXCLUDED_DAILY_STATUSES = new Set(['skipped', 'replaced', 'discarded', 'deferred']);
export const dailyActivityType = (type: string | null | undefined) =>
  type === 'theory' || type === 'prerequisite' ? 'study' : type || 'study';
export const sessionMatchesDailyItem = (session: Row, item: Row | null | undefined) => {
  if (!item) return false;
  const frozen = historicalExecutionItem(item);
  return (
    (!frozen.subjectId || session.subjectId === frozen.subjectId) &&
    (!frozen.topicId || session.topicId === frozen.topicId) &&
    (!frozen.type || dailyActivityType(session.type) === dailyActivityType(frozen.type))
  );
};
export const executionDate = (session: Row) =>
  typeof session.date === 'string' && parseLocalDate(session.date)
    ? session.date
    : localDateFromTimestamp(session.endedAt || session.startedAt || session.createdAt);
export const executionSeconds = (value: unknown) =>
  Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
export function executionCredit(
  plannedSeconds: unknown,
  workedSeconds: unknown,
  previousSeconds: unknown = 0
) {
  const planned = executionSeconds(plannedSeconds),
    worked = executionSeconds(workedSeconds),
    previous = executionSeconds(previousSeconds);
  const creditedSeconds = Math.min(Math.max(0, planned - Math.min(planned, previous)), worked);
  return {
    creditedSeconds,
    excessSeconds: worked - creditedSeconds,
    remainingSeconds: Math.max(0, planned - previous - worked),
  };
}
// Untyped callers pass `any`; the default keeps their items open instead of narrowing to Row.
export function indexExecutionItems<T extends Row = any>(items: T[] = []) {
  const counts = new Map<string, number>(),
    links = new Map<string, Set<string>>();
  for (const item of items) {
    counts.set(item.id, (counts.get(item.id) || 0) + 1);
    for (const id of item.sessionIds || []) {
      const refs = links.get(id) || new Set<string>();
      refs.add(item.id);
      links.set(id, refs);
    }
  }
  const eligible = items.filter(item => item.id && counts.get(item.id) === 1),
    byId = new Map(eligible.map(item => [item.id, item]));
  return {
    eligible,
    byId,
    ambiguousItemCount: items.length - eligible.length,
    resolve(session: Row) {
      const refs = links.get(session.id);
      return session.planItemId || (refs?.size === 1 ? [...refs][0] : null);
    },
  };
}
