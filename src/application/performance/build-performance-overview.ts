import { addLocalDays, parseLocalDate } from '../../core/date-utils.js';
import { plannedMinutesForPlan } from '../goals/build-plan-execution.js';
import { buildStrategicExecution } from '../goals/build-strategic-execution.js';
import { compareReadinessSnapshots } from '../analytics/build-readiness-evolution.js';
import { readinessHistoryForScope } from '../analytics/readiness-history.js';

type Row = Record<string, any>;
type Range = { start: string; end: string };
const inRange = (date: string, range: Range) =>
  Boolean(date && range?.end && date <= range.end && (!range.start || date >= range.start));
const sum = (items: Row[], field: string) =>
  items.reduce((total: any, item: any) => total + Math.max(0, Number(item[field]) || 0), 0);
const round = (value: number) => Math.round(value * 10) / 10;
const weekStart = (date: string) => {
  const day = parseLocalDate(date)?.getDay();
  return day == null ? null : addLocalDays(date, -((day + 6) % 7));
};
const period = (range: Range, questions: Row[], sessions: Row[], plans: Row[]) => {
  if (!range) return null;
  const q = questions.filter((item: any) => inRange(item.date, range));
  const s = sessions.filter((item: any) => inRange(item.date, range));
  const p = plans.filter((item: any) => inRange(item.date, range));
  const resolved = sum(q, 'resolved'),
    correct = sum(q, 'correct');
  const plannedMinutes = p.reduce(
    (total: any, item: any) => total + plannedMinutesForPlan(item),
    0
  );
  const studiedMinutes = round(sum(s, 'durationSeconds') / 60);
  return {
    resolved,
    correct,
    accuracy: resolved ? round((correct / resolved) * 100) : null,
    studiedMinutes,
    plannedMinutes,
    adherence: plannedMinutes ? round((studiedMinutes / plannedMinutes) * 100) : null,
    sessionCount: s.length,
  };
};
const delta = (current: number | null, previous: number | null) =>
  current == null || previous == null ? null : round(current - previous);

export function buildPerformanceOverview({
  range,
  today,
  activeExamTags = [],
  readinessSnapshots = [],
  readiness = null,
  questions = [],
  sessions = [],
  dailyPlans = [],
  subjects = [],
}: any = {}) {
  const current = period(range, questions, sessions, dailyPlans);
  const previous = period(range?.previous, questions, sessions, dailyPlans);
  const history = readinessHistoryForScope(
    readinessSnapshots,
    activeExamTags,
    range?.start,
    range?.end
  );
  const prior = range?.previous
    ? readinessHistoryForScope(
        readinessSnapshots,
        activeExamTags,
        range.previous.start,
        range.previous.end
      ).at(-1)
    : null;
  const latest = history.at(-1) || null;
  // Never infer an old score from current records. Only saved snapshots are compared.
  const readinessComparison = compareReadinessSnapshots(prior, latest);
  const readinessDelta =
    range?.comparePrevious && readinessComparison.state === 'comparable'
      ? readinessComparison.delta
      : null;
  const weeks = new Map();
  for (const item of dailyPlans.filter((record: any) => inRange(record.date, range))) {
    const start = weekStart(item.date),
      row = weeks.get(start) || { start, plannedMinutes: 0, studiedMinutes: 0 };
    row.plannedMinutes += plannedMinutesForPlan(item);
    weeks.set(start, row);
  }
  for (const item of sessions.filter((record: any) => inRange(record.date, range))) {
    const start = weekStart(item.date),
      row = weeks.get(start) || { start, plannedMinutes: 0, studiedMinutes: 0 };
    row.studiedMinutes += (Number(item.durationSeconds) || 0) / 60;
    weeks.set(start, row);
  }
  const weekly = [...weeks.values()]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map(row => ({
      ...row,
      plannedMinutes: round(row.plannedMinutes),
      studiedMinutes: round(row.studiedMinutes),
      inProgress: addLocalDays(row.start, 6)! >= today,
    }));
  const strategic = range?.start
    ? buildStrategicExecution({
        start: range.start,
        end: range.end,
        today,
        dailyPlans,
        sessions,
        subjects,
      })
    : null;
  const changes = [];
  if (readinessDelta != null && readinessDelta !== 0)
    changes.push({
      label: 'Prontidão no último fechamento × período anterior',
      delta: readinessDelta,
      unit: Math.abs(readinessDelta) === 1 ? 'ponto' : 'pontos',
    });
  if (previous) {
    for (const [label, key, unit, available] of [
      [
        'Precisão em questões',
        'accuracy',
        'p.p.',
        current!.resolved >= 30 && previous.resolved >= 30,
      ],
      ['Questões resolvidas', 'resolved', 'questões', current!.resolved + previous.resolved > 0],
      [
        'Aderência de carga',
        'adherence',
        'p.p.',
        current!.plannedMinutes >= 60 && previous.plannedMinutes >= 60,
      ],
      [
        'Tempo estudado',
        'studiedMinutes',
        'min',
        current!.sessionCount + previous.sessionCount > 0,
      ],
    ]) {
      if (!available) continue;
      const value = delta((current as any)?.[key as string], (previous as any)[key as string]);
      if (value != null && value !== 0) changes.push({ label, delta: value, unit });
    }
  }
  return {
    current,
    previous,
    readiness,
    readinessDelta,
    readinessComparison,
    readinessPair: { previous: prior, current: latest },
    history,
    weekly,
    strategic,
    changes: changes.slice(0, 5),
  };
}
