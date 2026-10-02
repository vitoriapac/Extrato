import {localDateFromTimestamp} from '../../domain/sessions/study-session.js';
import {classifyEvidenceScope} from '../../domain/exams/exam-evidence-scope.js';
import {normalizeExamTags,isTopicInExamScope} from '../../domain/exams/exam-scope.js';
import {parseLocalDate} from '../../core/date-utils.js';

export const EXCLUDED_DAILY_STATUSES=new Set(['skipped','replaced','discarded','deferred']);
export const dailyActivityType=type=>type==='theory'||type==='prerequisite'?'study':type||'study';
export const sessionMatchesDailyItem=(session,item)=>Boolean(item&&(!item.subjectId||session.subjectId===item.subjectId)&&(!item.topicId||session.topicId===item.topicId)&&(!item.type||dailyActivityType(session.type)===dailyActivityType(item.type)));
const seconds=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
const dateOf=session=>typeof session.date==='string'&&parseLocalDate(session.date)?session.date:localDateFromTimestamp(session.endedAt||session.startedAt||session.createdAt);
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
  const counts=new Map();items.forEach(item=>counts.set(item.id,(counts.get(item.id)||0)+1));
  const eligible=items.filter(item=>item.id&&counts.get(item.id)===1),byId=new Map(eligible.map(item=>[item.id,item]));
  const links=new Map();eligible.forEach(item=>(item.sessionIds||[]).forEach(id=>{const set=links.get(id)||new Set();set.add(item.id);links.set(id,set);}));
  const execution=new Map(eligible.map(item=>[item.id,{todaySeconds:0,previousSeconds:0,mismatchedSeconds:0,sessionIds:[]} ]));
  const seen=new Set(),todaySessions=[];
  let studiedSeconds=0,additionalSeconds=0,mismatchedSeconds=0;
  for(const session of sessions){
    if(session.id&&seen.has(session.id))continue;if(session.id)seen.add(session.id);
    const date=dateOf(session),duration=seconds(session.durationSeconds);
    if(!date||date>today||!classifyEvidenceScope(session,subjects,activeExamTags).includedInExamMetrics)continue;
    const current=date===today;
    if(current){studiedSeconds+=duration;todaySessions.push({...structuredClone(session),date});}
    const references=links.get(session.id),id=session.planItemId||(references?.size===1?[...references][0]:null),item=byId.get(id);
    const matches=sessionMatchesDailyItem(session,item);
    if(!matches){
      if(current){if(id){mismatchedSeconds+=duration;if(item)execution.get(id).mismatchedSeconds+=duration;}else additionalSeconds+=duration;}
      continue;
    }
    const row=execution.get(id);row[current?'todaySeconds':'previousSeconds']+=duration;
    if(session.id)row.sessionIds.push(session.id);
  }
  const reconciled=eligible.map(item=>{
    const row=execution.get(item.id),plannedSeconds=seconds(item.plannedMinutes)*60,previousCredit=Math.min(plannedSeconds,row.previousSeconds),creditedToday=Math.min(Math.max(0,plannedSeconds-previousCredit),row.todaySeconds);
    const remainingSeconds=Math.max(0,plannedSeconds-row.previousSeconds-row.todaySeconds);
    return {...item,plannedMinutes:plannedSeconds/60,executedSeconds:row.previousSeconds+row.todaySeconds,executedTodaySeconds:row.todaySeconds,creditedTodaySeconds:creditedToday,remainingSeconds,
      mismatchedSeconds:row.mismatchedSeconds,sessionIds:row.sessionIds,status:remainingSeconds===0?'completed':row.previousSeconds+row.todaySeconds>0?'partial':'planned'};
  });
  return {items:reconciled,todaySessions,hasPlan:plans.length>0,ambiguousItemCount:items.length-eligible.length,studiedSeconds,additionalSeconds,mismatchedSeconds};
}
