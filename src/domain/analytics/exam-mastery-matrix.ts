import { isTopicInExamScope } from '../exams/exam-scope.js';

type Row = Record<string, any>;

export function buildExamMasteryMatrix({
  subjects = [],
  blueprint = {},
  metricsByTopic = {},
  masteryTargets = {},
  activeExamTags = blueprint.activeExamTags || [],
}: {
  subjects?: Row[];
  blueprint?: Row;
  metricsByTopic?: Record<string, Row>;
  masteryTargets?: Record<string, unknown>;
  activeExamTags?: string[];
} = {}) {
  const general = Number(blueprint.masteryTarget ?? 80);
  return subjects
    .filter(subject => !subject.archived)
    .map(subject => {
      const config = (blueprint.subjects || []).find((item: Row) => item.subjectId === subject.id),
        target = Number(config?.masteryTarget ?? masteryTargets[subject.id] ?? general);
      const topics = (subject.topics || [])
        .filter((topic: Row) => !topic.archived && isTopicInExamScope(topic, activeExamTags))
        .map((topic: Row) => {
          const metrics = metricsByTopic[topic.id] || {},
            mastery = metrics.mastery?.value ?? metrics.mastery?.score ?? null,
            coverage =
              metrics.coverage ??
              (topic.status === 'Concluído' ? 100 : topic.status === 'Em andamento' ? 50 : 0);
          return {
            subjectId: subject.id,
            topicId: topic.id,
            name: topic.name,
            coverage,
            mastery,
            retention: metrics.retention?.value ?? metrics.retention?.score ?? null,
            trend: metrics.trend || null,
            priority: metrics.priority?.value ?? metrics.priority?.score ?? null,
            confidence: metrics.mastery?.confidence ?? 0,
            target,
            gap: mastery == null ? null : Math.round((target - mastery) * 10) / 10,
            state:
              mastery == null
                ? coverage
                  ? 'without_evidence'
                  : 'not_started'
                : mastery < target
                  ? 'fragile'
                  : 'on_target',
            examMetrics: topic.examMetrics || {},
            incidence: topic.incidence || null,
          };
        });
      const known = topics.filter((topic: Row) => topic.mastery != null),
        average = (key: string) => {
          const rows = topics.filter((topic: Row) => topic[key] != null);
          return rows.length
            ? Math.round(
                rows.reduce((total: number, topic: Row) => total + topic[key], 0) / rows.length
              )
            : null;
        };
      return {
        subjectId: subject.id,
        name: subject.name,
        target,
        coverage: average('coverage'),
        mastery: average('mastery'),
        retention: average('retention'),
        gap: known.length ? Math.round((target - average('mastery')) * 10) / 10 : null,
        topics,
      };
    })
    .filter(subject => subject.topics.length);
}
