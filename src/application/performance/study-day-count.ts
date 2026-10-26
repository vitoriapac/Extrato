import { addLocalDays, parseLocalDate } from '../../core/date-utils.js';

export function countStudyDaysInRange(
  sessions: Array<Record<string, any>> = [],
  { start = null, end = null }: any = {}
) {
  const dates = new Set();
  for (const session of sessions) {
    const date = session?.date;
    if (typeof date !== 'string' || !parseLocalDate(date) || Number(session?.durationSeconds) <= 0)
      continue;
    if ((start && date < start) || (end && date > end)) continue;
    dates.add(date);
  }
  return dates.size;
}

export function countStudyDaysThisWeek(sessions: Array<Record<string, any>> = [], today: string) {
  const day = parseLocalDate(today);
  if (!day) return 0;
  const monday = addLocalDays(today, -((day.getDay() + 6) % 7));
  return countStudyDaysInRange(sessions, { start: monday, end: today });
}
