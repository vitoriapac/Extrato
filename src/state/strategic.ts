import { EXAM_INTELLIGENCE_VERSION } from '../domain/exam-intelligence/config.js';
import { PRIORITY_ALGORITHM_VERSION } from '../domain/analytics/priority-score.js';
import { ADAPTIVE_PLANNING_VERSION } from '../domain/planning/adaptive-planning.js';
import { normalizeTopicBookmark } from '../domain/topic-bookmark.ts';
import type { ExamBlueprint, ExamPriority, Topic } from '../core/types.ts';

export const DEFAULT_ALGORITHM_VERSIONS = Object.freeze({
  readiness: 1,
  retention: 1,
  reviewHealth: 1,
  recommendations: PRIORITY_ALGORITHM_VERSION,
  examIntelligence: EXAM_INTELLIGENCE_VERSION,
  adaptivePlanning: ADAPTIVE_PLANNING_VERSION,
  recommendationOutcomes: 1,
  adaptiveReview: 1,
  forecasts: 1,
});
export const EXAM_PRIORITIES: readonly ExamPriority[] = Object.freeze(['low', 'normal', 'high']);

export function normalizeTopicStrategy<T extends Partial<Topic> & Record<string, any>>(
  topic: T
): T {
  const importance =
    topic.examImportance == null || (topic.examImportance as unknown) === ''
      ? NaN
      : Number(topic.examImportance);
  topic.examImportance = Number.isFinite(importance) ? Math.max(0, Math.min(1, importance)) : null;
  const minutes = Number(topic.estimatedStudyMinutes);
  topic.estimatedStudyMinutes =
    Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null;
  topic.prerequisites = Array.isArray(topic.prerequisites)
    ? [
        ...new Set(
          topic.prerequisites.filter(value => typeof value === 'string' && value !== topic.id)
        ),
      ]
    : [];
  topic.bookmark = normalizeTopicBookmark(topic.bookmark);
  return topic;
}

export function normalizeExamBlueprint(value: unknown = {}, legacyExamDate = ''): ExamBlueprint {
  const source: Record<string, any> =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, any>)
      : {};
  const target = Number(source.targetScore);
  return {
    examDate:
      typeof source.examDate === 'string' && source.examDate
        ? source.examDate
        : legacyExamDate || null,
    targetScore: Number.isFinite(target) ? Math.max(0, Math.min(100, target)) : 80,
    masteryTarget: Number.isFinite(Number(source.masteryTarget))
      ? Math.max(0, Math.min(100, Number(source.masteryTarget)))
      : 80,
    activeExamTags: Array.isArray(source.activeExamTags)
      ? [
          ...new Set(
            source.activeExamTags.filter(
              (tag: unknown): tag is string =>
                typeof tag === 'string' &&
                ['bb-escriturario', 'caixa-tbn', 'caixa-tbn-ti'].includes(tag)
            )
          ),
        ]
      : [],
    configuredAt: typeof source.configuredAt === 'string' ? source.configuredAt : null,
    subjects: Array.isArray(source.subjects)
      ? source.subjects.map((item: any) => ({
          subjectId: item?.subjectId || null,
          expectedQuestions: Math.max(0, Math.round(Number(item?.expectedQuestions) || 0)),
          questionWeight: Math.max(0, Number(item?.questionWeight) || 1),
          priority: EXAM_PRIORITIES.includes(item?.priority) ? item.priority : 'normal',
          masteryTarget:
            item?.masteryTarget == null || item.masteryTarget === ''
              ? null
              : Number.isFinite(Number(item.masteryTarget))
                ? Math.max(0, Math.min(100, Number(item.masteryTarget)))
                : null,
          ...(item?.accuracyTarget != null && item.accuracyTarget !== ''
            ? { accuracyTarget: Number(item.accuracyTarget) }
            : {}),
          ...(typeof item?.sourceRef === 'string' ? { sourceRef: item.sourceRef } : {}),
          ...('official' in (item || {}) ? { official: Boolean(item.official) } : {}),
          ...(typeof item?.mappingType === 'string' ? { mappingType: item.mappingType } : {}),
        }))
      : [],
  };
}

export function normalizeAlgorithmVersions(value: unknown = {}): Record<string, number> {
  const source: Record<string, any> =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, any>)
      : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_ALGORITHM_VERSIONS).map(([key, fallback]) => [
      key,
      Math.max(1, Math.floor(Number(source[key]) || fallback)),
    ])
  );
}
