export function buildRecoveryDecisionRecord({application,beforePlan,confirmedPlanId,activeExamTags=[],createdAt,idGenerator,explanationSnapshot=null}={}){
  if(application?.state!=='ready'||!beforePlan||!confirmedPlanId||typeof idGenerator!=='function')return null;
  const afterPlan=application.plan,source=afterPlan.subjects.find(item=>item.subjectId===application.from.subjectId),
    target=afterPlan.subjects.find(item=>item.subjectId===application.to.subjectId),
    sourceBefore=beforePlan.subjects.find(item=>item.subjectId===application.from.subjectId),
    targetBefore=beforePlan.subjects.find(item=>item.subjectId===application.to.subjectId);
  const findChanged=(subjectId,direction)=>afterPlan.items.find(item=>{
    if(item.subjectId!==subjectId)return false;
    const previous=beforePlan.items.find(row=>row.id===item.id);
    return previous&&(direction==='decrease'?item.minutes<previous.minutes:item.minutes>previous.minutes);
  });
  const sourceItem=findChanged(application.from.subjectId,'decrease'),targetItem=findChanged(application.to.subjectId,'increase'),
    sourceItemBefore=beforePlan.items.find(item=>item.id===sourceItem?.id),targetItemBefore=beforePlan.items.find(item=>item.id===targetItem?.id);
  if(!source||!target||!sourceBefore||!targetBefore||!sourceItem||!targetItem||!sourceItemBefore?.activityMix||!targetItemBefore?.activityMix)return null;
  return {id:idGenerator('adaptive-plan'),decisionType:'recovery',activeExamTags:[...activeExamTags],createdAt,decidedAt:createdAt,
    explanationSnapshot,sourceSubjectId:source.subjectId,targetSubjectId:target.subjectId,
    sourceName:source.subjectName||source.name||application.from.name,targetName:target.subjectName||target.name||application.to.name,
    minutes:application.transferMinutes,sourceBefore:sourceBefore.minutes,sourceAfter:source.minutes,
    targetBefore:targetBefore.minutes,targetAfter:target.minutes,
    reasons:[...application.reasons],algorithmVersion:application.algorithmVersion,status:'applied',planId:confirmedPlanId,
    sourceTopicId:sourceItem.topicId||sourceItem.id,targetTopicId:targetItem.topicId||targetItem.id,
    sourceItemBefore:sourceItemBefore.minutes,targetItemBefore:targetItemBefore.minutes,
    sourceMixBefore:structuredClone(sourceItemBefore.activityMix),targetMixBefore:structuredClone(targetItemBefore.activityMix),
    totalMinutesBefore:beforePlan.weeklyPlannedMinutes,totalMinutesAfter:afterPlan.weeklyPlannedMinutes,
    trajectoryStatus:application.trajectoryStatus,phase:application.examPhase?{label:application.examPhase}:null,
    decisionSource:'recovery-preview'};
}
