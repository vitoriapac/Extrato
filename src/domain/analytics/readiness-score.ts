import { pluralize } from '../../core/utils.js';
import { describeScoreEvidence } from './score-evidence.js';

export function clampMetric(value: unknown) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

export function calculateWeightedScore(metrics: any, weights: Record<string, number>) {
  return clampMetric(
    Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + (Number(metrics?.[key]?.score) || 0) * weight,
      0
    )
  );
}

export function calculateWeightedConfidence(metrics: any, weights: Record<string, number>) {
  return Math.max(
    0,
    Math.min(
      1,
      Object.entries(weights).reduce(
        (sum, [key, weight]) => sum + (Number(metrics?.[key]?.confidence) || 0) * weight,
        0
      )
    )
  );
}

export const READINESS_ALGORITHM_VERSION = 2;

export const READINESS_LEGACY_WEIGHTS_V1 = Object.freeze({
  coverage: 0.3,
  mastery: 0.25,
  retention: 0.2,
  consistency: 0.15,
  simulations: 0.1,
});

export const READINESS_WEIGHTS = Object.freeze({
  coverage: 0.35,
  mastery: 0.3,
  retention: 0.25,
  simulations: 0.1,
});

export const READINESS_WEIGHTS_MEDIUM_SIMULATIONS = Object.freeze({
  coverage: 0.25,
  mastery: 0.3,
  retention: 0.2,
  simulations: 0.25,
});

export const READINESS_WEIGHTS_HIGH_SIMULATIONS = Object.freeze({
  coverage: 0.2,
  mastery: 0.25,
  retention: 0.2,
  simulations: 0.35,
});

export interface ReadinessScoreOptions {
  comparableSimulationsCount?: number | null;
  weights?: Record<string, number>;
}

/**
 * Seleciona pesos dinâmicos para o Índice de Prontidão conforme a quantidade de simulados comparáveis.
 * Consistência não compõe a Prontidão v2 (permanece como métrica de hábito).
 */
export function resolveDynamicReadinessWeights(
  comparableSimulationsCount: number | null | undefined = 0
): Record<string, number> {
  const count = Math.max(0, Number(comparableSimulationsCount) || 0);
  if (count >= 4) return { ...READINESS_WEIGHTS_HIGH_SIMULATIONS };
  if (count >= 2) return { ...READINESS_WEIGHTS_MEDIUM_SIMULATIONS };
  return { ...READINESS_WEIGHTS };
}

function isReadinessOptions(value: unknown): value is ReadinessScoreOptions {
  return Boolean(
    value &&
      typeof value === 'object' &&
      ('comparableSimulationsCount' in value || 'weights' in value)
  );
}

export function calculateReadinessScore(
  metrics: any,
  weightsOrOptions: Record<string, number> | ReadinessScoreOptions = {}
) {
  const resolvedWeights: Record<string, number> = isReadinessOptions(weightsOrOptions)
    ? weightsOrOptions.weights ||
      resolveDynamicReadinessWeights(
        weightsOrOptions.comparableSimulationsCount ??
          metrics?.simulations?.count ??
          metrics?.simulations?.comparableCount ??
          0
      )
    : Object.keys(weightsOrOptions || {}).length > 0
      ? (weightsOrOptions as Record<string, number>)
      : resolveDynamicReadinessWeights(
          metrics?.simulations?.count ?? metrics?.simulations?.comparableCount ?? 0
        );
  const entries = Object.entries(resolvedWeights);
  const available = entries.filter(
    ([key]) => metrics?.[key]?.available && Number.isFinite(Number(metrics[key].score))
  );
  const missingFactors = entries
    .filter(([key]) => !available.some(([availableKey]) => availableKey === key))
    .map(([key]) => key);
  if (!available.length)
    return {
      value: null as number | null,
      confidence: 0,
      confidenceLabel: 'Baixa',
      state: 'empty',
      factors: Object.fromEntries(entries.map(([key]): [string, null] => [key, null])),
      missingFactors,
      availableFactors: [] as string[],
      evidence: describeScoreEvidence(),
      reasons: ['sem fatores disponíveis'],
      weights: { ...resolvedWeights },
      algorithmVersion: READINESS_ALGORITHM_VERSION,
    };
  const availableWeight = available.reduce((sum, [, weight]) => sum + weight, 0);
  const value = clampMetric(
    available.reduce((sum, [key, weight]) => sum + Number(metrics[key].score) * weight, 0) /
      availableWeight
  );
  const evidenceConfidence =
    available.reduce(
      (sum, [key, weight]) => sum + (Number(metrics[key].confidence) || 0) * weight,
      0
    ) / availableWeight;
  const coverageFactor = available.length / entries.length;
  const confidence = Math.max(0, Math.min(1, evidenceConfidence * (0.55 + 0.45 * coverageFactor)));
  return {
    value,
    confidence,
    confidenceLabel: confidence >= 0.7 ? 'Alta' : confidence >= 0.35 ? 'Média' : 'Baixa',
    state: available.length < 2 ? 'insufficient' : 'estimated',
    factors: Object.fromEntries(
      entries.map(([key]) => [key, metrics?.[key]?.available ? Number(metrics[key].score) : null])
    ),
    missingFactors,
    availableFactors: available.map(([key]) => key),
    evidence: describeScoreEvidence({
      completeness: availableWeight / entries.reduce((sum, [, weight]) => sum + weight, 0),
      evidenceStrength: evidenceConfidence,
    }),
    reasons: missingFactors.length
      ? [pluralize(missingFactors.length, 'fator', 'fatores') + ' aguardando dados']
      : ['todos os fatores disponíveis'],
    weights: { ...resolvedWeights },
    algorithmVersion: READINESS_ALGORITHM_VERSION,
  };
}
