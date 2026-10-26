import { EXAM_TAGS, institutionForExamTag } from './exam-constants.js';

type Row = Record<string, any>;

const tagsOf = (topic: Row | null | undefined): string[] =>
  Array.isArray(topic?.examTags) ? topic.examTags : [];
export const normalizeExamTags = (tags: unknown): string[] =>
  [...new Set((Array.isArray(tags) ? tags : []).filter(Boolean).map(String))].sort();
export function isTopicInExamScope(topic: Row, activeExamTags: string[] = []) {
  const active = new Set(activeExamTags || []),
    tags = tagsOf(topic);
  return active.size === 0 || tags.length === 0 || tags.some(tag => active.has(tag));
}
export function filterTopicsByExamScope(topics: Row[] = [], activeExamTags: string[] = []) {
  return topics.filter(topic => isTopicInExamScope(topic, activeExamTags));
}
export function isSimulationInExamScope(simulation: Row, activeExamTags: string[] = []) {
  const active = normalizeExamTags(activeExamTags);
  if (!active.length) return true;
  const tags = Array.isArray(simulation?.examTags)
    ? simulation.examTags
    : simulation?.examTag
      ? [simulation.examTag]
      : [];
  return tags.some((tag: string) => active.includes(tag));
}
export function resolveExamScope(topics: Row[] = [], activeExamTags: string[] = []) {
  const activeTags = normalizeExamTags(activeExamTags),
    eligibleTopics: Row[] = [],
    excludedTopics: Row[] = [],
    catalogTopics: Row[] = [],
    personalTopics: Row[] = [];
  for (const topic of topics || []) {
    if (topic?.archived) continue;
    const personal = tagsOf(topic).length === 0;
    (personal ? personalTopics : catalogTopics).push(topic);
    (isTopicInExamScope(topic, activeTags) ? eligibleTopics : excludedTopics).push(topic);
  }
  return Object.freeze({
    eligibleTopics,
    catalogTopics,
    personalTopics,
    excludedTopics,
    activeExamTags: activeTags,
  });
}
export function isCommonTopic(topic: Row, examTags: string[] = [EXAM_TAGS.BB, EXAM_TAGS.CAIXA]) {
  const tags = new Set(tagsOf(topic));
  return examTags.length > 1 && examTags.every(tag => tags.has(tag));
}
export function topicExamScopeLabel(topic: Row) {
  const tags = tagsOf(topic);
  if (!tags.length) return 'Conteúdo pessoal';
  return tags
    .map(tag =>
      tag === EXAM_TAGS.BB
        ? 'BB'
        : tag === EXAM_TAGS.CAIXA
          ? 'CAIXA'
          : tag === EXAM_TAGS.CAIXA_TI
            ? 'CAIXA TI'
            : tag
    )
    .join(' · ');
}
export function institutionsForExamTags(tags: string[] = []) {
  return [...new Set(tags.map(institutionForExamTag).filter(Boolean))];
}
