const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const total=rows=>rows.reduce((sum,row)=>sum+row.minutes,0);
const validRows=rows=>Array.isArray(rows)&&rows.length>0&&rows.every(row=>Number.isSafeInteger(row.minutes)&&row.minutes>=0);
const tags=values=>JSON.stringify([...(values||[])].sort());

// Validate actual allocations, independently of the presentation's change list.
export function validateRecoveryAllocation({before,after,fromSubjectId,toSubjectId,minutes,activeExamTags=[]}={}){
  const reject=reasonCode=>({valid:false,reasonCode});
  if(!before||!after||!fromSubjectId||!toSubjectId||fromSubjectId===toSubjectId||!Number.isSafeInteger(minutes)||minutes<=0)
    return reject('invalid_transfer');
  if(!validRows(before.subjects)||!validRows(after.subjects)||!validRows(before.items)||!validRows(after.items))return reject('invalid_minutes');
  if(before.weeklyAvailableMinutes!==after.weeklyAvailableMinutes||before.weeklyPlannedMinutes!==after.weeklyPlannedMinutes
    ||!Number.isSafeInteger(before.weeklyPlannedMinutes)||before.weeklyPlannedMinutes<=0
    ||before.weeklyPlannedMinutes>before.weeklyAvailableMinutes
    ||total(before.subjects)!==before.weeklyPlannedMinutes||total(after.subjects)!==before.weeklyPlannedMinutes
    ||total(before.items)!==before.weeklyPlannedMinutes||total(after.items)!==before.weeklyPlannedMinutes)return reject('capacity_changed');
  if(before.examDate!==after.examDate||tags(before.activeExamTags)!==tags(after.activeExamTags)
    ||Array.isArray(before.activeExamTags)&&tags(before.activeExamTags)!==tags(activeExamTags))return reject('scope_changed');
  if(before.subjects.length!==after.subjects.length||before.items.length!==after.items.length)return reject('content_changed');
  const subjectIds=new Set(),itemIds=new Set();let changedItems=0;
  for(const subject of before.subjects){
    if(subjectIds.has(subject.subjectId))return reject('duplicate_content');subjectIds.add(subject.subjectId);
    const next=after.subjects.find(row=>row.subjectId===subject.subjectId),delta=subject.subjectId===fromSubjectId?-minutes:subject.subjectId===toSubjectId?minutes:0;
    if(!next||next.minutes!==subject.minutes+delta||!same({...subject,minutes:next.minutes},next))return reject('unexpected_subject_change');
    if(total(before.items.filter(row=>row.subjectId===subject.subjectId))!==subject.minutes
      ||total(after.items.filter(row=>row.subjectId===subject.subjectId))!==next.minutes)return reject('subject_item_mismatch');
  }
  if(!subjectIds.has(fromSubjectId)||!subjectIds.has(toSubjectId))return reject('missing_subject');
  for(const item of before.items){
    if(itemIds.has(item.id))return reject('duplicate_content');itemIds.add(item.id);
    const next=after.items.find(row=>row.id===item.id);if(!next)return reject('content_changed');
    const delta=next.minutes-item.minutes;
    if(delta!==0){
      if(delta!==(item.subjectId===fromSubjectId?-minutes:item.subjectId===toSubjectId?minutes:0))return reject('unexpected_item_change');
      if(next.minutes<15||Number.isFinite(next.capacityMinutes)&&next.minutes>next.capacityMinutes)return reject('item_capacity_exceeded');
      const mix=Object.values(next.activityMix||{});
      if(!mix.length||mix.some(value=>!Number.isSafeInteger(value)||value<0)||mix.reduce((sum,value)=>sum+value,0)!==next.minutes)return reject('invalid_activity_mix');
      changedItems++;
    }
    if(!same({...item,minutes:next.minutes,activityMix:delta?next.activityMix:item.activityMix},next))return reject('unexpected_item_change');
  }
  if(changedItems!==2)return reject('invalid_transfer');
  const allowed=['subjects','items','maintenanceMinutes','adaptiveAdvice','adaptiveHistoryId'];
  const strip=plan=>Object.fromEntries(Object.entries(plan).filter(([key])=>!allowed.includes(key)));
  return same(strip(before),strip(after))?{valid:true}:reject('unexpected_plan_change');
}

export function validateRecoveryState({before,after,revertedDecisionId=null}={}){
  const reject=reasonCode=>({valid:false,reasonCode});
  const allowed=['studyPlans','adaptivePlanningHistory','readinessSnapshots','updatedAt'];
  const strip=value=>Object.fromEntries(Object.entries(value).filter(([key])=>!allowed.includes(key)));
  if(!same(strip(before),strip(after)))return reject('protected_state_changed');
  if(after.studyPlans.length!==before.studyPlans.length+1||!same(after.studyPlans.slice(0,-1),before.studyPlans)
    ||before.studyPlans.some(plan=>plan.id===after.studyPlans.at(-1).id))return reject('plan_history_changed');
  if(after.readinessSnapshots.length!==before.readinessSnapshots.length+1||!same(after.readinessSnapshots.slice(0,-1),before.readinessSnapshots))return reject('snapshot_history_changed');
  if(!revertedDecisionId){
    if(after.adaptivePlanningHistory.length!==before.adaptivePlanningHistory.length+1||!same(after.adaptivePlanningHistory.slice(0,-1),before.adaptivePlanningHistory))return reject('decision_history_changed');
  }else{
    if(after.adaptivePlanningHistory.length!==before.adaptivePlanningHistory.length)return reject('decision_history_changed');
    for(let index=0;index<before.adaptivePlanningHistory.length;index++){
      const original=before.adaptivePlanningHistory[index],next=after.adaptivePlanningHistory[index];
      if(original.id!==revertedDecisionId){if(!same(original,next))return reject('decision_history_changed');continue}
      const fields=['status','revertedAt','reversionPlanId','revertReason','originalDecisionId'];
      const clean=record=>Object.fromEntries(Object.entries(record).filter(([key])=>!fields.includes(key)));
      if(next.status!=='reverted'||!same(clean(original),clean(next)))return reject('decision_history_changed');
    }
  }
  return {valid:true};
}

export function validateRecoveryConfirmation({expected,confirmed,activeExamTags=[]}={}){
  const normalizeItem=({id,studyPlanId,prioritySnapshot,topicId,...item})=>({...item,topicId:topicId||id});
  if(!confirmed?.id||confirmed.weeklyAvailableMinutes!==expected.weeklyAvailableMinutes
    ||confirmed.weeklyPlannedMinutes!==expected.weeklyPlannedMinutes||confirmed.examDate!==expected.examDate
    ||tags(confirmed.activeExamTags)!==tags(activeExamTags)||!same(confirmed.subjects,expected.subjects)
    ||!Array.isArray(confirmed.items)||!same(confirmed.items.map(normalizeItem),expected.items.map(normalizeItem)))
    return {valid:false,reasonCode:'confirmation_changed_allocation'};
  if(expected.items.some((item,index)=>item.prioritySnapshot&&!same(item.prioritySnapshot,confirmed.items[index].prioritySnapshot)))
    return {valid:false,reasonCode:'priority_snapshot_changed'};
  return {valid:true};
}
