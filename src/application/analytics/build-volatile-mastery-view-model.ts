/**
 * @fileoverview Constrói o view-model do Grid Analítico 3: Diagnóstico de Domínio Volátil / Falsa Consolidação.
 * Identifica tópicos onde o aluno acertou muitas questões logo após o estudo, mas o rendimento desabou após 14 dias.
 */

import {
  analyzeTopicVolatileMastery,
  type QuestionEvent,
} from '../../domain/analytics/volatile-mastery.js';

export interface VolatileMasteryItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  initialAccuracy: number; // %
  spacedAccuracy: number; // %
  accuracyDrop: number; // pontos percentuais
  daysBetweenAssessments: number;
  sampleQuestionsCount: number;
  status: 'volatile';
  statusLabel: string;
  statusVariant: 'danger' | 'warning';
  recommendation: string;
  actionText: string;
}

export interface VolatileMasteryViewModel {
  volatileTopics: VolatileMasteryItem[];
  totalVolatileCount: number;
  summary: string;
}

export interface BuildVolatileMasteryParams {
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
  }>;
  limit?: number;
}

export function buildVolatileMasteryViewModel({
  subjects = [],
  questoes = [],
  limit = 4,
}: BuildVolatileMasteryParams = {}): VolatileMasteryViewModel {
  // Mapear tópicos e disciplinas
  const topicMap: Record<string, { topicName: string; subjectId: string; subjectName: string }> = {};

  for (const sub of subjects) {
    if (sub.archived) continue;
    for (const t of sub.topics || []) {
      if (t.archived) continue;
      topicMap[t.id] = {
        topicName: t.name,
        subjectId: sub.id,
        subjectName: sub.name,
      };
    }
  }

  // Normalizar eventos de questões
  const eventsByTopic: Record<string, QuestionEvent[]> = {};

  for (const q of questoes) {
    const topicId = q.topicId;
    if (!topicId || !topicMap[topicId]) continue;

    const total = Number(q.total ?? q.resolved ?? 0);
    const correct = Number(q.correct ?? q.hits ?? q.acertos ?? 0);
    const date = q.date;

    if (!date || total <= 0) continue;

    if (!eventsByTopic[topicId]) {
      eventsByTopic[topicId] = [];
    }
    eventsByTopic[topicId].push({
      topicId,
      date,
      total,
      correct,
    });
  }

  const volatileCandidates: VolatileMasteryItem[] = [];

  for (const [topicId, questions] of Object.entries(eventsByTopic)) {
    const meta = topicMap[topicId];
    const diagnostic = analyzeTopicVolatileMastery({
      topicId,
      topicName: meta.topicName,
      questions,
    });

    // Detecta volatilidade: status 'volatile' ou queda substancial >= 15 p.p.
    const drop = diagnostic.accuracyDrop ?? 0;
    const isVolatile = diagnostic.status === 'volatile' || (drop >= 15 && (diagnostic.initialAccuracy ?? 0) >= 75);

    if (isVolatile && diagnostic.initialAccuracy !== null && diagnostic.spacedAccuracy !== null) {
      const isSevere = drop >= 25;
      volatileCandidates.push({
        topicId,
        topicName: meta.topicName,
        subjectId: meta.subjectId,
        subjectName: meta.subjectName,
        initialAccuracy: diagnostic.initialAccuracy,
        spacedAccuracy: diagnostic.spacedAccuracy,
        accuracyDrop: drop,
        daysBetweenAssessments: diagnostic.daysBetweenAssessments ?? 14,
        sampleQuestionsCount: diagnostic.sampleQuestionsCount,
        status: 'volatile',
        statusLabel: isSevere ? 'Falsa Consolidação Severa' : 'Domínio Volátil',
        statusVariant: isSevere ? 'danger' : 'warning',
        recommendation:
          diagnostic.recommendedAction ||
          'Desempenho caiu após intervalo de descanso. Agende revisão ativa com questões imediatas.',
        actionText: 'Agendar revisão ativa',
      });
    }
  }

  // Ordena pela maior queda de retenção (accuracyDrop desc)
  volatileCandidates.sort((a, b) => b.accuracyDrop - a.accuracyDrop);

  const topItems = volatileCandidates.slice(0, limit);
  const totalVolatileCount = volatileCandidates.length;

  let summary = 'Nenhum sinal de falsa consolidação detectado nas revisões espaçadas.';
  if (topItems.length > 0) {
    summary = `${totalVolatileCount} ${totalVolatileCount === 1 ? 'tópico apresenta' : 'tópicos apresentam'} ilusão de competência (alto acerto inicial, mas queda após intervalo).`;
  }

  return {
    volatileTopics: topItems,
    totalVolatileCount,
    summary,
  };
}
