// Precedence applies to an already activated signal, never to an additive score.
export const SIGNAL_PRECEDENCE_VERSION = 1;
export const PRIMARY_SIGNAL_ORDER = Object.freeze([
  'consolidation-risk',
  'critical-gap',
  'plateau',
  'priority-review',
  'critical-coverage',
  'high-priority',
  'collect-evidence',
  'recovery',
  'maintenance',
]);
export const compareSignalIds = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;
export function selectPrimarySignal(signals: Array<Record<string, any>> = []) {
  const rank = (kind: string) => PRIMARY_SIGNAL_ORDER.indexOf(kind);
  return (
    signals
      .filter(signal => signal.active && rank(signal.kind) >= 0)
      .sort(
        (left, right) =>
          rank(left.kind) - rank(right.kind) ||
          compareSignalIds(right.period?.end || '', left.period?.end || '') ||
          compareSignalIds(right.period?.start || '', left.period?.start || '') ||
          compareSignalIds(left.source, right.source) ||
          compareSignalIds(left.sourceId, right.sourceId)
      )[0] || null
  );
}
