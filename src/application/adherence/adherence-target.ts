export function validAdherenceTarget(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 50 && value <= 100)
  );
}

export function normalizeAdherenceTarget(value: unknown): number | null {
  return validAdherenceTarget(value) ? (value as number | null) : 80;
}

// Personal monitoring context. Never feeds readiness, priority or projection status.
export function buildAdherenceTarget(model: any, target: unknown) {
  const value = normalizeAdherenceTarget(target),
    actual = model?.summary?.temporalAdherence ?? null;
  return {
    enabled: value !== null,
    target: value,
    actual,
    period: model?.period ? { ...model.period } : null,
    state:
      value === null
        ? 'disabled'
        : actual === null
          ? 'insufficient_data'
          : actual >= value
            ? 'achieved'
            : 'below_target',
    difference: value === null || actual === null ? null : actual - value,
  };
}
