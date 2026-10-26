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
