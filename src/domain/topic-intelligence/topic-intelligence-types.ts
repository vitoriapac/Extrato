/**
 * Tipos de domínio da Ficha Inteligente do Tópico (FIT-01 a FIT-10).
 *
 * A ficha atua como agregador somente-leitura sobre os motores existentes,
 * sem fórmula própria de prioridade ou efeitos colaterais de persistência.
 */

export type TopicIntelligenceConfidence = 'insufficient' | 'limited' | 'strong';

export interface TopicIntelligenceProgress {
  theoryCompleted: boolean;
  questionsCompleted: boolean;
  reviewCompleted: boolean;
  questionsCount: number;
  reviewsCount: number;
  coveragePercent: number | null;
}

export interface TopicIntelligencePerformance {
  accuracyPercent: number | null;
  correctCount: number;
  totalQuestions: number;
  periodLabel: string | null;
}

export interface TopicIntelligenceRetention {
  statusLabel: string;
  confidence: TopicIntelligenceConfidence;
  lastActivityLocalDate: string | null;
  daysSinceLastActivity: number | null;
}

export interface TopicIntelligencePriority {
  classification: string;
  score: number | null;
  reasons: string[];
}

export interface TopicIntelligenceSnapshot {
  examId: string | null;
  examLabel: string | null;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  syllabusReference: string | null;
  progress: TopicIntelligenceProgress;
  performance: TopicIntelligencePerformance;
  retention: TopicIntelligenceRetention;
  priority: TopicIntelligencePriority;
  bookmarkLabel: string | null;
  practiceLinks: {
    tecUrl: string;
    qcUrl: string;
    customUrl?: string | null;
  } | null;
  nextAction: {
    id: string;
    label: string;
    activityType: string;
    suggestedMinutes: number | null;
    action: Record<string, any>;
  } | null;
  insufficientData: boolean;
  neutralMessage: string | null;
  mutatedState: false;
}
