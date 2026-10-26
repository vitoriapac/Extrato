// Shared inputs for the existing gap engine in the overview and consolidated diagnosis.
export function buildTopicGapInputs(
  candidates: Array<Record<string, any>> = [],
  {
    resolveAccuracyTarget = (_: unknown, item: Record<string, any>) => item.accuracyTarget ?? null,
    topicName = (_item: unknown): string | null => null,
    subjectName = (_item: unknown): string | null => null,
  }: any = {}
) {
  return candidates.map(item => ({
    subjectId: item.subjectId,
    topicId: item.topicId,
    accuracy: item.diagnosis?.performance?.accuracy ?? null,
    accuracyTarget: resolveAccuracyTarget(item.subjectId, item),
    name: item.topicName || topicName(item.topicId) || 'Tópico removido',
    subjectName: item.subjectName || subjectName(item.subjectId) || 'Disciplina removida',
    mastery: item.mastery,
    examImpact: item.examImpact,
    retention: item.retention,
    coverage: item.coverage,
    trendRisk: item.trendRisk ?? item.risk?.value ?? null,
    evidenceStrength: item.evidenceStrength ?? item.evidence?.evidenceStrength ?? null,
  }));
}
