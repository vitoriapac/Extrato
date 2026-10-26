import { buildTopicGapInputs } from '../analytics/build-topic-gap-inputs.js';
import { buildGapMap } from '../../domain/analytics/gap-map.js';
import { buildConsolidatedSignals } from './build-consolidated-signals.js';

// Read-only assembly of current producer outputs, with the content scope verified first.
export function buildConsolidatedDiagnosis({
  candidates = [],
  subjects = [],
  eligibleTopics = [],
  preparationSignals = {},
  recommendations = [],
  opportunityCosts = [],
  activeExamTags = [],
}: any = {}) {
  const subjectNames = new Map(subjects.map((item: any) => [item.id || item.subjectId, item.name]));
  const topics = eligibleTopics
    .filter((item: any) => !item.archived && !item.topicArchived && !item.subjectArchived)
    .map((item: any) => ({
      ...item,
      topicId: item.topicId || item.id,
      subjectId: item.subjectId,
      subjectName: subjectNames.get(item.subjectId) || '',
      granularity: 'topic',
      name: item.topicName || item.name,
    }));
  const ids = new Set(topics.map((item: any) => JSON.stringify([item.subjectId, item.topicId]))),
    subjectIds = new Set(topics.map((item: any) => item.subjectId));
  const scopedCandidates = candidates.filter(
    (item: any) => ids.has(JSON.stringify([item.subjectId, item.topicId])) && !item.archived
  );
  const subjectEntities = subjects
    .filter((item: any) => subjectIds.has(item.id || item.subjectId) && !item.archived)
    .map((item: any) => ({
      subjectId: item.id || item.subjectId,
      topicId: null as string | null,
      granularity: 'subject',
      name: item.name,
    }));
  return buildConsolidatedSignals({
    eligibleEntities: [...topics, ...subjectEntities],
    activeExamTags,
    inputsAlreadyScoped: true,
    priorities: scopedCandidates,
    gapSignals: buildGapMap(buildTopicGapInputs(scopedCandidates), {
      limit: Number.MAX_SAFE_INTEGER,
    }),
    preparationSignals,
    recommendations,
    opportunityCosts,
    reviewSignals: scopedCandidates,
    examIntelligence: scopedCandidates.map((item: any) => ({
      ...item.examIntelligence,
      subjectId: item.subjectId,
      topicId: item.topicId,
    })),
  });
}
