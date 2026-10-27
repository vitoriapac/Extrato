/**
 * Simulador "E se?" (src/domain/forecasts/what-if-simulator.ts)
 *
 * Motor de previsão hipotética em memória.
 * Permite que o estudante explore o impacto de ajustes de rotina (minutos adicionais por dia,
 * realocação de foco entre disciplinas) no Índice de Prontidão e na data de prontidão para a prova,
 * com garantia absoluta de isolamento e zero mutação do estado persistido.
 */

import { calculateReadinessScore, clampMetric } from '../analytics/readiness-score.js';

export interface WhatIfSimulationInput {
  /** Minutos adicionais (ou reduzidos) por dia. Ex: +30, +60, -15 */
  dailyMinutesDelta?: number;
  /** Multiplicadores de esforço por disciplina (ex: { "subj-1": 1.5 }) */
  subjectFocusMultipliers?: Record<string, number>;
  /** Pontuação alvo para a prova (default: 80%) */
  targetScore?: number;
  /** Horizonte em dias para a projeção (default: 30) */
  horizonDays?: number;
  /** Métricas atuais do estudante para alimentar a projeção */
  currentMetrics?: {
    readinessScore?: number | null;
    coverageScore?: number | null;
    masteryScore?: number | null;
    retentionScore?: number | null;
    consistencyScore?: number | null;
    weeklyStudyMinutes?: number;
    totalTopicsCount?: number;
    coveredTopicsCount?: number;
    calibratedProjectionCentral?: number | null;
  };
}

export interface WhatIfSimulationMetrics {
  readinessScore: number;
  coveragePercent: number;
  masteryScore: number;
  weeklyStudyHours: number;
  projectedScore: number;
  estimatedDaysToTarget: number | null;
}

export interface WhatIfSimulationResult {
  baseline: WhatIfSimulationMetrics;
  simulated: WhatIfSimulationMetrics;
  delta: {
    readinessScoreDelta: number;
    weeklyStudyHoursDelta: number;
    coveragePercentDelta: number;
    masteryScoreDelta: number;
    projectedScoreDelta: number;
    daysSavedEstimate: number | null;
  };
  insights: string[];
  isStateUnmutated: boolean;
}

/** Duração média estimada em minutos para fechar o ciclo de um novo tópico teórico (estudo + fixação). */
const MINUTES_PER_TOPIC_CYCLE = 90;

/**
 * Executa uma simulação "E se?" puramente em memória.
 * Se um objeto de estado for fornecido, ele é clonado imediatamente via `structuredClone`
 * para assegurar que nenhuma referência persistida seja tocada.
 */
