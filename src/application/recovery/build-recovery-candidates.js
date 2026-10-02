// Keep the adaptive planner's candidate semantics while removing archived or out-of-scope topics.
export function buildRecoveryCandidates({candidates=[],topicRisks=[],eligibleSubjectIds=null,eligibleTopicIds=null}={}){
  const subjectIds=eligibleSubjectIds?new Set(eligibleSubjectIds):null;
  const topicIds=eligibleTopicIds?new Set(eligibleTopicIds):null;
  const eligible=candidates.filter(item=>item?.subjectId&&!item.archived&&!item.subjectArchived&&!item.topicArchived
    && (!subjectIds||subjectIds.has(item.subjectId))&&(!topicIds||item.topicId&&topicIds.has(item.topicId)));
  const riskIds=new Set(topicRisks.map(item=>`${item.subjectId}:${item.topicId}`));
  const riskSubjects=new Set(eligible.filter(item=>riskIds.has(`${item.subjectId}:${item.topicId}`)).map(item=>item.subjectId));
  return {eligible,riskSubjects};
}
