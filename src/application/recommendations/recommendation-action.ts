type Row = Record<string, any>;
const ACTION_LABELS: Record<string, string> = {
  questions: 'Resolver questões',
  review: 'Iniciar revisão',
  prerequisite: 'Estudar pré-requisito',
  study: 'Iniciar estudo',
};

export const STUDY_ACTION_SOURCES: readonly string[] = Object.freeze([
  'overview',
  'today',
  'diagnosis',
  'planning',
  'review',
]);

export function recommendationActionKind(item: any = {}) {
  if (item.activityType) return item.activityType;
  if ((item.blockedPrerequisites || []).length) return 'prerequisite';
  if (item.studyType === 'questions') return 'questions';
  if (item.studyType === 'review') return 'review';
  return 'study';
}

export function recommendationActionLabel(item: Row) {
  return ACTION_LABELS[recommendationActionKind(item)] || 'Iniciar estudo';
}
export function sameStudyActionTarget(left: Row | null | undefined, right: Row | null | undefined) {
  return (
    Boolean(left && right) &&
    left.subjectId === right.subjectId &&
    left.topicId === right.topicId &&
    recommendationActionKind(left) === recommendationActionKind(right)
  );
}

const finiteOrNull = (value: unknown) =>
  value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const sourceOrDefault = (source: string) =>
  STUDY_ACTION_SOURCES.includes(source) ? source : 'overview';
function freezeDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach(child => freezeDeep(child, seen));
  return Object.freeze(value);
}

export function buildStudyAction(
  recommendation: Row | null | undefined,
  { source = 'overview' }: any = {}
) {
  if (!recommendation) return null;
  const recommendationId = recommendation.recommendationId || null;
  const id = recommendationId || recommendation.id || null;
  if (!id) return null;
  const evidence = recommendation.evidence || {};
  return freezeDeep({
    id: String(id),
    recommendationId: recommendationId ? String(recommendationId) : null,
    source: sourceOrDefault(source),
    subjectId: recommendation.subjectId || null,
    topicId: recommendation.topicId || null,
    activityType: recommendationActionKind(recommendation),
    suggestedMinutes: finiteOrNull(recommendation.estimatedMinutes),
    explanation: recommendation.explanation ? structuredClone(recommendation.explanation) : null,
    priority: finiteOrNull(recommendation.score),
    reasons: [...(Array.isArray(recommendation.reasons) ? recommendation.reasons : [])].filter(
      Boolean
    ),
    evidence: {
      mastery: finiteOrNull(recommendation.mastery),
      retention: finiteOrNull(recommendation.retention),
      strength: finiteOrNull(evidence.evidenceStrength),
      completeness: finiteOrNull(evidence.completeness),
      label: evidence.evidenceLabel || null,
      factors: recommendation.factors ? structuredClone(recommendation.factors) : null,
    },
    algorithmVersion: finiteOrNull(recommendation.algorithmVersion),
  });
}
