/**
 * @fileoverview Constrói o view-model do Detector de Platô de Rendimento / Retorno Decrescente.
 * Identifica tópicos onde o aluno faz muitas questões, mas a precisão permanece estagnada (< 75%).
 */

import {
  detectTopicPlateau,
  type PlateauDiagnosticResult,
  type PlateauPrescribedStrategy,
} from '../../domain/analytics/plateau-detector.js';

export interface PlateauTopicItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  averageAccuracy: number;
  questionCount: number;
  weeksStagnant: number;
  confidence: 'low' | 'medium' | 'high';
  confidenceLabel: string;
  strategy: PlateauPrescribedStrategy;
  strategyLabel: string;
  strategyVariant: 'warning' | 'info' | 'danger';
  headline: string;
  rationale: string;
  trendAccuracies: number[]; // para sparkline
}

export interface PlateauDetectorViewModel {
  stagnantTopics: PlateauTopicItem[];
  totalAnalyzedTopics: number;
  hasPlateauDetected: boolean;
  summary: string;
}

export interface BuildPlateauDetectorParams {
  subjects?: Array<{
    id: string;
    name: string;
    archived?: boolean;
    topics?: Array<{
      id: string;
      name: string;
      archived?: boolean;
    }>;
  }>;
  questoes?: Array<{
    topicId?: string;
    date?: string;
    total?: number;
    correct?: number;
    resolved?: number;
    hits?: number;
    acertos?: number;
    erros?: number;
    errorBreakdown?: Record<string, number>;
    errorCategory?: string | null;
  }>;
  minQuestions?: number;
}

const STRATEGY_LABELS: Record<PlateauPrescribedStrategy, string> = {
  active_recall: 'Fixação Ativa',
  statute_deep_dive: 'Letra da Lei',
  prerequisite_review: 'Pré-Requisitos',
};

const STRATEGY_VARIANTS: Record<PlateauPrescribedStrategy, PlateauTopicItem['strategyVariant']> = {
  active_recall: 'info',
  statute_deep_dive: 'warning',
  prerequisite_review: 'danger',
};

const CONFIDENCE_LABELS: Record<PlateauDiagnosticResult['confidence'], string> = {
  high: 'Alta Confiança',
  medium: 'Média Confiança',
  low: 'Indício Inicial',
};

export function buildPlateauDetectorViewModel({
  subjects = [],
  questoes = [],
  minQuestions = 40,
}: BuildPlateauDetectorParams = {}): PlateauDetectorViewModel {
  // Mapear tópicos ativos e suas disciplinas
  const topicMap: Record<string, { topicName: string; subjectId: string; subjectName: string }> = {};

  for (const s of subjects) {
    if (s.archived) continue;
    for (const t of s.topics || []) {
      if (t.archived) continue;
      topicMap[t.id] = {
        topicName: t.name,
        subjectId: s.id,
        subjectName: s.name,
      };
    }
  }

  // Agrupar questões por tópico
  const questionsByTopic: Record<
    string,
    Array<{
      date: string;
      resolved: number;
      correct: number;
      errorBreakdown?: Record<string, number>;
      errorCategory?: string | null;
    }>
  > = {};

  for (const q of questoes) {
    const topicId = q.topicId;
    if (!topicId || !topicMap[topicId]) continue;

    const resolved = Number(q.resolved ?? q.total ?? 0);
    const correct = Number(q.correct ?? q.hits ?? q.acertos ?? 0);
    const date = q.date;

    if (!date || resolved <= 0) continue;

    if (!questionsByTopic[topicId]) {
      questionsByTopic[topicId] = [];
    }

    questionsByTopic[topicId].push({
      date,
      resolved,
      correct,
      errorBreakdown: q.errorBreakdown,
      errorCategory: q.errorCategory,
    });
  }

  const stagnantTopics: PlateauTopicItem[] = [];
  let totalAnalyzed = 0;

  for (const [topicId, topicQuestions] of Object.entries(questionsByTopic)) {
    const meta = topicMap[topicId];
    totalAnalyzed++;

    const diag = detectTopicPlateau({
      topicId,
      subjectId: meta.subjectId,
      questions: topicQuestions,
      minQuestions,
    });

    if (diag.hasPlateau) {
      const strategy = diag.prescribedAction.strategy;
      const totalTopicQuestions = topicQuestions.reduce((acc, q) => acc + q.resolved, 0);
      stagnantTopics.push({
        topicId,
        topicName: meta.topicName,
        subjectId: meta.subjectId,
        subjectName: meta.subjectName,
        averageAccuracy: diag.averageAccuracy,
        questionCount: totalTopicQuestions,
        weeksStagnant: diag.weeksStagnant || 4,
        confidence: diag.confidence,
        confidenceLabel: CONFIDENCE_LABELS[diag.confidence],
        strategy,
        strategyLabel: STRATEGY_LABELS[strategy] || 'Intervenção Pedagógica',
        strategyVariant: STRATEGY_VARIANTS[strategy] || 'warning',
        headline: diag.prescribedAction.headline,
        rationale: diag.prescribedAction.rationale,
        trendAccuracies: topicQuestions.slice(-4).map(q => Math.round((q.correct / q.resolved) * 100)),
      });
    }
  }

  // Ordena pelo maior volume de questões (maior retorno decrescente primeiro)
  stagnantTopics.sort((a, b) => b.questionCount - a.questionCount);

  const hasPlateauDetected = stagnantTopics.length > 0;
  let summary = 'Nenhum platô de rendimento identificado. A curva de acertos está respondendo ao volume de estudo.';
  if (hasPlateauDetected) {
    summary = `${stagnantTopics.length} ${stagnantTopics.length === 1 ? 'tópico apresenta' : 'tópicos apresentam'} estagnação em faixa intermediária (< 75%) mesmo com alto volume de questões.`;
  }

  return {
    stagnantTopics,
    totalAnalyzedTopics: totalAnalyzed,
    hasPlateauDetected,
    summary,
  };
}
