// Keep the adaptive planner's candidate semantics while removing archived or out-of-scope topics.
export function buildRecoveryCandidates({
  candidates = [],
  topicRisks = [],
  eligibleSubjectIds = null,
  eligibleTopicIds = null,
}: any = {}) {
  const subjectIds = eligibleSubjectIds ? new Set(eligibleSubjectIds) : null;
  const topicIds = eligibleTopicIds ? new Set(eligibleTopicIds) : null;
  const eligible = candidates.filter(
    (item: any) =>
      item?.subjectId &&
      !item.archived &&
      !item.subjectArchived &&
      !item.topicArchived &&
      (!subjectIds || subjectIds.has(item.subjectId)) &&
      (!topicIds || (item.topicId && topicIds.has(item.topicId)))
  );
  const riskIds = new Set(topicRisks.map((item: any) => `${item.subjectId}:${item.topicId}`));
  const riskSubjects = new Set(
    eligible
      .filter((item: any) => riskIds.has(`${item.subjectId}:${item.topicId}`))
      .map((item: any) => item.subjectId)
  );
  return { eligible, riskSubjects };
}
