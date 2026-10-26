import type { ExamImportState } from './exam-import-state.ts';
type Row = Record<string, any>;

export function toggleExamSubject(
  state: ExamImportState,
  preset: Row,
  subjectId: string,
  checked: boolean
) {
  const subject = (preset?.subjects || []).find((item: any) => item.id === subjectId);
  checked ? state.subjectIds.add(subjectId) : state.subjectIds.delete(subjectId);
  for (const topic of subject?.topics || []) {
    const key = `${subjectId}:${topic.id}`;
    checked ? state.topicIds.add(key) : state.topicIds.delete(key);
  }
  return state;
}
export function toggleExamTopic(state: ExamImportState, key: string, checked: boolean) {
  checked ? state.topicIds.add(key) : state.topicIds.delete(key);
  return state;
}
export function selectExamTopics(
  state: ExamImportState,
  preset: Row,
  predicate: (topic: Row, subject: Row) => boolean
) {
  state.subjectIds.clear();
  state.topicIds.clear();
  for (const subject of preset?.subjects || [])
    for (const topic of subject.topics || [])
      if (predicate(topic, subject)) {
        state.subjectIds.add(subject.id);
        state.topicIds.add(`${subject.id}:${topic.id}`);
      }
  return state;
}
