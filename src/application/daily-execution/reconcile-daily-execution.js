import {EXCLUDED_DAILY_STATUSES,dailyActivityType,sessionMatchesDailyItem,executionDate as dateOf,executionSeconds as seconds,executionCredit,indexExecutionItems} from '../../domain/planning/execution-contract.js';
export {EXCLUDED_DAILY_STATUSES,dailyActivityType,sessionMatchesDailyItem} from '../../domain/planning/execution-contract.js';
import {classifyEvidenceScope} from '../../domain/exams/exam-evidence-scope.js';
import {normalizeExamTags,isTopicInExamScope} from '../../domain/exams/exam-scope.js';
import {parseLocalDate} from '../../core/date-utils.js';

const scopeKey=tags=>JSON.stringify(normalizeExamTags(tags));

export function dailyItemEligible(item,subjects,activeExamTags){
  if(EXCLUDED_DAILY_STATUSES.has(item.status)||item.archived)return false;
  const subject=subjects.find(row=>row.id===item.subjectId);
  if(!subject||subject.archived)return false;
  const topic=subject.topics?.find(row=>row.id===item.topicId);
  return !item.topicId||Boolean(topic&&!topic.archived&&isTopicInExamScope(topic,activeExamTags));
}

// A session needs an explicit, unambiguous link and matching activity to credit a task.
export function reconcileDailyExecution({today,dailyPlans=[],sessions=[],subjects=[],activeExamTags=[]}={}){
  const plans=dailyPlans.filter(plan=>plan.date===today&&(!Array.isArray(plan.activeExamTags)||scopeKey(plan.activeExamTags)===scopeKey(activeExamTags)));
  const items=plans.flatMap(plan=>(plan.items||[]).filter(item=>dailyItemEligible(item,subjects,activeExamTags)).map(item=>({...structuredClone(item),dailyPlanId:plan.id,date:today})));
  const {eligible,byId,resolve,ambiguousItemCount}=indexExecutionItems(items);
  const execution=new Map(eligible.map(item=>[item.id,{todaySeconds:0,previousSeconds:0,mismatchedSeconds:0,sessionIds:[]} ]));
  const seen=new Set(),todaySessions=[];
  let studiedSeconds=0,additionalSeconds=0,mismatchedSeconds=0;
  for(const session of sessions){
    if(session.id&&seen.has(session.id))continue;if(session.id)seen.add(session.id);
    const date=dateOf(session),duration=seconds(session.durationSeconds);
    if(!date||date>today||!classifyEvidenceScope(session,subjects,activeExamTags).includedInExamMetrics)continue;
    const current=date===today;
    if(current){studiedSeconds+=duration;todaySessions.push({...structuredClone(session),date});}
    const id=resolve(session),item=byId.get(id);
    const matches=sessionMatchesDailyItem(session,item);
    if(!matches){
      if(current){if(id){mismatchedSeconds+=duration;if(item)execution.get(id).mismatchedSeconds+=duration;}else additionalSeconds+=duration;}
      continue;
    }
    const row=execution.get(id);row[current?'todaySeconds':'previousSeconds']+=duration;
    if(session.id)row.sessionIds.push(session.id);
  }
  const reconciled=eligible.map(item=>{
    const row=execution.get(item.id),plannedSeconds=seconds(item.plannedMinutes)*60,credit=executionCredit(plannedSeconds,row.todaySeconds,row.previousSeconds),creditedToday=credit.creditedSeconds;
    const remainingSeconds=credit.remainingSeconds;
    return {...item,plannedMinutes:plannedSeconds/60,executedSeconds:row.previousSeconds+row.todaySeconds,executedTodaySeconds:row.todaySeconds,creditedTodaySeconds:creditedToday,remainingSeconds,
      mismatchedSeconds:row.mismatchedSeconds,sessionIds:row.sessionIds,status:remainingSeconds===0?'completed':row.previousSeconds+row.todaySeconds>0?'partial':'planned'};
  });
  return {items:reconciled,todaySessions,hasPlan:plans.length>0,ambiguousItemCount,studiedSeconds,additionalSeconds,mismatchedSeconds};
}
