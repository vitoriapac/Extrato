export const CONFIDENCE_THRESHOLDS = { medium: 0.35, high: 0.7 };

export function confidenceLabel(value: unknown): string {
  const confidence = Math.max(0, Math.min(1, Number(value) || 0));
  return confidence >= CONFIDENCE_THRESHOLDS.high
    ? 'Alta'
    : confidence >= CONFIDENCE_THRESHOLDS.medium
      ? 'Média'
      : 'Baixa';
}

export function createMetricEvidence({
  sampleSize = 0,
  periodStart = null,
  periodEnd = null,
  confidence = 0,
  sources = [],
}: {
  sampleSize?: number;
  periodStart?: string | null;
  periodEnd?: string | null;
  confidence?: number;
  sources?: any[];
} = {}) {
  const normalizedConfidence = Math.max(0, Math.min(1, Number(confidence) || 0));
  return {
    sampleSize: Math.max(0, Math.floor(Number(sampleSize) || 0)),
    periodStart: periodStart || null,
    periodEnd: periodEnd || null,
    confidence: normalizedConfidence,
    confidenceLabel: confidenceLabel(normalizedConfidence),
    sources: [...new Set((sources || []).filter(Boolean))],
  };
}
