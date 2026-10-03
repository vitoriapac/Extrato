import {historicalExecutionItem} from '../../domain/planning/plan-execution-snapshot.js';
import {EXCLUDED_DAILY_STATUSES as excluded,sessionMatchesDailyItem as matches,executionDate,executionCredit,indexExecutionItems,executionSeconds as number} from '../../domain/planning/execution-contract.js';
const minutes=seconds=>Math.round(seconds/60*10)/10;

export function buildStrategicExecution({start,end,today=end,dailyPlans=[],sessions=[],subjects=[]}={}){
  const inPeriod=date=>date&&date>=start&&date<=end;
  const plans=dailyPlans.filter(plan=>inPeriod(plan.date));
  const index=indexExecutionItems(dailyPlans.flatMap(plan=>(plan.items||[]).map(historicalExecutionItem)));
  const allItems=index.byId;
  const items=plans.flatMap(plan=>(plan.items||[]).filter(item=>(!excluded.has(item.status)||(item.status==='deferred'&&item.executionSnapshot))&&allItems.has(item.id)));
  const historicalItems=items.map(historicalExecutionItem);
  const itemIds=new Set(items.map(item=>item.id));
  const executed=new Map(),bySubject=new Map(),seen=new Set();
  const subjectRow=id=>{const key=id||'unassigned';if(!bySubject.has(key))bySubject.set(key,{subjectId:id||null,name:subjects.find(subject=>subject.id===id)?.name||'Sem disciplina identificada',plannedMinutes:0,studiedSeconds:0,creditedMinutes:0,priorityPlannedMinutes:0,priorityCreditedMinutes:0,unknownPlannedMinutes:0});return bySubject.get(key)};
  let linkedSeconds=0,additionalSeconds=0,invalidLinkSeconds=0,otherPeriodSeconds=0;
  for(const session of sessions){
    const date=executionDate(session);
    if(!inPeriod(date)||date>today||(session.id&&seen.has(session.id)))continue;
    seen.add(session.id);const seconds=number(session.durationSeconds);subjectRow(session.subjectId).studiedSeconds+=seconds;
    const id=index.resolve(session),found=allItems.get(id);
    if(!id){additionalSeconds+=seconds;continue}
    if(!found||(excluded.has(found.status)&&!(found.status==='deferred'&&found.executionSnapshot))||!matches(session,found)){invalidLinkSeconds+=seconds;continue}
    if(!itemIds.has(id)){otherPeriodSeconds+=seconds;continue}
    linkedSeconds+=seconds;executed.set(id,(executed.get(id)||0)+seconds);
  }
  let priorityPlanned=0,priorityCredited=0,unknownPlanned=0,credited=0;
  const reconciledItems=[];
  for(const item of historicalItems){
    const planned=number(item.plannedMinutes),worked=(executed.get(item.id)||0)/60,credit=executionCredit(planned*60,worked*60).creditedSeconds/60;
    const subject=subjectRow(item.subjectId);
    subject.plannedMinutes+=planned;subject.creditedMinutes+=credit;credited+=credit;
    const snapshot=item.prioritySnapshot;
    const priority=typeof snapshot?.priority==='boolean'?snapshot.priority:null;
    if(priority===null){unknownPlanned+=planned;subject.unknownPlannedMinutes+=planned}
    else if(priority){priorityPlanned+=planned;priorityCredited+=credit;subject.priorityPlannedMinutes+=planned;subject.priorityCreditedMinutes+=credit}
    reconciledItems.push({id:item.id,subjectId:item.subjectId||null,topicId:item.topicId||null,plannedMinutes:planned,executedMinutes:worked,creditedMinutes:credit,priority,completion:planned?credit/planned:null,studyPlanId:item.executionSnapshot?.studyPlanId||item.studyPlanId||null,originItemId:item.executionSnapshot?.originItemId||item.rescheduledFromId||item.id});
  }
  plans.filter(plan=>!plan.items?.length).forEach(plan=>{unknownPlanned+=number(plan.plannedMinutes)});
  const classifiedPlanned=historicalItems.reduce((sum,item)=>sum+number(item.plannedMinutes),0),planned=classifiedPlanned+plans.filter(plan=>!plan.items?.length).reduce((sum,plan)=>sum+number(plan.plannedMinutes),0);
  return {
    reconciliation:{plannedMinutes:planned,studiedMinutes:[...bySubject.values()].reduce((sum,row)=>sum+row.studiedSeconds/60,0),creditedMinutes:credited,priorityPlannedMinutes:priorityPlanned,priorityCreditedMinutes:priorityCredited,unknownPlannedMinutes:unknownPlanned,items:reconciledItems,linkedMinutes:linkedSeconds/60,excessLinkedMinutes:Math.max(0,linkedSeconds/60-credited),additionalMinutes:additionalSeconds/60,incompatibleMinutes:invalidLinkSeconds/60,otherPeriodMinutes:otherPeriodSeconds/60},
    priorityPlannedMinutes:Math.round(priorityPlanned),priorityExecutedMinutes:Math.round(priorityCredited),
    strategicAdherence:priorityPlanned?Math.round(priorityCredited/priorityPlanned*100):null,
    classifiedCoverage:planned?Math.round((planned-unknownPlanned)/planned*100):null,
    unknownPlannedMinutes:Math.round(unknownPlanned),linkedMinutes:minutes(linkedSeconds),
    additionalMinutes:minutes(additionalSeconds),invalidLinkMinutes:minutes(invalidLinkSeconds),otherPeriodMinutes:minutes(otherPeriodSeconds),
    creditedMinutes:Math.round(credited),excessLinkedMinutes:minutes(Math.max(0,linkedSeconds-credited*60)),
    subjects:[...bySubject.values()].map(row=>({...row,studiedMinutes:minutes(row.studiedSeconds),delta:minutes(row.studiedSeconds)-row.plannedMinutes})).sort((a,b)=>b.plannedMinutes-a.plannedMinutes||b.studiedMinutes-a.studiedMinutes)
  };
}
