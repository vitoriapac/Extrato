const scope = (tags: string[] | null | undefined) => JSON.stringify([...(tags || [])].sort());
export function createAnalysisContext({
  origin,
  subjectId = null,
  topicId = null,
  period = '30',
  activeExamTags = [],
}: any = {}) {
  return { origin, subjectId, topicId, period, activeExamTags: [...activeExamTags] };
}
export function analysisContextInScope(
  context: { activeExamTags?: string[] } | null | undefined,
  activeExamTags: string[] = []
) {
  return Boolean(context) && scope(context!.activeExamTags) === scope(activeExamTags);
}
