import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';
import {freezePlanExecution} from '../../domain/planning/plan-execution-snapshot.js';
import {recordPlanningCapacity} from '../../domain/planning/capacity-history.js';
import {classifyEvidenceScope} from '../../domain/exams/exam-evidence-scope.js';

export const DEMO_SUSTAINABILITY_PATTERNS=Object.freeze(['sustainable','priority_mismatch','unstable_execution','capacity_mismatch']);
export function demoSustainabilityPeriods(today){
  const monday=addLocalDays(today,-((parseLocalDate(today).getDay()+6)%7));
  return DEMO_SUSTAINABILITY_PATTERNS.map((status,index)=>({status,start:addLocalDays(monday,-112+index*28),end:addLocalDays(monday,-85+index*28)}));
}
const allocate=(total,weights)=>{
  const sum=weights.reduce((a,b)=>a+b,0),result=weights.map(weight=>Math.floor(total*weight/sum));
  result[result.length-1]+=total-result.reduce((a,b)=>a+b,0);return result;
};
// Scripted fictional history only: preserves session IDs, dates, questions and catalog.
// Production data never passes through this builder.
export function buildDemoSustainability(state,{today}){
  const periods=demoSustainabilityPeriods(today),first=periods[0].start,last=periods.at(-1).end;
  const removed=new Set(state.dailyPlans.filter(plan=>plan.date>=first&&plan.date<=last).flatMap(plan=>plan.items.map(item=>item.id)));
  state.dailyPlans=state.dailyPlans.filter(plan=>plan.date<first||plan.date>last);
  for(const session of state.studySessions)if(removed.has(session.planItemId))delete session.planItemId;
  recordPlanningCapacity(state.planningCapacityHistory,{id:'demo-capacity-history',today:first,capturedAt:`${first}T06:00:00Z`,hoursByDay:state.metas.horasPorDia});
  for(const [profile,period] of periods.entries())for(let week=0;week<4;week++){
    const start=addLocalDays(period.start,week*7),end=addLocalDays(start,6);
    const sessions=state.studySessions.filter(session=>session.date>=start&&session.date<=end&&classifyEvidenceScope(session,state.subjects,state.examBlueprint.activeExamTags).includedInExamMetrics)
      .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
    if(sessions.length<2)continue; // Missing evidence stays a gap for custom demo blueprints.
    const weights=sessions.slice(1).map(session=>Math.max(1,session.durationSeconds));
    const realMinutes=profile===0?570:profile===1?580:profile===2?[660,240,600,300][week]:420;
    const priorityMinutes=profile===0?114:profile===1?60:108;
    const durations=[priorityMinutes*60,...allocate((realMinutes-priorityMinutes)*60,weights)],planned=[120,...allocate(480,weights)];
    const plans=new Map();
    sessions.forEach((session,index)=>{
      const id=`demo-sustainability-item-${profile}-${week}-${index}`;
      session.durationSeconds=durations[index];session.planItemId=id;
      if(session.startedAt)session.endedAt=new Date(Date.parse(session.startedAt)+durations[index]*1000).toISOString();
      const item={id,subjectId:session.subjectId,topicId:session.topicId,type:session.type||'study',plannedMinutes:planned[index],
        executedSeconds:durations[index],status:durations[index]>=planned[index]*60?'completed':'partial',sessionIds:[session.id],
        originalDate:session.date,currentDate:session.date,rescheduleCount:0,skippedReason:null,
        prioritySnapshot:{priority:index===0,source:'demo-scripted',capturedAt:`${session.date}T06:00:00Z`}};
      freezePlanExecution(item,{date:session.date,capturedAt:`${session.date}T06:00:00Z`,activeExamTags:state.examBlueprint.activeExamTags});
      if(!plans.has(session.date))plans.set(session.date,{id:`demo-sustainability-plan-${session.date}`,date:session.date,availableMinutes:120,plannedMinutes:0,items:[],createdAt:`${session.date}T06:00:00Z`});
      const plan=plans.get(session.date);plan.items.push(item);plan.plannedMinutes+=item.plannedMinutes;
    });
    state.dailyPlans.push(...plans.values());
  }
  state.dailyPlans.sort((a,b)=>a.date.localeCompare(b.date));return periods;
}