export function simulateWhatIfScenario(
  input: WhatIfSimulationInput = {},
  rawState?: unknown
): WhatIfSimulationResult {
  // Garantia contratual: clonagem estrita e validação de não mutação
  let clonedState: unknown = null;
  let rawStateSignatureBefore = '';
  let rawStateSignatureAfter = '';

  if (rawState && typeof rawState === 'object') {
    rawStateSignatureBefore = JSON.stringify(rawState);
    clonedState = structuredClone(rawState);
  }

  const dailyMinutesDelta = Number(input.dailyMinutesDelta) || 0;
  const targetScore = clampMetric(input.targetScore ?? 80);
  const horizonDays = Math.max(7, Math.min(180, Number(input.horizonDays) || 30));
  const focusMultipliers = input.subjectFocusMultipliers || {};

  // Se o estado foi passado, extrai métricas dele caso currentMetrics não esteja completo
  const stateMetrics = extractMetricsFromClonedState(clonedState);
  const metrics = { ...stateMetrics, ...(input.currentMetrics || {}) };

  const baselineWeeklyMinutes = Math.max(0, Number(metrics.weeklyStudyMinutes) || 600); // 10h default
  const baselineWeeklyHours = Math.round((baselineWeeklyMinutes / 60) * 10) / 10;

  const totalTopics = Math.max(1, Number(metrics.totalTopicsCount) || 50);
  const baselineCoveredTopics = Math.max(
    0,
    Math.min(totalTopics, Number(metrics.coveredTopicsCount) || 15)
  );
  const baselineCoverage = clampMetric(
    metrics.coverageScore ?? Math.round((baselineCoveredTopics / totalTopics) * 100)
  );

  const baselineMastery = clampMetric(metrics.masteryScore ?? 60);
  const baselineRetention = clampMetric(metrics.retentionScore ?? 65);
  const baselineConsistency = clampMetric(metrics.consistencyScore ?? 70);
  const baselineProjected = clampMetric(metrics.calibratedProjectionCentral ?? baselineMastery);

  // Calcula Índice de Prontidão Base
  const baselineReadiness = clampMetric(
    metrics.readinessScore ??
      calculateReadinessScore({
        coverage: { score: baselineCoverage, available: true, confidence: 0.8 },
        mastery: { score: baselineMastery, available: true, confidence: 0.75 },
        retention: { score: baselineRetention, available: true, confidence: 0.7 },
        consistency: { score: baselineConsistency, available: true, confidence: 0.8 },
      }).value ??
      60
  );

  // 1. Simulação do Volume Temporal
  const simulatedWeeklyMinutes = Math.max(0, baselineWeeklyMinutes + dailyMinutesDelta * 7);
  const simulatedWeeklyHours = Math.round((simulatedWeeklyMinutes / 60) * 10) / 10;
  const weeklyStudyHoursDelta = Math.round((simulatedWeeklyHours - baselineWeeklyHours) * 10) / 10;

  // 2. Simulação de Cobertura de Tópicos
  // Quantas horas adicionais geradas no horizonte de dias?
  const horizonWeeks = horizonDays / 7;
  const totalExtraMinutesInHorizon = dailyMinutesDelta * 7 * horizonWeeks;
  const additionalTopicsCovered = Math.max(
    0,
    Math.floor(totalExtraMinutesInHorizon / MINUTES_PER_TOPIC_CYCLE)
  );

  const simulatedCoveredTopics = Math.min(
    totalTopics,
    baselineCoveredTopics + additionalTopicsCovered
  );
  const simulatedCoverage = clampMetric(Math.round((simulatedCoveredTopics / totalTopics) * 100));
  const coveragePercentDelta = simulatedCoverage - baselineCoverage;

  // 3. Simulação de Domínio e Foco
  // Multiplicador médio de foco por peso
  const multiplierValues = Object.values(focusMultipliers).filter(v => Number.isFinite(v) && v > 0);
  const avgFocusMultiplier =
    multiplierValues.length > 0
      ? multiplierValues.reduce((a, b) => a + b, 0) / multiplierValues.length
      : 1.0;

  // Ganho de domínio baseado no esforço deliberado adicional e foco
  // Ex: 30h adicionais em 30 dias geram ~+4 a +8 pontos de domínio
  const horizonStudyHours = (simulatedWeeklyMinutes / 60) * horizonWeeks;
  const baselineHorizonHours = (baselineWeeklyMinutes / 60) * horizonWeeks;
  const extraHours = Math.max(-baselineHorizonHours, horizonStudyHours - baselineHorizonHours);

  // Eficiência de conversão: ~0.25 pontos de domínio por hora líquida adicional, modulada por foco
  const masteryGain = Math.round(
    extraHours * 0.25 * Math.min(1.5, Math.max(0.7, avgFocusMultiplier))
  );
  const simulatedMastery = clampMetric(baselineMastery + masteryGain);
  const masteryScoreDelta = simulatedMastery - baselineMastery;

  // 4. Simulação de Retenção e Consistência
  const simulatedRetention = clampMetric(baselineRetention + Math.round(masteryGain * 0.4));
  const simulatedConsistency =
    dailyMinutesDelta > 0
      ? clampMetric(Math.min(100, baselineConsistency + 5))
      : dailyMinutesDelta < 0
        ? clampMetric(Math.max(30, baselineConsistency - 8))
        : baselineConsistency;

  // 5. Novo Índice de Prontidão Simulado
  const simulatedReadiness = clampMetric(
    calculateReadinessScore({
      coverage: { score: simulatedCoverage, available: true, confidence: 0.85 },
      mastery: { score: simulatedMastery, available: true, confidence: 0.8 },
      retention: { score: simulatedRetention, available: true, confidence: 0.75 },
      consistency: { score: simulatedConsistency, available: true, confidence: 0.85 },
    }).value ?? baselineReadiness
  );
  const readinessScoreDelta = simulatedReadiness - baselineReadiness;

  // 6. Projeção de Nota Calibrada
  const projectedScoreDelta = Math.round(masteryScoreDelta * 0.85);
  const simulatedProjected = clampMetric(baselineProjected + projectedScoreDelta);

  // 7. Estimativa de Dias até a Meta
  const baselineGap = Math.max(0, targetScore - baselineReadiness);
  const simulatedGap = Math.max(0, targetScore - simulatedReadiness);

  // Taxa de prontidão ganha por dia útil de estudo
  const baselineDailyRate = Math.max(0.05, (baselineWeeklyHours / 7) * 0.15);
  const simulatedDailyRate = Math.max(0.05, (simulatedWeeklyHours / 7) * 0.15);

  const estimatedDaysBaseline = baselineGap > 0 ? Math.round(baselineGap / baselineDailyRate) : 0;
  const estimatedDaysSimulated =
    simulatedGap > 0 ? Math.round(simulatedGap / simulatedDailyRate) : 0;
  const daysSavedEstimate =
    estimatedDaysBaseline > 0 && estimatedDaysSimulated >= 0
      ? Math.max(0, estimatedDaysBaseline - estimatedDaysSimulated)
      : null;

  // 8. Síntese de Insights
  const insights: string[] = [];

  if (dailyMinutesDelta > 0) {
    const weeklyAddHours = Math.round(((dailyMinutesDelta * 7) / 60) * 10) / 10;
    insights.push(
      `+${dailyMinutesDelta} min/dia somam ${weeklyAddHours} horas extras por semana (+${Math.round(totalExtraMinutesInHorizon / 60)}h no horizonte de ${horizonDays} dias).`
    );
    if (additionalTopicsCovered > 0) {
      insights.push(
        `Capacidade suficiente para avançar em até ${additionalTopicsCovered} novos tópicos do edital, elevando a cobertura de ${baselineCoverage}% para ${simulatedCoverage}%.`
      );
    }
    if (daysSavedEstimate && daysSavedEstimate > 0) {
      insights.push(
        `Antecipação estimada da prontidão para a meta de ${targetScore}% em cerca de ${daysSavedEstimate} dias.`
      );
    }
  } else if (dailyMinutesDelta < 0) {
    insights.push(
      `Reduzir ${Math.abs(dailyMinutesDelta)} min/dia desacelera a cobertura do edital em ${Math.abs(coveragePercentDelta)}% e adia o alcance da meta.`
    );
  } else {
    insights.push(
      `Mantendo o ritmo atual (${baselineWeeklyHours}h/semana), a prontidão estimada em ${horizonDays} dias é de ${simulatedReadiness}%.`
    );
  }

  if (avgFocusMultiplier > 1.1) {
    insights.push(
      `O direcionamento de esforço para disciplinas de maior relevância potencializou o índice de prontidão em +${readinessScoreDelta} pts.`
    );
  }

  // Validação final de integridade e não mutação
  if (rawState && typeof rawState === 'object') {
    rawStateSignatureAfter = JSON.stringify(rawState);
  }
  const isStateUnmutated = rawStateSignatureBefore === rawStateSignatureAfter;

  return {
    baseline: {
      readinessScore: baselineReadiness,
      coveragePercent: baselineCoverage,
      masteryScore: baselineMastery,
      weeklyStudyHours: baselineWeeklyHours,
      projectedScore: baselineProjected,
      estimatedDaysToTarget: estimatedDaysBaseline,
    },
    simulated: {
      readinessScore: simulatedReadiness,
      coveragePercent: simulatedCoverage,
      masteryScore: simulatedMastery,
      weeklyStudyHours: simulatedWeeklyHours,
      projectedScore: simulatedProjected,
      estimatedDaysToTarget: estimatedDaysSimulated,
    },
    delta: {
      readinessScoreDelta,
      weeklyStudyHoursDelta,
      coveragePercentDelta,
      masteryScoreDelta,
      projectedScoreDelta,
      daysSavedEstimate,
    },
    insights,
    isStateUnmutated,
  };
}

