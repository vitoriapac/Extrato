/**
 * @fileoverview Constrói o view-model do Grid Analítico 2: Radar de Vulnerabilidades Críticas.
 * Identifica os tópicos com maior risco de perda de pontos na prova (alta incidência × domínio frágil).
 */

import { buildExamMasteryMatrix } from '../../domain/analytics/exam-mastery-matrix.js';

export interface CriticalVulnerabilityItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  incidence: string;
  mastery: number;
  target: number;
  gap: number;
  urgency: 'critical' | 'high';
  urgencyLabel: string;
  urgencyVariant: 'danger' | 'warning';
  actionText: string;
}

export interface CriticalVulnerabilitiesViewModel {
  vulnerabilities: CriticalVulnerabilityItem[];
  totalVulnerabilitiesCount: number;
  /** Tópicos com domínio medido; zero quer dizer "sem evidência", não "tudo certo". */
  measuredTopicsCount: number;
  summary: string;
}

export interface BuildCriticalVulnerabilitiesParams {
  subjects?: any[];
  blueprint?: any;
  metricsByTopic?: Record<string, any>;
  masteryTargets?: Record<string, unknown>;
  activeExamTags?: string[];
  limit?: number;
}

export function buildCriticalVulnerabilitiesViewModel({
  subjects = [],
  blueprint = {},
  metricsByTopic = {},
  masteryTargets = {},
  activeExamTags = blueprint?.activeExamTags || [],
  limit = 4,
}: BuildCriticalVulnerabilitiesParams = {}): CriticalVulnerabilitiesViewModel {
  // Constrói matriz de domínio com inteligência de edital
  const matrix = buildExamMasteryMatrix({
    subjects,
    blueprint,
    metricsByTopic,
    masteryTargets,
    activeExamTags,
  });

  const candidates: Array<{
    item: CriticalVulnerabilityItem;
    severityScore: number;
  }> = [];
  let measuredTopicsCount = 0;

  for (const sub of matrix) {
    for (const t of sub.topics || []) {
      // Sem domínio medido (nenhuma questão) não é vulnerabilidade: é falta de evidência.
      if (t.mastery == null) continue;
      measuredTopicsCount += 1;

      const masteryVal = Number(t.mastery ?? 0);
      const targetVal = Number(t.target ?? 80);
      const gapVal = Math.max(0, targetVal - masteryVal);

      // Critério: domínio frágil (< 75% ou abaixo da meta com gap >= 10)
      const isFragile = masteryVal < 75 || gapVal >= 10;
      if (!isFragile) continue;

      // Incidência e peso relativo
      const incStr = String(t.incidence || '').toLowerCase();
      const hasHighIncidence =
        incStr.includes('alta') ||
        incStr.includes('high') ||
        incStr.includes('muito') ||
        Number(t.examMetrics?.historicalWeight) > 5;

      const incWeight = hasHighIncidence ? 2.5 : 1.0;
      const severityScore = gapVal * incWeight;

      const isCritical = hasHighIncidence || gapVal >= 25;

      candidates.push({
        severityScore,
        item: {
          topicId: t.topicId,
          topicName: t.name,
          subjectId: sub.subjectId,
          subjectName: sub.name,
          incidence: hasHighIncidence ? 'Alta Incidência' : 'Média Incidência',
          mastery: Math.round(masteryVal),
          target: Math.round(targetVal),
          gap: Math.round(gapVal),
          urgency: isCritical ? 'critical' : 'high',
          urgencyLabel: isCritical ? 'Vulnerabilidade Crítica' : 'Atenção Elevada',
          urgencyVariant: isCritical ? 'danger' : 'warning',
          actionText: 'Treinar questões',
        },
      });
    }
  }

  // Ordena por pontuação de severidade decrescente
  candidates.sort((a, b) => b.severityScore - a.severityScore);

  const topItems = candidates.slice(0, limit).map(c => c.item);
  const totalCount = candidates.length;

  let summary = 'Nenhuma vulnerabilidade crítica detectada no escopo do edital.';
  if (topItems.length > 0) {
    summary = `${totalCount} ${totalCount === 1 ? 'tópico prioritário requer' : 'tópicos prioritários requerem'} reforço antes da prova.`;
  }

  return {
    vulnerabilities: topItems,
    totalVulnerabilitiesCount: totalCount,
    measuredTopicsCount,
    summary,
  };
}
