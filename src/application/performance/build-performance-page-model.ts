import { buildRecommendationFollowup } from '../recommendations/build-recommendation-followup.js';
import { buildAdherenceModel } from '../adherence/build-adherence-model.js';
import { buildPreparationReading } from './build-preparation-reading.js';
import { buildQuestionEvolution } from '../questions/build-question-evolution.js';
import { buildPerformanceAnalysis } from '../questions/build-performance-analysis.js';
import { buildPerformanceOverview } from './build-performance-overview.js';
import { buildPerformanceComparison } from './build-performance-comparison.js';
import { buildPerformanceSimulations } from './build-performance-simulations.js';
import { buildPerformanceSubjectComparison } from './build-performance-subject-comparison.js';
import { buildPerformanceSubjects } from './build-performance-subjects.js';
import { buildPerformanceTopicDetail } from './build-performance-topic-detail.js';
import { buildPerformanceConsistency } from './build-performance-consistency.js';
import { buildReadinessChangeExplanation } from '../readiness/build-readiness-change-explanation.js';
import { buildStabilityMap } from './build-stability-map.js';
import { buildWeeklyPerformanceBrief } from './build-weekly-performance-brief.js';
import { buildMultiSubjectPerformanceModel } from '../../domain/analytics/subject-performance-timeline.js';
import { buildPedagogicalMatrixModel } from '../../domain/analytics/pedagogical-matrix.js';

