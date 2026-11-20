import { recordRecommendationDecision } from '../../../application/recommendations/recommendation-feedback.js';
import {
  ensureRecommendationRecord,
  decideRecommendationRecord,
  attachRecommendationSession,
} from '../../../application/recommendations/recommendation-history.js';
import {
  captureRecommendationBaseline,
  captureRecommendationSnapshot,
  measureRecommendationOutcome,
} from '../../../application/recommendations/outcome-service.js';
import type { StudyRecommendationControllerDeps } from './study-recommendation-controller.js';

export type RecommendationOutcomeRecorderDeps = Pick<
  StudyRecommendationControllerDeps,
  | 'getState'
  | 'getTopicPerformance'
  | 'getTopicById'
  | 'diasParaRevisao'
  | 'localDateFromTimestamp'
  | 'nowISO'
  | 'uid'
  | 'scheduleSave'
  | 'renderRecommendationHistorySummary'
  | 'intelligenceCandidates'
  | 'validQuestionRecords'
>;

/** Registra a decisão do usuário sobre uma recomendação e mede o resultado depois da sessão. */
export function createRecommendationOutcomeRecorder(deps: RecommendationOutcomeRecorderDeps) {
  const {
    getState,
    getTopicPerformance,
    getTopicById,
    diasParaRevisao,
    localDateFromTimestamp,
    nowISO,
    uid,
    scheduleSave,
    renderRecommendationHistorySummary,
    intelligenceCandidates,
    validQuestionRecords,
  } = deps;

  function recommendationBaseline(recommendation: Record<string, any>) {
    const topicId = recommendation.topicId,
      performance = getTopicPerformance(topicId),
      found = getTopicById(topicId),
      last = found?.topic?.lastReviewedAt || found?.topic?.lastCompletedAt || null;
    return captureRecommendationBaseline({
      mastery: recommendation.mastery,
      accuracy: performance.accuracy,
      questionVolume: performance.resolved,
      retention: recommendation.retention,
      reviewHealth: recommendation.reviewHealth?.value,
      risk: recommendation.risk?.value,
      trend: recommendation.diagnosis?.trend || null,
      evidence: recommendation.evidence || null,
      daysSinceContact: last
        ? Math.max(0, -(diasParaRevisao(localDateFromTimestamp(last)) ?? 0))
        : null,
      measuredAt: nowISO(),
    });
  }

  function recordRecommendationFeedback(
    recommendation: Record<string, any>,
    {
      accepted,
      reasonSkipped = null,
      source = null,
    }: { accepted: boolean; reasonSkipped?: string | null; source?: string | null } = {
      accepted: false,
    }
  ) {
    const state = getState();
    const baseline = recommendationBaseline(recommendation),
      createdAt = nowISO(),
      feedback = recordRecommendationDecision(state.recommendationFeedback, recommendation, {
        accepted,
        reasonSkipped,
        baseline,
        snapshot: captureRecommendationSnapshot(recommendation, { baseline, createdAt }),
        now: createdAt,
        idGenerator: uid,
      });
    feedback.activeExamTags ??= [...(state.examBlueprint.activeExamTags || [])];
    if (source) feedback.presentationSource = source;
    ensureRecommendationRecord(state.recommendationHistory, recommendation, {
      now: createdAt,
      idGenerator: uid,
      activeExamTags: state.examBlueprint.activeExamTags || [],
    });
    decideRecommendationRecord(state.recommendationHistory, recommendation.recommendationId, {
      accepted,
      source,
      feedbackId: feedback.id,
      now: createdAt,
    });
    scheduleSave();
    renderRecommendationHistorySummary();
    return feedback;
  }

  function measureRecommendationResults(session: Record<string, any>) {
    const state = getState();
    if (session?.recommendationId) {
      attachRecommendationSession(
        state.recommendationHistory,
        session.recommendationId,
        session.id
      );
    }
    if (!session?.topicId) return;
    const measuredAt = nowISO();
    state.recommendationFeedback
      .filter(
        (item: any) =>
          item.accepted &&
          item.completed &&
          item.topicId === session.topicId &&
          item.baseline &&
          (!item.outcome || ['pending', 'insufficient'].includes(item.outcome.state!))
      )
      .forEach((feedback: any) => {
        const since = Date.parse(feedback.baseline!.measuredAt!) || 0,
          records = validQuestionRecords().filter(
            item =>
              item.topicId === session.topicId &&
              Date.parse(item.createdAt || `${item.date}T23:59:59Z`) >= since
          ),
          volume = records.reduce((sum, item) => sum + (Number(item.resolved) || 0), 0),
          correct = records.reduce((sum, item) => sum + (Number(item.correct) || 0), 0),
          activities = state.studySessions.filter(
            (item: any) =>
              item.topicId === session.topicId &&
              item.id !== session.id &&
              Date.parse(String(item.createdAt || item.startedAt || 0)) >= since
          ).length,
          candidate = intelligenceCandidates().find(
            (item: any) => item.topicId === session.topicId
          );
        measureRecommendationOutcome(feedback, {
          masteryAfter: candidate?.mastery,
          accuracyAfter: volume ? Math.round((correct / volume) * 1000) / 10 : null,
          questionVolumeAfter: volume,
          retentionAfter: candidate?.retention,
          reviewHealthAfter: candidate?.reviewHealth?.value,
          riskAfter: candidate?.risk?.value,
          measuredAt,
          daysElapsed: Math.max(0, (Date.parse(measuredAt) - since) / 86400000),
          otherActivities: activities,
        });
      });
  }

  return { recommendationBaseline, recordRecommendationFeedback, measureRecommendationResults };
}