/**
 * Extrai estimativas de métricas a partir de um objeto de estado serializável da aplicação.
 */
function extractMetricsFromClonedState(
  state: any
): Partial<WhatIfSimulationInput['currentMetrics']> {
  if (!state || typeof state !== 'object') return {};

  const subjects = Array.isArray(state.subjects) ? state.subjects : [];
  let totalTopics = 0;
  let coveredTopics = 0;

  for (const s of subjects) {
    if (Array.isArray(s.topics)) {
      totalTopics += s.topics.length;
      for (const t of s.topics) {
        if (t.completed || (t.totalSeconds && t.totalSeconds > 0)) {
          coveredTopics++;
        }
      }
    }
  }

  // Horas semanais configuradas em metas
  let weeklyMinutes = 600;
  if (state.metas && state.metas.horasPorDia && typeof state.metas.horasPorDia === 'object') {
    const dailyHoursSum = Object.values(state.metas.horasPorDia).reduce(
      (sum: number, val: any) => sum + (Number(val) || 0),
      0
    );
    if (dailyHoursSum > 0) {
      weeklyMinutes = Math.round(dailyHoursSum * 60);
    }
  }

  return {
    totalTopicsCount: totalTopics || 50,
    coveredTopicsCount: coveredTopics || 15,
    weeklyStudyMinutes: weeklyMinutes,
  };
}
