import { resolveSubjectAccuracyTarget } from '../../domain/analytics/subject-accuracy-target.js';
const summarize = (records: Array<Record<string, any>>, totalKey: string) => {
  const total = records.reduce(
    (sum: any, item: any) => sum + Math.max(0, Number(item[totalKey]) || 0),
    0
  );
  const correct = records.reduce(
    (sum: any, item: any) =>
      sum +
      Math.min(Math.max(0, Number(item[totalKey]) || 0), Math.max(0, Number(item.correct) || 0)),
    0
  );
  return { total, accuracy: total ? Math.round((correct / total) * 1000) / 10 : null };
};
export function buildSubjectAccuracy({
  subjects = [],
  questions = [],
  simulations = [],
  blueprint = {},
  globalTarget = 80,
}: any = {}) {
  return subjects.map((subject: any) => {
    const target = resolveSubjectAccuracyTarget(subject.id, blueprint, globalTarget);
    const personal = summarize(
      questions.filter((item: any) => item.subjectId === subject.id),
      'resolved'
    );
    const simulation = summarize(
      simulations
        .flatMap((item: any) => item.breakdown || [])
        .filter((row: any) => (row.subjectId || row.subjectRef) === subject.id),
      'total'
    );
    const withGap = (sample: Record<string, any>) => ({
      ...sample,
      gap: sample.accuracy == null ? null : Math.round((sample.accuracy - target) * 10) / 10,
      state:
        sample.total < 10
          ? 'insufficient'
          : sample.accuracy >= target
            ? 'on_target'
            : 'below_target',
    });
    return {
      subjectId: subject.id,
      name: subject.name,
      target,
      inherited:
        blueprint.subjects?.find((item: any) => item.subjectId === subject.id)?.accuracyTarget ==
        null,
      personal: withGap(personal),
      simulation: withGap(simulation),
    };
  });
}

const dayNumber = (iso: string) => Date.parse(`${String(iso).slice(0, 10)}T00:00:00Z`) / 86_400_000;

/**
 * Accuracy per subject in consecutive 7-day windows ending today (oldest first);
 * a window without questions is null. One pass over the questions for all subjects.
 */
export function buildSubjectWeeklyAccuracy(
  questions: Array<Record<string, any>> = [],
  today: string,
  weeks = 8
) {
  const end = dayNumber(today);
  const sums = new Map<string, Array<{ resolved: number; correct: number }>>();
  for (const item of questions) {
    const age = end - dayNumber(item.date);
    if (!(age >= 0 && age < weeks * 7) || !item.subjectId) continue;
    const resolved = Math.max(0, Number(item.resolved) || 0);
    if (!resolved) continue;
    let rows = sums.get(item.subjectId);
    if (!rows) sums.set(item.subjectId, (rows = Array.from({ length: weeks }, () => ({ resolved: 0, correct: 0 }))));
    const week = rows[weeks - 1 - Math.floor(age / 7)];
    week.resolved += resolved;
    week.correct += Math.min(resolved, Math.max(0, Number(item.correct) || 0));
  }
  const result = new Map<string, Array<number | null>>();
  for (const [subjectId, rows] of sums)
    result.set(
      subjectId,
      rows.map(row => (row.resolved ? Math.round((row.correct / row.resolved) * 100) : null))
    );
  return result;
}
