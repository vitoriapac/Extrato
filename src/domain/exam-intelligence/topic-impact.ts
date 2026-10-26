import { resolveTopicExamImpact } from '../analytics/topic-strategy.js';
import { EXAM_CONFIDENCE_LABELS } from './exam-confidence.js';
import { comparableExamEvidence } from './exam-evidence.js';
import { isHighImpact } from '../strategy/config.js';

const level = (value: number | null | undefined) =>
  value == null ? 'Sem dados' : isHighImpact(value) ? 'Alta' : value >= 40 ? 'Moderada' : 'Baixa';
const round = (value: number) => Math.round(value * 100) / 100;

export function buildTopicImpact({
  topic = {},
  subjectConfig = null,
  activeExamTags = [],
  incidence = null,
  exams = [],
  examQuestions = [],
}: Record<string, any> = {}) {
  const current = resolveTopicExamImpact({ topic, subjectConfig, activeExamTags });
  const officialForScope = Boolean(
    subjectConfig?.official &&
    subjectConfig?.sourceRef &&
    (!activeExamTags.length ||
      activeExamTags.some((tag: string) => subjectConfig.sourceRef.startsWith(tag)))
  );
  const sourceType =
    current.source === 'manual'
      ? 'manual'
      : current.source === 'catalog'
        ? 'estimated'
        : current.source === 'subject'
          ? officialForScope
            ? 'official'
            : 'manual'
          : null;
  const evidence = comparableExamEvidence({ exams, questions: examQuestions, activeExamTags });
  const examIds = new Set(evidence.completeExams.map(exam => exam.id));
  const weights = examQuestions
    .filter(
      (question: Record<string, any>) =>
        examIds.has(question.examId) && question.topicId === topic.id && question.weight != null
    )
    .map((question: Record<string, any>): number => question.weight);
  const historicalWeight = weights.length
    ? round(weights.reduce((sum: number, value: number) => sum + value, 0) / weights.length)
    : null;
  const officialWeight = officialForScope ? subjectConfig.questionWeight : null;
  return Object.freeze({
    topicId: topic.id,
    impactValue: current.value,
    impactSource: current.source,
    impactSourceType: sourceType,
    impactSourceLabel:
      sourceType === 'official' ? 'Peso oficial da disciplina' : current.sourceLabel,
    officialWeight,
    historicalWeight,
    historicalWeightSourceType: historicalWeight == null ? null : 'historical',
    historicalWeightQuestionCount: weights.length,
    incidenceSourceType: incidence?.presencePercent == null ? null : 'historical',
    presencePercent: incidence?.presencePercent ?? null,
    presenceLevel: level(incidence?.presencePercent),
    participationPercent: incidence?.participationPercent ?? null,
    recentPresentCount: incidence?.recentPresentCount ?? 0,
    recentExamCount: incidence?.recentExamCount ?? 0,
    recentPresenceLevel: level(
      incidence?.recentExamCount
        ? (incidence.recentPresentCount / incidence.recentExamCount) * 100
        : null
    ),
    presentExamCount: incidence?.presentExamCount ?? 0,
    analyzedExamCount: incidence?.analyzedExamCount ?? 0,
    questionCount: incidence?.questionCount ?? 0,
    analyzedQuestionCount: incidence?.analyzedQuestionCount ?? 0,
    confidence: incidence?.confidence ?? 'insufficient',
    confidenceLabel:
      EXAM_CONFIDENCE_LABELS[incidence?.confidence as keyof typeof EXAM_CONFIDENCE_LABELS] ||
      EXAM_CONFIDENCE_LABELS.insufficient,
  });
}
