import { isTopicInExamScope, resolveExamScope } from './exam-scope.js';

type Row = Record<string, any>;

const topicIdOf = (record: Row | null | undefined) => record?.topicId || record?.topicRef || null;
const subjectIdOf = (record: Row | null | undefined) =>
  record?.subjectId || record?.disciplinaId || null;
export function indexExamTopics(subjects: Row[] = []) {
  const topics: Row[] = [],
    byId = new Map<string, Row>();
  for (const subject of subjects || [])
    if (!subject?.archived)
      for (const topic of subject.topics || [])
        if (!topic?.archived) {
          const normalized = { ...topic, subjectId: topic.subjectId || subject.id };
          topics.push(normalized);
          byId.set(normalized.id, normalized);
        }
  return { topics, byId };
}
// Callers classifying a list pass one prebuilt index; rebuilding it per record was O(records × topics).
export function classifyEvidenceScope(
  record: Row,
  subjects: Row[] = [],
  activeExamTags: string[] = [],
  index = indexExamTopics(subjects)
) {
  const { byId } = index,
    topicId = topicIdOf(record),
    subjectId = subjectIdOf(record),
    hasSpecificScope = (activeExamTags || []).length > 0;
  if (Array.isArray(record?.examScope)) {
    const recordScope = new Set(record.examScope),
      includedInExamMetrics =
        !hasSpecificScope ||
        recordScope.size === 0 ||
        (activeExamTags || []).some(tag => recordScope.has(tag));
    return Object.freeze({
      state: recordScope.size ? 'record_scoped' : 'personal',
      includedInExamMetrics,
      subjectId,
      topicId,
      examScope: [...recordScope],
    });
  }
  if (topicId) {
    const topic = byId.get(topicId);
    return Object.freeze({
      state: topic ? 'topic_scoped' : 'unscoped',
      includedInExamMetrics: Boolean(topic && isTopicInExamScope(topic, activeExamTags)),
      subjectId: subjectId || topic?.subjectId || null,
      topicId,
    });
  }
  if (subjectId)
    return Object.freeze({
      state: 'subject_only',
      includedInExamMetrics: !hasSpecificScope,
      subjectId,
      topicId: null,
    });
  return Object.freeze({
    state: 'unscoped',
    includedInExamMetrics: !hasSpecificScope,
    subjectId: null,
    topicId: null,
  });
}
export function resolveExamEvidenceScope<
  Session extends Row = Row,
  Question extends Row = Row,
  Review extends Row = Row,
>({
  subjects = [],
  activeExamTags = [],
  sessions = [],
  questions = [],
  reviews = [],
}: {
  subjects?: Row[];
  activeExamTags?: string[];
  sessions?: Session[];
  questions?: Question[];
  reviews?: Review[];
} = {}) {
  const index = indexExamTopics(subjects),
    content = resolveExamScope(index.topics, activeExamTags);
  const classify = <T extends Row>(list: T[]) =>
    (list || []).map(record => ({
      record,
      scope: classifyEvidenceScope(record, subjects, activeExamTags, index),
    }));
  const partition = <T extends Row>(list: T[]) => {
    const classified = classify(list);
    return {
      classified,
      included: classified
        .filter(item => item.scope.includedInExamMetrics)
        .map(item => item.record),
      subjectOnly: classified
        .filter(item => item.scope.state === 'subject_only')
        .map(item => item.record),
      excluded: classified
        .filter(item => !item.scope.includedInExamMetrics)
        .map(item => item.record),
    };
  };
  return Object.freeze({
    content,
    sessions: partition(sessions),
    questions: partition(questions),
    reviews: partition(reviews),
    activeExamTags: [...content.activeExamTags],
  });
}
