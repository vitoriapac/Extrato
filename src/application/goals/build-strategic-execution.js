import {EXCLUDED_DAILY_STATUSES as excluded,sessionMatchesDailyItem as matches,executionDate,executionCredit,indexExecutionItems} from '../../domain/planning/execution-contract.js';
const number=value=>Math.max(0,Number(value)||0);
const minutes=seconds=>Math.round(seconds/60*10)/10;

export function buildStrategicExecution({start,end,today=end,dailyPlans=[],sessions=[],subjects=[]}={}){
  const inPeriod=date=>date&&date>=start&&date<=end;
  const plans=dailyPlans.filter(plan=>inPeriod(plan.date));
  const index=indexExecutionItems(dailyPlans.flatMap(plan=>(plan.items||[])));
  const allItems=index.byId;
  const items=plans.flatMap(plan=>(plan.items||[]).filter(item=>!excluded.has(item.status)&&allItems.has(item.id)));
  const itemIds=new Set(items.map(item=>item.id));
  const executed=new Map(),bySubject=new Map(),seen=new Set();
  const subjectRow=id=>{const key=id||'unassigned';if(!bySubject.has(key))bySubject.set(key,{subjectId:id||null,name:subjects.find(subject=>subject.id===id)?.name||'Sem disciplina identificada',plannedMinutes:0,studiedSeconds:0});return bySubject.get(key)};
  let linkedSeconds=0,additionalSeconds=0,invalidLinkSeconds=0,otherPeriodSeconds=0;
  for(const session of sessions){
    const date=executionDate(session);
    if(!inPeriod(date)||date>today||(session.id&&seen.has(session.id)))continue;
    seen.add(session.id);const seconds=number(session.durationSeconds);subjectRow(session.subjectId).studiedSeconds+=seconds;
    const id=index.resolve(session),found=allItems.get(id);
    if(!id){additionalSeconds+=seconds;continue}
    if(!found||excluded.has(found.status)||!matches(session,found)){invalidLinkSeconds+=seconds;continue}
    if(!itemIds.has(id)){otherPeriodSeconds+=seconds;continue}
    linkedSeconds+=seconds;executed.set(id,(executed.get(id)||0)+seconds);
  }
  let priorityPlanned=0,priorityCredited=0,unknownPlanned=0,credited=0;
  for(const item of items){
    const planned=number(item.plannedMinutes),worked=(executed.get(item.id)||0)/60,credit=executionCredit(planned*60,worked*60).creditedSeconds/60;
    subjectRow(item.subjectId).plannedMinutes+=planned;credited+=credit;
    const snapshot=item.prioritySnapshot;
    if(!snapshot||typeof snapshot.priority!=='boolean')unknownPlanned+=planned;
    else if(snapshot.priority){priorityPlanned+=planned;priorityCredited+=credit}
  }
  plans.filter(plan=>!plan.items?.length).forEach(plan=>{unknownPlanned+=number(plan.plannedMinutes)});
  const classifiedPlanned=items.reduce((sum,item)=>sum+number(item.plannedMinutes),0),planned=classifiedPlanned+plans.filter(plan=>!plan.items?.length).reduce((sum,plan)=>sum+number(plan.plannedMinutes),0);
  return {
    priorityPlannedMinutes:Math.round(priorityPlanned),priorityExecutedMinutes:Math.round(priorityCredited),
    strategicAdherence:priorityPlanned?Math.round(priorityCredited/priorityPlanned*100):null,
    classifiedCoverage:planned?Math.round((planned-unknownPlanned)/planned*100):null,
    unknownPlannedMinutes:Math.round(unknownPlanned),linkedMinutes:minutes(linkedSeconds),
    additionalMinutes:minutes(additionalSeconds),invalidLinkMinutes:minutes(invalidLinkSeconds),otherPeriodMinutes:minutes(otherPeriodSeconds),
    creditedMinutes:Math.round(credited),excessLinkedMinutes:minutes(Math.max(0,linkedSeconds-credited*60)),
    subjects:[...bySubject.values()].map(row=>({...row,studiedMinutes:minutes(row.studiedSeconds),delta:minutes(row.studiedSeconds)-row.plannedMinutes})).sort((a,b)=>b.plannedMinutes-a.plannedMinutes||b.studiedMinutes-a.studiedMinutes)
  };
}
