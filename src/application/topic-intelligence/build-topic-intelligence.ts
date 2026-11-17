/**
 * Caso de uso da Ficha Inteligente do Tópico (FIT-01 a FIT-10).
 *
 * Reúne indicadores já produzidos pelos motores existentes (disciplinas,
 * métricas de questões, retenção, bookmark, prioridade e recomendações),
 * sem recalcular fórmulas próprias e sem mutar o estado.
 */

import type {
  TopicIntelligenceConfidence,
  TopicIntelligenceSnapshot,
} from '../../domain/topic-intelligence/topic-intelligence-types.js';
import { formatBookmarkLabel } from '../../domain/topic-bookmark.js';
import { buildPracticeLinks } from '../../domain/questions/practice-link-generator.js';
import {
  buildStudyAction,
  recommendationActionLabel,
} from '../recommendations/recommendation-action.js';

export interface BuildTopicIntelligenceInput {
  examId?: string | null;
  examLabel?: string | null;
  subject: Record<string, any> | null | undefined;
  topic: Record<string, any> | null | undefined;
  todayLocalDate?: string | null;
  questionStats?: {
    totalQuestions?: number;
    correctCount?: number;
    accuracyPercent?: number | null;
    periodLabel?: string | null;
  } | null;
  reviewsCount?: number;
  retentionInfo?: {
    statusLabel?: string;
    confidence?: TopicIntelligenceConfidence;
    lastActivityLocalDate?: string | null;
    daysSinceLastActivity?: number | null;
  } | null;
  diagnosisRow?: Record<string, any> | null;
  recommendation?: Record<string, any> | null;
  source?: string;
}

function computeChecklistCoverage(topic: Record<string, any>): {
  theoryCompleted: boolean;
  questionsCompleted: boolean;
  reviewCompleted: boolean;
  coveragePercent: number | null;
} {
  const checklist = topic?.stageChecklist || null;
  const theoryCompleted = Boolean(checklist?.theory);
  const questionsCompleted = Boolean(checklist?.questions);
  const reviewCompleted = Boolean(checklist?.review);

  if (!checklist) {
    return {
      theoryCompleted: false,
      questionsCompleted: false,
      reviewCompleted: false,
      coveragePercent: null,
    };
  }

  const completedStages = [theoryCompleted, questionsCompleted, reviewCompleted].filter(Boolean).length;
  return {
    theoryCompleted,
    questionsCompleted,
    reviewCompleted,
    coveragePercent: Math.round((completedStages / 3) * 100),
  };
}

function resolvePriorityClassification(
  diagnosisRow: Record<string, any> | null | undefined,
  recommendation: Record<string, any> | null | undefined
): string {
  const severity = diagnosisRow?.severity || recommendation?.severity;
  if (severity === 'critical') return 'Prioridade alta';
  if (severity === 'important') return 'Prioridade média';
  if (diagnosisRow?.state === 'controlled') return 'Controlado';
  if (recommendation?.priorityLabel) return String(recommendation.priorityLabel);
  if (recommendation?.score != null) return 'Priorizado no plano';
  return 'Sem classificação prioritária';
}

export function buildTopicIntelligence(
  input: BuildTopicIntelligenceInput
): TopicIntelligenceSnapshot | null {
  const { subject, topic } = input;
  if (!subject?.id || !topic?.id) return null;

  const totalQuestions = Math.max(0, Number(input.questionStats?.totalQuestions ?? 0));
  const correctCount = Math.max(0, Number(input.questionStats?.correctCount ?? 0));
  const accuracyPercent =
    totalQuestions > 0
      ? input.questionStats?.accuracyPercent != null
        ? Math.round(Number(input.questionStats.accuracyPercent))
        : Math.round((correctCount / totalQuestions) * 100)
      : null;

  const reviewsCount = Math.max(0, Number(input.reviewsCount ?? 0));
  const checklist = computeChecklistCoverage(topic);

  const builtAction = input.recommendation
    ? buildStudyAction(input.recommendation, { source: input.source || 'overview' })
    : null;

  const reasons: string[] = [];
  if (Array.isArray(input.recommendation?.reasons)) {
    for (const reason of input.recommendation.reasons) {
      if (reason && !reasons.includes(String(reason))) reasons.push(String(reason));
    }
  }
  if (Array.isArray(input.diagnosisRow?.reasons)) {
    for (const reason of input.diagnosisRow.reasons) {
      if (reason && !reasons.includes(String(reason))) reasons.push(String(reason));
    }
  }

  const hasPracticeData = totalQuestions > 0 || reviewsCount > 0 || checklist.coveragePercent !== null;
  const insufficientData = !hasPracticeData && !input.diagnosisRow && !builtAction;

  const bookmarkLabel = topic.bookmark ? formatBookmarkLabel(topic.bookmark) || null : null;
  const practiceLinks = buildPracticeLinks({
    subjectName: subject.name || '',
    topicName: topic.name || '',
    customUrl: topic.customPracticeUrl || topic.link || null,
  });

  const confidence: TopicIntelligenceConfidence =
    input.retentionInfo?.confidence ||
    (totalQuestions >= 20 ? 'strong' : totalQuestions > 0 || reviewsCount > 0 ? 'limited' : 'insufficient');

  return {
    examId: input.examId || null,
    examLabel: input.examLabel || null,
    subjectId: String(subject.id),
    subjectName: String(subject.name || 'Disciplina'),
    topicId: String(topic.id),
    topicName: String(topic.name || 'Tópico'),
    syllabusReference: topic.syllabusReference ? String(topic.syllabusReference) : null,
    progress: {
      ...checklist,
      questionsCount: totalQuestions,
      reviewsCount,
    },
    performance: {
      accuracyPercent,
      correctCount,
      totalQuestions,
      periodLabel: input.questionStats?.periodLabel || null,
    },
    retention: {
      statusLabel:
        input.retentionInfo?.statusLabel ||
        (insufficientData ? 'Sem evidência suficiente' : 'Acompanhamento em andamento'),
      confidence,
      lastActivityLocalDate: input.retentionInfo?.lastActivityLocalDate || null,
      daysSinceLastActivity: input.retentionInfo?.daysSinceLastActivity ?? null,
    },
    priority: {
      classification: insufficientData
        ? 'Evidência insuficiente'
        : resolvePriorityClassification(input.diagnosisRow, input.recommendation),
      score: builtAction?.priority ?? null,
      reasons: reasons.slice(0, 4),
    },
    bookmarkLabel,
    practiceLinks: practiceLinks
      ? {
          tecUrl: practiceLinks.tecUrl,
          qcUrl: practiceLinks.qcUrl,
          customUrl: practiceLinks.customUrl || null,
        }
      : null,
    nextAction: builtAction
      ? {
          id: builtAction.id,
          label: recommendationActionLabel(builtAction),
          activityType: builtAction.activityType,
          suggestedMinutes: builtAction.suggestedMinutes,
          action: builtAction,
        }
      : null,
    insufficientData,
    neutralMessage: insufficientData
      ? 'Ainda não há registros suficientes neste tópico. Inicie uma sessão ou registre questões para liberar o diagnóstico.'
      : null,
    mutatedState: false,
  };
}
