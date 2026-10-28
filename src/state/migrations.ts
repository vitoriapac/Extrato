import { uid } from '../core/utils.ts';
import {
  REVIEW_RATINGS,
  createAdaptiveReviewState,
  reviewBaseDaysFromType,
} from '../domain/reviews.ts';
import { normalizeStudySession } from '../domain/sessions/study-session.ts';
import { snapshotEvidenceScopes } from '../application/exams/evidence-scope-migration.ts';
import { migrateRecommendationHistory } from '../application/recommendations/recommendation-history.ts';
import { runStateMigrations } from '../storage/migration-service.ts';
import { CURRENT_SCHEMA_VERSION } from './schema.ts';
import {
  normalizeTopicStrategy,
  normalizeExamBlueprint,
  normalizeAlgorithmVersions,
} from './strategic.ts';

export interface StateMigratorOptions {
  nowISO: () => string;
  todayISO: () => string;
  toLocalDate: (value: any) => string | null;
  errorCategoryKeys: readonly string[];
}

// O relógio vem do app para que datas de migração sigam o relógio injetado (testes, fuso).
export function createStateMigrator({
  nowISO,
  todayISO,
  toLocalDate,
  errorCategoryKeys,
}: StateMigratorOptions) {
  function historicalLocalDate(value: any) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return toLocalDate(value) || todayISO();
  }
  function normalizeHistoryEvent(event: Record<string, any>) {
    if (!event.id) event.id = uid('history');
    if (!event.occurredAt) event.occurredAt = event.date || nowISO();
    if (!event.date) event.date = event.occurredAt;
    if (!event.localDate) event.localDate = historicalLocalDate(event.occurredAt || event.date);
    if (!event.metadata || typeof event.metadata !== 'object') event.metadata = {};
    event.subjectId = event.subjectId || null;
    event.topicId = event.topicId || null;
    return event;
  }

  function migrateV1toV2(data: Record<string, any>) {
    const subjectIdByName = new Map();
    (data.subjects || []).forEach((subject: any) => {
      if (!subject.id) subject.id = uid('subject');
      subject.archived = Boolean(subject.archived);
      subject.createdAt = subject.createdAt || nowISO();
      if (!Array.isArray(subject.topics)) subject.topics = [];
      subjectIdByName.set(subject.name, subject.id);
      subject.topics.forEach((topic: any) => {
        if (!topic.id) topic.id = uid('topic');
        topic.createdAt = topic.createdAt || nowISO();
      });
    });

    (data.questoes || []).forEach((q: any) => {
      q.id = q.id || uid('question');
      q.subjectId = q.subjectId || subjectIdByName.get(q.subject) || null;
      q.topicId = q.topicId || null;
      q.createdAt = q.createdAt || nowISO();
    });
    (data.calendar || []).forEach((item: any) => {
      item.id = item.id || uid('calendar');
      item.subjectId = item.subjectId || subjectIdByName.get(item.subject) || null;
      item.topicId = item.topicId || null;
      item.createdAt = item.createdAt || nowISO();
    });
    (data.reviewAgenda || []).forEach((item: any) => {
      item.id = item.id || uid('review');
      item.subjectId = item.subjectId || subjectIdByName.get(item.subject) || null;
      item.topicId = item.topicId || item.topicRef || null;
      item.createdAt = item.createdAt || nowISO();
      item.completedAt = item.completedAt || null;
    });
    (data.simulados || []).forEach((sim: any) => {
      sim.id = sim.id || uid('simulado');
      sim.createdAt = sim.createdAt || nowISO();
      (sim.breakdown || []).forEach((b: any) => {
        b.id = b.id || uid('breakdown');
        b.subjectId = b.subjectId || subjectIdByName.get(b.subject) || null;
      });
    });
    (data.metasPorDisciplina || []).forEach((meta: any) => {
      meta.id = meta.id || uid('goal');
      meta.subjectId = meta.subjectId || subjectIdByName.get(meta.subject) || null;
    });
    (data.studySessions || []).forEach((session: any) => {
      session.id = session.id || uid('session');
      session.subjectId = session.subjectId || subjectIdByName.get(session.subject) || null;
      session.topicId = session.topicId || null;
    });
    data.schemaVersion = 2;
    return data;
  }

  function migrateV2toV3(data: Record<string, any>) {
    (data.subjects || []).forEach((subject: any) =>
      (subject.topics || []).forEach((topic: any) => {
        topic.firstCompletedAt =
          topic.firstCompletedAt ||
          (topic.completedAt ? `${topic.completedAt}T12:00:00.000Z` : null);
        topic.lastCompletedAt = topic.lastCompletedAt || topic.firstCompletedAt || null;
        topic.completionCount = Number(topic.completionCount) || (topic.completedAt ? 1 : 0);
        topic.lastReviewedAt = topic.lastReviewedAt || null;
        topic.reviewCount = Number(topic.reviewCount) || 0;
      })
    );
    if (!Array.isArray(data.topicHistory)) data.topicHistory = [];
    data.topicHistory.forEach((event: any) => {
      if (!event.id) event.id = uid('history');
      if (!event.occurredAt) event.occurredAt = event.date || nowISO();
      if (!event.date) event.date = event.occurredAt;
    });
    (data.subjects || []).forEach((subject: any) =>
      (subject.topics || []).forEach((topic: any) => {
        if (
          topic.completedAt &&
          !data.topicHistory.some(
            (event: any) => event.type === 'topic_completed' && event.topicId === topic.id
          )
        ) {
          const occurredAt = topic.lastCompletedAt || `${topic.completedAt}T12:00:00.000Z`;
          data.topicHistory.push({
            id: uid('history'),
            date: occurredAt,
            occurredAt,
            type: 'topic_completed',
            subjectId: subject.id,
            topicId: topic.id,
            metadata: { migrated: true },
          });
        }
      })
    );
    (data.reviewAgenda || []).forEach((review: any) => {
      const topicId = review.topicId || review.topicRef || null;
      if (
        review.completedAt &&
        !data.topicHistory.some(
          (event: any) =>
            event.type === 'review_completed' && event.metadata?.reviewId === review.id
        )
      ) {
        data.topicHistory.push({
          id: uid('history'),
          date: review.completedAt,
          occurredAt: review.completedAt,
          type: 'review_completed',
          subjectId: review.subjectId || null,
          topicId,
          metadata: { reviewId: review.id, reviewType: review.tipo, migrated: true },
        });
      }
    });
    data.schemaVersion = 3;
    return data;
  }

  function migrateV3toV4(data: Record<string, any>) {
    (data.subjects || []).forEach((subject: any) => {
      if (!('archived' in subject)) subject.archived = false;
      if (!('archivedAt' in subject)) subject.archivedAt = null;
      (subject.topics || []).forEach((topic: any) => {
        if (!('archived' in topic)) topic.archived = false;
        if (!('archivedAt' in topic)) topic.archivedAt = null;
      });
    });
    data.schemaVersion = 4;
    return data;
  }

  function migrateV4toV5(data: Record<string, any>) {
    (data.questoes || []).forEach((question: any) => {
      question.topicId = question.topicId || null;
      const source = question.errorBreakdown || {};
      question.errorBreakdown = {};
      errorCategoryKeys.forEach(key => {
        question.errorBreakdown[key] = Math.max(0, Math.floor(Number(source[key]) || 0));
      });
    });
    data.schemaVersion = 5;
    return data;
  }

  function migrateV5toV6(data: Record<string, any>) {
    if (!Array.isArray(data.topicHistory)) data.topicHistory = [];
    data.topicHistory.forEach(normalizeHistoryEvent);
    data.schemaVersion = 6;
    return data;
  }

  function migrateV6toV7(data: Record<string, any>) {
    if (!data.metas || typeof data.metas !== 'object') data.metas = {};
    const legacyHours = Number(data.metas.horasDiarias);
    const base = Number.isFinite(legacyHours) ? Math.max(0, legacyHours) : 2.5;
    const source =
      data.metas.horasPorDia && typeof data.metas.horasPorDia === 'object'
        ? data.metas.horasPorDia
        : {};
    data.metas.horasPorDia = {};
    for (let day = 0; day < 7; day++)
      data.metas.horasPorDia[String(day)] = Math.max(0, Number(source[String(day)] ?? base) || 0);
    (data.reviewAgenda || []).forEach((review: any) => {
      review.manualDate = Boolean(review.manualDate);
      review.adaptive = review.adaptive !== false;
      review.adaptiveReason = review.adaptiveReason || null;
      review.suggestedDate = review.suggestedDate || null;
      review.baseIntervalDays = Math.max(
        1,
        Number(review.baseIntervalDays) || reviewBaseDaysFromType(review.tipo)
      );
    });
    data.schemaVersion = 7;
    return data;
  }

  function migrateV7toV8(data: Record<string, any>) {
    if (!Array.isArray(data.dailyPlans)) data.dailyPlans = [];
    if (!data.activeTimer || typeof data.activeTimer !== 'object') data.activeTimer = {};
    data.activeTimer.planItemId = data.activeTimer.planItemId || null;
    data.activeTimer.targetMinutes = Number(data.activeTimer.targetMinutes) || null;
    data.schemaVersion = 8;
    return data;
  }

  function migrateV8toV9(data: Record<string, any>) {
    data.examBlueprint = normalizeExamBlueprint(data.examBlueprint, data.examDate);
    data.algorithmVersions = normalizeAlgorithmVersions(data.algorithmVersions);
    (data.subjects || []).forEach((subject: any) =>
      (subject.topics || []).forEach(normalizeTopicStrategy)
    );
    data.schemaVersion = 9;
    return data;
  }

  function migrateV9toV10(data: Record<string, any>) {
    if (!Array.isArray(data.studyPlans)) data.studyPlans = [];
    data.schemaVersion = 10;
    return data;
  }
  function migrateV10toV11(data: Record<string, any>) {
    if (!Array.isArray(data.planAdjustments)) data.planAdjustments = [];
    if (!Array.isArray(data.recommendationFeedback)) data.recommendationFeedback = [];
    (data.dailyPlans || []).forEach((plan: any) =>
      (plan.items || []).forEach((item: any) => {
        item.originalDate = item.originalDate || plan.date;
        item.currentDate = item.currentDate || plan.date;
        item.rescheduleCount = Math.max(0, Number(item.rescheduleCount) || 0);
        item.skippedReason = item.skippedReason || null;
        item.recommendationId = item.recommendationId || null;
      })
    );
    data.schemaVersion = 11;
    return data;
  }
  function migrateV11toV12(data: Record<string, any>) {
    if (!Array.isArray(data.alertStates)) data.alertStates = [];
    data.schemaVersion = 12;
    return data;
  }
  function migrateV12toV13(data: Record<string, any>) {
    (data.dailyPlans || []).forEach((plan: any) => {
      plan.studyPlanId = plan.studyPlanId || null;
      plan.generationOperationId = plan.generationOperationId || null;
      (plan.items || []).forEach((item: any) => {
        item.studyPlanId = item.studyPlanId || null;
        item.studyPlanItemId = item.studyPlanItemId || null;
        item.generationOperationId = item.generationOperationId || null;
        item.rescheduledFromId = item.rescheduledFromId || null;
        item.rescheduleOperationId = item.rescheduleOperationId || null;
      });
    });
    (data.studyPlans || []).forEach((plan: any) => {
      if (!Array.isArray(plan.dailyPlanOperations)) plan.dailyPlanOperations = [];
    });
    (data.planAdjustments || []).forEach((item: any) => {
      item.operationId = item.operationId || null;
      item.changes = Array.isArray(item.changes) ? item.changes : [];
      item.undoneAt = item.undoneAt || null;
    });
    data.schemaVersion = 13;
    return data;
  }
  function migrateV13toV14(data: Record<string, any>) {
    (data.recommendationFeedback || []).forEach((item: any) => {
      item.shownAt = item.shownAt || item.createdAt || null;
      item.ratedAt = item.ratedAt || null;
      item.algorithmVersion = Math.max(1, Number(item.algorithmVersion) || 1);
      item.score = Number.isFinite(Number(item.score)) ? Number(item.score) : null;
      item.confidence = item.confidence || null;
    });
    data.schemaVersion = 14;
    return data;
  }
  function migrateV14toV15(data: Record<string, any>) {
    data.algorithmVersions = normalizeAlgorithmVersions(data.algorithmVersions);
    data.algorithmVersions.adaptiveReview = Math.max(
      2,
      Number(data.algorithmVersions.adaptiveReview) || 2
    );
    (data.subjects || []).forEach((subject: any) =>
      (subject.topics || []).forEach((topic: any) => {
        topic.adaptiveReview = topic.adaptiveReview
          ? createAdaptiveReviewState(topic.adaptiveReview)
          : null;
      })
    );
    (data.reviewAgenda || []).forEach((review: any) => {
      review.lastRating = (REVIEW_RATINGS as Record<string, any>)[review.lastRating!]
        ? review.lastRating
        : null;
      review.adaptiveState = review.adaptiveState
        ? createAdaptiveReviewState(review.adaptiveState)
        : null;
    });
    data.schemaVersion = 15;
    return data;
  }
  function migrateV15toV16(data: Record<string, any>) {
    (data.studySessions || []).forEach((session: any) => {
      session.source = session.source || 'manual';
      session.recommendationId = session.recommendationId || null;
      session.prioritySnapshot =
        session.prioritySnapshot == null || session.prioritySnapshot === ''
          ? null
          : Number.isFinite(Number(session.prioritySnapshot))
            ? Number(session.prioritySnapshot)
            : null;
    });
    (data.recommendationFeedback || []).forEach((item: any) => {
      item.snapshot = item.snapshot || null;
      if (item.outcome && !item.outcome.state)
        item.outcome.state = item.outcome.attributionEligible ? 'neutral' : 'insufficient';
    });
    data.schemaVersion = 16;
    return data;
  }

  function migrateV16toV17(data: Record<string, any>) {
    data.studySessions = (data.studySessions || []).map((session: any) =>
      normalizeStudySession(session)
    );
    data.schemaVersion = 17;
    return data;
  }

  function migrateV17toV18(data: Record<string, any>) {
    data.examBlueprint = normalizeExamBlueprint(data.examBlueprint, data.examDate);
    data.activeTimer = data.activeTimer || {};
    data.activeTimer.strategy = data.activeTimer.strategy || null;
    data.activeTimer.strategyStep = Math.max(0, Number(data.activeTimer.strategyStep) || 0);
    data.schemaVersion = 18;
    return data;
  }

  function migrateV18toV19(data: Record<string, any>) {
    snapshotEvidenceScopes(data);
    data.schemaVersion = 19;
    return data;
  }
  function migrateV19toV20(data: Record<string, any>) {
    data.studySessions = (data.studySessions || []).map((session: any) =>
      normalizeStudySession(session)
    );
    data.schemaVersion = 20;
    return data;
  }
  function migrateV20toV21(data: Record<string, any>) {
    if (!Array.isArray(data.adaptivePlanningHistory)) data.adaptivePlanningHistory = [];
    data.schemaVersion = 21;
    return data;
  }
  function migrateV21toV22(data: Record<string, any>) {
    data.recommendationHistory = Array.isArray(data.recommendationHistory)
      ? data.recommendationHistory
      : migrateRecommendationHistory(data.recommendationFeedback || []);
    data.schemaVersion = 22;
    return data;
  }
  function migrateV22toV23(data: Record<string, any>) {
    data.exams = Array.isArray(data.exams) ? data.exams : [];
    data.examQuestions = Array.isArray(data.examQuestions) ? data.examQuestions : [];
    data.schemaVersion = 23;
    return data;
  }
  function migrateV23toV24(data: Record<string, any>) {
    for (const exam of data.exams || []) {
      exam.importedQuestionCount = null;
      exam.expectedQuestionCount = null;
      exam.unresolvedQuestions = [];
      exam.declaredCoverage = exam.coverage;
    }
    data.schemaVersion = 24;
    return data;
  }
  function migrateV24toV25(data: Record<string, any>) {
    data.readinessSnapshots = Array.isArray(data.readinessSnapshots) ? data.readinessSnapshots : [];
    data.schemaVersion = 25;
    return data;
  }

  function migrateV25toV26(data: Record<string, any>) {
    data.projectionSnapshots = Array.isArray(data.projectionSnapshots)
      ? data.projectionSnapshots
      : [];
    data.schemaVersion = 26;
    return data;
  }
  function migrateV26toV27(data: Record<string, any>) {
    if (!data.metas || typeof data.metas !== 'object') data.metas = {};
    const days = Number(data.metas.consistenciaSemanal);
    data.metas.consistenciaSemanal = Number.isFinite(days)
      ? Math.max(1, Math.min(7, Math.round(days)))
      : 5;
    data.schemaVersion = 27;
    return data;
  }
  function migrateV27toV28(data: Record<string, any>) {
    data.projectionSnapshots = Array.isArray(data.projectionSnapshots)
      ? data.projectionSnapshots
      : [];
    data.schemaVersion = 28;
    return data;
  }
  function migrateState(data: Record<string, any>) {
    return runStateMigrations(data, {
      currentVersion: CURRENT_SCHEMA_VERSION,
      migrations: {
        1: migrateV1toV2,
        2: migrateV2toV3,
        3: migrateV3toV4,
        4: migrateV4toV5,
        5: migrateV5toV6,
        6: migrateV6toV7,
        7: migrateV7toV8,
        8: migrateV8toV9,
        9: migrateV9toV10,
        10: migrateV10toV11,
        11: migrateV11toV12,
        12: migrateV12toV13,
        13: migrateV13toV14,
        14: migrateV14toV15,
        15: migrateV15toV16,
        16: migrateV16toV17,
        17: migrateV17toV18,
        18: migrateV18toV19,
        19: migrateV19toV20,
        20: migrateV20toV21,
        21: migrateV21toV22,
        22: migrateV22toV23,
        23: migrateV23toV24,
        24: migrateV24toV25,
        25: migrateV25toV26,
        26: migrateV26toV27,
        27: migrateV27toV28,
      },
    });
  }
  return { migrateState, normalizeHistoryEvent };
}
