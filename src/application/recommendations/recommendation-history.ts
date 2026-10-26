import { captureTopicPriorityProfile } from '../../domain/recommendations/topic-priority-profile.js';
import { buildRecommendationExplanation } from './build-recommendation-explanation.js';
import { recommendationActionKind } from './recommendation-action.js';

export const RECOMMENDATION_HISTORY_STATUSES = Object.freeze([
  'pending',
  'executed',
  'dismissed',
  'expired',
]);
type Row = Record<string, any>;
export const recommendationSignature = (item: Row) =>
  JSON.stringify([
    item.id,
    item.score,
    item.estimatedMinutes,
    item.factors || null,
    recommendationActionKind(item),
    item.evidence || null,
    item.examIntelligence || null,
    item.algorithmVersion || null,
    item.accuracyTarget ?? null,
  ]);
const localDate = (timestamp: string | number | Date) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? null
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const recordDate = (record: Row) => record.localDate || localDate(record.createdAt);

export function migrateRecommendationHistory(feedback: Row[] = []) {
  const seen = new Set<string>();
  return feedback
    .filter(item => {
      if (!item.recommendationId || seen.has(item.recommendationId)) return false;
      seen.add(item.recommendationId);
      return true;
    })
    .map((item): Row => ({
      id: item.recommendationId,
      createdAt: item.shownAt || item.createdAt || new Date(`${item.date}T12:00:00Z`).toISOString(),
      localDate: item.date || localDate(item.shownAt || item.createdAt),
      candidateId: null,
      signature: null,
      source: item.presentationSource || 'legacy',
      subjectId: item.subjectId || null,
      topicId: item.topicId || null,
      activityType: ['study', 'review', 'questions', 'prerequisite'].includes(
        item.actionKind || item.snapshot?.recommendationType
      )
        ? item.actionKind || item.snapshot?.recommendationType
        : 'study',
      suggestedMinutes: item.snapshot?.recommendedMinutes ?? null,
      explanationSnapshot: structuredClone(
        item.explanation ||
          buildRecommendationExplanation(item, {
            createdAt: item.shownAt || item.createdAt || `${item.date}T12:00:00Z`,
          })
      ),
      priority: item.score ?? null,
      reasons: [],
      evidenceSnapshot: item.snapshot?.evidenceBefore || null,
      algorithmVersions: {
        priority: Number(item.algorithmVersion) || 1,
        examIntelligence: item.snapshot?.examIntelligenceVersion ?? null,
      },
      status: item.accepted ? 'executed' : 'dismissed',
      executedAt: item.accepted ? item.completedAt || item.createdAt || null : null,
      dismissedAt: item.accepted ? null : item.createdAt || null,
      expiredAt: null,
      sessionId: item.resultingSessionId || null,
      feedbackId: item.id,
    }));
}

export function reusableRecommendationRecord(
  history: Row[],
  item: Row,
  date: string,
  activeExamTags: string[] | null = null
) {
  const expected = recommendationSignature(item);
  const scope = (tags: unknown) =>
    Array.isArray(tags) ? JSON.stringify([...new Set(tags)].sort()) : null;
  return (
    [...history]
      .reverse()
      .find(
        record =>
          (activeExamTags === null || scope(record.activeExamTags) === scope(activeExamTags)) &&
          record.status === 'pending' &&
          record.candidateId === item.id &&
          record.signature === expected &&
          recordDate(record) === date
      ) || null
  );
}

export function ensureRecommendationRecord(
  history: Row[],
  item: Row,
  { now, idGenerator, activeExamTags = null }: any = {}
) {
  const existing = history.find((record: any) => record.id === item.recommendationId);
  if (existing) return existing;
  const record: Row = {
    activeExamTags: Array.isArray(activeExamTags) ? [...activeExamTags] : null,
    prioritySnapshot: captureTopicPriorityProfile(item, {
      capturedAt: item.shownAt || now,
      activeExamTags,
    }),
    id: item.recommendationId || idGenerator('recommendation'),
    createdAt: item.shownAt || now,
    localDate: localDate(item.shownAt || now),
    candidateId: item.id,
    signature: recommendationSignature(item),
    source: 'generated',
    subjectId: item.subjectId || null,
    topicId: item.topicId || null,
    activityType: recommendationActionKind(item),
    suggestedMinutes: item.estimatedMinutes ?? null,
    priority: item.score ?? null,
    reasons: [...(item.reasons || [])],
    evidenceSnapshot: item.evidence ? structuredClone(item.evidence) : null,
    algorithmVersions: {
      priority: Number(item.algorithmVersion) || 1,
      examIntelligence: item.examIntelligence?.algorithmVersion ?? null,
    },
    status: 'pending',
    executedAt: null,
    dismissedAt: null,
    expiredAt: null,
    sessionId: null,
    feedbackId: null,
  };
  history.push(record);
  return record;
}

export function syncRecommendationHistory(
  history: Row[],
  recommendations: Row[],
  { now, today = localDate(now), idGenerator, visibleCount = 3, activeExamTags = null }: any = {}
) {
  const visible = recommendations.slice(0, visibleCount),
    ids = new Set(visible.map((item: any) => item.recommendationId));
  let changed = false;
  for (const record of history) {
    if (record.status === 'pending' && (!ids.has(record.id) || recordDate(record) !== today)) {
      record.status = 'expired';
      record.expiredAt = now;
      changed = true;
    }
  }
  for (const item of visible) {
    if (history.some((record: any) => record.id === item.recommendationId)) continue;
    ensureRecommendationRecord(history, item, { now, idGenerator, activeExamTags });
    changed = true;
  }
  return changed;
}

export function decideRecommendationRecord(
  history: Row[],
  recommendationId: string,
  { accepted, source, feedbackId, now }: any = {}
) {
  const record = history.find((item: any) => item.id === recommendationId);
  if (!record) return null;
  record.status = accepted ? 'executed' : 'dismissed';
  record.source = source || record.source;
  record.executedAt = accepted ? now : null;
  record.dismissedAt = accepted ? null : now;
  record.feedbackId = feedbackId || record.feedbackId;
  return record;
}

export function attachRecommendationSession(
  history: Row[],
  recommendationId: string,
  sessionId: string
) {
  const record = history.find((item: any) => item.id === recommendationId);
  if (!record) return null;
  record.sessionId = sessionId;
  return record;
}

export function summarizeRecommendationHistory(history: Row[], { today, days = 30 }: any = {}) {
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - (days - 1));
  const rows = history.filter((item: any) => Date.parse(item.createdAt) >= cutoff.getTime());
  const count = (status: string) => rows.filter((item: any) => item.status === status).length,
    executed = count('executed');
  return {
    days,
    generated: rows.length,
    executed,
    dismissed: count('dismissed'),
    expired: count('expired'),
    pending: count('pending'),
    adherence: rows.length ? Math.round((executed / rows.length) * 100) : null,
  };
}