// The composition root supplies scoped records and stateful metric lookups; this builder owns section assembly.
export function buildPerformancePageModel({
  viewState,
  range,
  today,
  activeExamTags = [],
  scope,
  subjects = [],
  simulations = [],
  projectionSnapshots = [],
  achievementProjection = null,
  achievementHistory = [],
  achievementCapacityMinutes = 0,
  adherenceContext = null,
  recoveryPlan = null,
  nextBestAction = null,
  recommendationFeedback = [],
  allSessions = [],
  readinessSnapshots = [],
  readiness = null,
  blueprint = {},
  globalTarget = 80,
  candidates = [],
  dailyPlans = [],
  executionSource = null,
  subjectIdFor,
  simulationCountsFor,
  reviewCompletedDateFor,
  topicMetricsFor,
  topicProfileFor,
  topicHistoryFor,
}: any = {}): Record<string, any> {
  const section = viewState.section;
  if (section === 'history' || section === 'diagnosis') return { section };
  if (section === 'overview') {
    const model = buildPerformanceOverview({
      range,
      today,
      activeExamTags,
      readinessSnapshots,
      readiness,
      questions: scope.questions.included,
      sessions: scope.sessions.included,
      dailyPlans,
      subjects,
    });
    const weeklyBrief = buildWeeklyPerformanceBrief({
      today,
      questions: scope.questions?.included || [],
      sessions: scope.sessions?.included || [],
      dailyPlans,
      reviews: scope.reviews?.included || [],
      simulations,
      subjects,
      subjectIdFor,
    });
    const readinessChange = buildReadinessChangeExplanation(model.readinessPair);
    return {
      section,
      model,
      weeklyBrief,
      recommendationFollowup: buildRecommendationFollowup({
        feedback: recommendationFeedback,
        sessions: allSessions,
        topics: subjects.flatMap((subject: any) => subject.topics || []),
        activeExamTags,
        today,
      }).rows.filter((row: any) => row.state !== 'insufficient'),
      preparationReading: buildPreparationReading({
        range,
        model,
        projection: achievementProjection,
        weeklyBrief,
        readinessChange,
        nextBestAction,
        candidates,
      }),
      achievementProjection,
      achievementHistory,
      achievementCapacityMinutes,
      adherenceContext,
      recoveryPlan,
      comparisonModel: buildPerformanceComparison(model, {
        comparePrevious: range.comparePrevious,
      }),
      readinessChange,
    };
  }
  if (section === 'questions') {
    const questions = scope.questions.included.map((item: any) => ({
      ...item,
      subjectId: subjectIdFor(item),
    }));
    const evolution = buildQuestionEvolution({ questions, today, period: viewState.period });
    const analysis = buildPerformanceAnalysis({
      questions,
      simulations: [],
      candidates: scope.content.eligibleTopics.map((item: any) => ({
        topicId: item.id,
        topicName: item.name,
      })),
      today,
      period: viewState.period,
    });
    // Mesma função e mesma precisão (1 casa) da atual; a evolução arredonda para inteiro e gerava +4,8 contra +4,6 da Visão geral.
    const previousAccuracy = range.previous
      ? buildPerformanceAnalysis({
          questions,
          simulations: [],
          candidates: [],
          today: range.previous.end,
          period: viewState.period,
        }).accuracy
      : null;
    const multiSubjectPerformance = buildMultiSubjectPerformanceModel({
      questions,
      subjects,
      today,
      period: viewState.period,
    });
    return { section, evolution, analysis, previousAccuracy, multiSubjectPerformance };
  }
  if (section === 'simulations') {
    const normalized = simulations.map((item: any) => ({
      ...item,
      ...simulationCountsFor(item),
      breakdown: (item.breakdown || []).map((row: any) => ({
        ...row,
        subjectId: subjectIdFor(row),
      })),
    }));
    return {
      section,
      model: buildPerformanceSimulations({
        simulations: normalized,
        subjects,
        projectionSnapshots,
        activeExamTags,
        range,
        today,
      }),
    };
  }
  if (section === 'subjects') {
    const eligibleTopicIds = new Set(scope.content.eligibleTopics.map((item: any) => item.id));
    const eligibleSubjects = subjects.map((subject: any) => ({
      ...subject,
      topics: (subject.topics || []).filter((topic: any) => eligibleTopicIds.has(topic.id)),
    }));
    const questions = scope.questions.included.map((item: any) => ({
      ...item,
      subjectId: subjectIdFor(item),
    }));
    // Planejado e realizado por disciplina no período, do mesmo modelo de aderência da aba Consistência.
    const planBySubject = () => {
      if (!executionSource) return [];
      const dates = [...(executionSource.dailyPlans || []), ...(executionSource.sessions || [])]
        .map((item: any) => item.date)
        .filter((date: unknown) => typeof date === 'string' && date <= today)
        .sort();
      try {
        return buildAdherenceModel({
          ...executionSource,
          start: range?.start || dates[0] || today,
          end: range?.end || today,
          today,
          activeExamTags,
        }).subjects;
      } catch {
        return [];
      }
    };
    const comparison = buildPerformanceSubjectComparison({
      subjects: eligibleSubjects,
      questions,
      range,
      blueprint,
      globalTarget,
      candidates,
      sort: viewState.subjectSort,
      adherenceSubjects: planBySubject(),
    });
    const selected =
      eligibleSubjects.find((item: any) => item.id === viewState.subjectId) || eligibleSubjects[0];
    const metricsByTopic = Object.fromEntries(
      (selected?.topics || []).map((topic: any) => [
        topic.id,
        topicMetricsFor(selected.id, topic.id),
      ])
    );
    const model = buildPerformanceSubjects({
      subjects: eligibleSubjects,
      subjectId: selected?.id,
      range,
      today,
      period: viewState.period,
      questions,
      sessions: scope.sessions.included.map((item: any) => ({
        ...item,
        subjectId: subjectIdFor(item),
      })),
      reviews: scope.reviews.included.map((item: any) => ({
        ...item,
        subjectId: subjectIdFor(item),
        completedDate: reviewCompletedDateFor(item),
      })),
      simulations: simulations.map((item: any) => ({
        ...item,
        breakdown: (item.breakdown || []).map((row: any) => ({
          ...row,
          subjectId: subjectIdFor(row),
        })),
      })),
      blueprint,
      globalTarget,
      metricsByTopic,
    });
    const topicRow = model.topics.find((item: any) => item.id === viewState.topicId);
    const topic = selected?.topics.find((item: any) => item.id === topicRow?.id);
    const detail = topic
      ? {
          ...buildPerformanceTopicDetail({
            topicRow,
            questions: scope.questions.included,
            today,
            period: viewState.period,
            examProfile: topicProfileFor(topic, selected),
            history: topicHistoryFor(topic.id),
          }),
          subjectId: selected.id,
        }
      : null;
    const pedagogicalMatrix = buildPedagogicalMatrixModel({
      subjects: eligibleSubjects.map((sub: any) => {
        const topicMetrics = (sub.topics || []).map((t: any) => topicMetricsFor(sub.id, t.id));
        const validMastery = topicMetrics
          .map((m: any) => m?.mastery)
          .filter((val: any) => Number.isFinite(val));
        const avgMastery = validMastery.length
          ? Math.round(
              validMastery.reduce((a: number, b: number) => a + b, 0) / validMastery.length
            )
          : 50;
        const validRetention = topicMetrics
          .map((m: any) => m?.retention)
          .filter((val: any) => Number.isFinite(val));
        const avgRetention = validRetention.length
          ? Math.round(
              validRetention.reduce((a: number, b: number) => a + b, 0) / validRetention.length
            )
          : 50;

        const subSessions = scope.sessions.included.filter(
          (sess: any) => subjectIdFor(sess) === sub.id
        );
        const studyMinutes = Math.round(
          subSessions.reduce(
            (sum: number, sess: any) => sum + (Number(sess.durationSeconds) || 0) / 60,
            0
          )
        );

        return {
          id: sub.id,
          name: sub.name,
          color: sub.color,
          mastery: avgMastery,
          retention: avgRetention,
          studyMinutes,
        };
      }),
    });
    return {
      section,
      model,
      comparison,
      stabilityMap: buildStabilityMap(comparison),
      detail,
      pedagogicalMatrix,
    };
  }
  const sessions = scope.sessions.included.map((item: any) => ({
    ...item,
    subjectId: subjectIdFor(item),
  }));
  return {
    section: 'consistency',
    model: buildPerformanceConsistency({
      range,
      today,
      sessions,
      questions: scope.questions.included,
      dailyPlans,
      subjects,
      activeExamTags,
      historyWeeks: viewState.adherenceWeeks || 8,
      executionSource,
    }),
  };
}
