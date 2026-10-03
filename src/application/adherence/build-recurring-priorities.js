import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';
import {strategicScopeKey} from '../analytics/build-strategic-timeline.js';
import {ADHERENCE_STATUS_POLICY} from './adherence-status.js';

const validPeriod=period=>Boolean(typeof period?.start==='string'&&typeof period?.end==='string'&&parseLocalDate(period.start)&&addLocalDays(period.start,6)===period.end);
export function savedAdherencePeriods({snapshots=[],activeExamTags=[],today}={}){
  const byPeriod=new Map();
  const ordered=[...snapshots].filter(snapshot=>validPeriod(snapshot.period)&&snapshot.period.end<=today&&strategicScopeKey(snapshot.activeExamTags)===strategicScopeKey(activeExamTags))
    .sort((a,b)=>(Number(b.revision)||1)-(Number(a.revision)||1)||String(b.savedAt||'').localeCompare(String(a.savedAt||''))||String(b.id||'').localeCompare(String(a.id||'')));
  for(const snapshot of ordered){const key=`${snapshot.period.start}:${snapshot.period.end}`;if(!byPeriod.has(key))byPeriod.set(key,snapshot)}
  return [...byPeriod.values()].filter(snapshot=>snapshot.weeklyClose?.adherence?.version===1&&snapshot.weeklyClose.adherence.model?.period?.start===snapshot.period.start&&snapshot.weeklyClose.adherence.model?.period?.end===snapshot.period.end)
    .sort((a,b)=>b.period.end.localeCompare(a.period.end)||b.period.start.localeCompare(a.period.start));
}
function supported(frame){
  return frame?.version===1&&frame.model?.version===1&&frame.assessment?.policyVersion===1&&frame.assessment.status!=='insufficient_data'
    &&frame.model.priority?.policyVersion===1&&frame.model.priority.classifiedCoverage>=ADHERENCE_STATUS_POLICY.minimumClassifiedCoverage&&!frame.model.ambiguousItemCount;
}
function gaps(model){
  const rows=new Map();
  for(const item of model.items||[]){
    if(item.priority!==true||!item.subjectId||!item.topicId||!Number.isFinite(item.plannedMinutes)||item.plannedMinutes<=0||!Number.isFinite(item.creditedMinutes)||item.creditedMinutes<0||item.creditedMinutes>item.plannedMinutes)continue;
    const key=JSON.stringify([item.subjectId,item.topicId]),row=rows.get(key)||{subjectId:item.subjectId,topicId:item.topicId,plannedMinutes:0,creditedMinutes:0};
    row.plannedMinutes+=item.plannedMinutes;row.creditedMinutes+=item.creditedMinutes;rows.set(key,row);
  }
  return new Map([...rows].filter(([,row])=>row.creditedMinutes/row.plannedMinutes*100<ADHERENCE_STATUS_POLICY.target));
}
export function buildRecurringPriorities({current,snapshots=[],subjects=[],activeExamTags=[]}={}){
  if(!supported(current)||!validPeriod(current.model.period))return {version:1,state:'insufficient_data',historyPeriods:0,items:[]};
  const period=current.model.period,earliest=addLocalDays(period.start,-28),selected=[];
  for(const snapshot of savedAdherencePeriods({snapshots,activeExamTags,today:period.start})){
    if(snapshot.period.end>=period.start||snapshot.period.start<earliest||!supported(snapshot.weeklyClose.adherence))continue;
    if(selected.some(previous=>snapshot.period.end>=previous.period.start))continue;
    selected.push(snapshot);if(selected.length===3)break;
  }
  const prior=selected.map(snapshot=>({period:snapshot.period,gaps:gaps(snapshot.weeklyClose.adherence.model)}));
  const items=[];
  for(const [key,row] of gaps(current.model)){
    const periods=[{start:period.start,end:period.end,...row}];
    for(const previous of prior){const gap=previous.gaps.get(key);if(gap)periods.push({start:previous.period.start,end:previous.period.end,...gap})}
    if(periods.length<2)continue;
    const subject=subjects.find(item=>item.id===row.subjectId),topic=subject?.topics?.find(item=>item.id===row.topicId);
    items.push({...row,subjectName:subject?.name||'Disciplina registrada',topicName:topic?.name||'Tópico registrado',remainingMinutes:row.plannedMinutes-row.creditedMinutes,periodCount:periods.length,periods});
  }
  items.sort((a,b)=>b.periodCount-a.periodCount||b.remainingMinutes-a.remainingMinutes||a.subjectId.localeCompare(b.subjectId)||a.topicId.localeCompare(b.topicId));
  return {version:1,state:selected.length?'ready':'insufficient_history',historyPeriods:selected.length,items};
}
