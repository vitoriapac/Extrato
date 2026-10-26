export function createHistoricalExamImportState() {
  return { pending: null as Record<string, any> | null };
}

export function clearHistoricalExamImportState(importState: {
  pending: Record<string, any> | null;
}) {
  importState.pending = null;
}
