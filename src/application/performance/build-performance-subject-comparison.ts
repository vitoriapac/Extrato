import { buildSubjectAccuracy } from '../analytics/build-subject-accuracy.js';

type Row = Record<string, any>;
const inRange = (date: string, range: { start: string; end: string }) =>
  Boolean(date && range?.end && date <= range.end && (!range.start || date >= range.start));
const rounded = (value: number) => Math.round(value * 10) / 10;
export const PERFORMANCE_SUBJECT_SORTS = Object.freeze([
  'gap',
  'accuracy',
  'evolution',
  'questions',
  'priority',
  'balance',
]);
const STUDY_VERBS: Record<string, string> = {
  review: 'Revisar',
  questions: 'Praticar questões de',
  study: 'Estudar',
};

export function buildPerformanceSubjectComparison({
  subjects = [],
  questions = [],
  range,
  blueprint = {},
  globalTarget = 80,
  candidates = [],
  sort = 'gap',
  adherenceSubjects = [],
}: any = {}) {
  const current = questions.filter((item: any) => inRange(item.date, range));
  const previous = range?.previous
    ? questions.filter((item: any) => inRange(item.date, range.previous))
    : [];
  const currentRows = buildSubjectAccuracy({
    subjects,
    questions: current,
    blueprint,
    globalTarget,
  });
  const previousRows = new Map<string, any>(
    buildSubjectAccuracy({ subjects, questions: previous, blueprint, globalTarget }).map(
      (item: any) => [item.subjectId, item]
    )
  );
  const priorityBySubject = new Map();
  for (const item of candidates) {
    if (!item.subjectId || !Number.isFinite(Number(item.score))) continue;
    priorityBySubject.set(
      item.subjectId,
      Math.max(priorityBySubject.get(item.subjectId) ?? -Infinity, Number(item.score))
    );
  }
  const planBySubject = new Map<string, Row>(
    adherenceSubjects.map((item: Row) => [item.subjectId, item])
  );
  // A sugestão é o tópico de maior prioridade já calculado para a disciplina; nada é recalculado aqui.
  const topBySubject = new Map<string, Row>();
  for (const item of candidates) {
    if (!item.subjectId || !Number.isFinite(Number(item.score))) continue;
    const known = topBySubject.get(item.subjectId);
    if (!known || Number(item.score) > Number(known.score)) topBySubject.set(item.subjectId, item);
  }
  const rows = currentRows.map((item: any) => {
    const plan = planBySubject.get(item.subjectId);
    const top = topBySubject.get(item.subjectId);
    const earlier = previousRows.get(item.subjectId)?.personal;
    const enough = item.personal.total >= 10;
    return {
      subjectId: item.subjectId,
      name: item.name,
      target: item.target,
      accuracy: item.personal.accuracy,
      questions: item.personal.total,
      gap: enough ? item.personal.gap : null,
      state: enough ? item.personal.state : 'insufficient',
      evolution:
        range?.comparePrevious && enough && earlier?.total >= 10
          ? rounded(item.personal.accuracy - earlier.accuracy)
          : null,
      priority: priorityBySubject.get(item.subjectId) ?? null,
      plannedMinutes: plan ? Math.round(plan.plannedMinutes) : null,
      executedMinutes: plan ? Math.round(plan.executedMinutes) : null,
      balanceMinutes: plan ? Math.round(plan.plannedMinutes - plan.executedMinutes) : null,
      suggestion: top ? `${STUDY_VERBS[top.studyType] || 'Priorizar'} ${top.topicName}` : null,
    };
  });
  const selected = PERFORMANCE_SUBJECT_SORTS.includes(sort) ? sort : 'gap';
  const metric = (
    {
      gap: (item: Row) => (item.gap == null ? Infinity : item.gap),
      accuracy: (item: Row) => (item.accuracy == null ? Infinity : item.accuracy),
      evolution: (item: Row) => (item.evolution == null ? Infinity : item.evolution),
      questions: (item: Row) => -item.questions,
      priority: (item: Row) => (item.priority == null ? Infinity : -item.priority),
      balance: (item: Row) => (item.balanceMinutes == null ? Infinity : -item.balanceMinutes),
    } as Record<string, (item: Row) => number>
  )[selected];
  rows.sort((a: any, b: any) => metric(a) - metric(b) || a.name.localeCompare(b.name, 'pt-BR'));
  return {
    rows,
    sort: selected,
    measured: rows.filter((item: any) => item.state !== 'insufficient').length,
  };
}
