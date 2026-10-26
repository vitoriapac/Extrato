import { buildQuestionEvolution } from '../questions/build-question-evolution.js';
import { buildSubjectAccuracy } from '../analytics/build-subject-accuracy.js';

type Row = Record<string, any>;
const inRange = (date: string, range: { start: string; end: string }) =>
  Boolean(date && range?.end && date <= range.end && (!range.start || date >= range.start));
const total = (items: Row[]) =>
  items.reduce((sum: any, item: any) => sum + Math.max(0, Number(item.resolved) || 0), 0);
const correct = (items: Row[]) =>
  items.reduce(
    (sum: any, item: any) =>
      sum +
      Math.min(Math.max(0, Number(item.resolved) || 0), Math.max(0, Number(item.correct) || 0)),
    0
  );
const precision = (items: Row[]) =>
  total(items) ? Math.round((correct(items) / total(items)) * 1000) / 10 : null;
const difference = (before: number | null, after: number | null) =>
  before == null || after == null ? null : Math.round((after - before) * 10) / 10;

export function buildPerformanceSubjects({
  subjects = [],
  subjectId = null,
  range,
  today,
  period = '30',
  questions = [],
  sessions = [],
  reviews = [],
  simulations = [],
  blueprint = {},
  globalTarget = 80,
  metricsByTopic = {},
}: any = {}) {
  const subject = subjects.find((item: any) => item.id === subjectId) || subjects[0] || null;
  if (!subject)
    return { state: 'empty', subjects, subject: null as Row | null, topics: [] as Row[] };
  const id = subject.id,
    topicIds = new Set(
      (subject.topics || []).filter((item: any) => !item.archived).map((item: any) => item.id)
    );
  const owned = questions.filter(
    (item: any) => item.subjectId === id && topicIds.has(item.topicId)
  );
  const current = owned.filter((item: any) => inRange(item.date, range));
  const previous = range?.previous
    ? owned.filter((item: any) => inRange(item.date, range.previous))
    : [];
  const goal = buildSubjectAccuracy({
    subjects: [subject],
    questions: current,
    simulations: simulations.filter((item: any) => inRange(item.date, range)),
    blueprint,
    globalTarget,
  })[0];
  const periodEvolution = buildQuestionEvolution({
    questions: current,
    today,
    scope: 'subject',
    subjectId: id,
    period,
  });
  const topicRows = (subject.topics || [])
    .filter((item: any) => topicIds.has(item.id))
    .map((item: any) => {
      const now = current.filter((record: any) => record.topicId === item.id),
        before = previous.filter((record: any) => record.topicId === item.id);
      const recent = precision(now),
        prior = precision(before),
        sample = total(now),
        earlier = total(before),
        metric = metricsByTopic[item.id] || {};
      return {
        id: item.id,
        name: item.name,
        accuracy: recent,
        questions: sample,
        mastery: metric.mastery ?? null,
        retention: metric.retention ?? null,
        evidence: metric.evidence ?? null,
        delta:
          range?.comparePrevious && sample >= 10 && earlier >= 10
            ? difference(prior, recent)
            : null,
        state:
          sample < 10
            ? 'Amostra insuficiente'
            : recent! >= goal.target
              ? 'Na meta'
              : 'Abaixo da meta',
      };
    })
    .sort((a: any, b: any) => b.questions - a.questions || a.name.localeCompare(b.name, 'pt-BR'));
  const activity = {
    minutes: Math.round(
      sessions
        .filter((item: any) => item.subjectId === id && inRange(item.date, range))
        .reduce((sum: any, item: any) => sum + (Number(item.durationSeconds) || 0) / 60, 0)
    ),
    questions: total(current),
    reviews: reviews.filter(
      (item: any) =>
        item.subjectId === id && item.status === 'Concluído' && inRange(item.completedDate, range)
    ).length,
  };
  const measured = (key: string) =>
    topicRows.filter((row: any) => row[key] != null && (key !== 'mastery' || row.evidence > 0));
  const average = (key: string) => {
    const rows = measured(key);
    return rows.length
      ? Math.round(rows.reduce((sum: any, row: any) => sum + Number(row[key]), 0) / rows.length)
      : null;
  };
  return {
    state: 'ready',
    subjects,
    subject,
    goal,
    accuracy: goal.personal.accuracy,
    previousAccuracy: total(previous) >= 10 ? precision(previous) : null,
    trend:
      range?.comparePrevious && total(current) >= 10 && total(previous) >= 10
        ? difference(precision(previous), precision(current))
        : null,
    mastery: average('mastery'),
    retention: average('retention'),
    masteryEvidence: measured('mastery').length,
    retentionEvidence: measured('retention').length,
    activity,
    evolution: periodEvolution,
    topics: topicRows,
  };
}
