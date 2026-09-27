import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';

const excluded=new Set(['skipped','replaced','discarded']);
const key=value=>value||'unassigned';
const minutes=value=>Math.max(0,Number(value)||0);

export function buildStudyDistribution({today,dailyPlans=[],sessions=[],subjects=[]}={}){
  const date=parseLocalDate(today);
  if(!date)return {state:'empty',rows:[],plannedMinutes:0,studiedMinutes:0};
  const start=addLocalDays(today,-((date.getDay()+6)%7));
  const rowsById=new Map(),names=new Map(subjects.map(subject=>[subject.id,subject.name]));
  const rowFor=id=>{
    const subjectId=key(id);
    if(!rowsById.has(subjectId))rowsById.set(subjectId,{subjectId,name:names.get(subjectId)||'Sem disciplina',plannedMinutes:0,studiedMinutes:0});
    return rowsById.get(subjectId);
  };
  for(const plan of dailyPlans){
    if(!plan.date||plan.date<start||plan.date>today)continue;
    for(const item of plan.items||[]){
      if(excluded.has(item.status))continue;
      rowFor(item.subjectId).plannedMinutes+=minutes(item.plannedMinutes);
    }
  }
  for(const session of sessions){
    if(!session.date||session.date<start||session.date>today)continue;
    rowFor(session.subjectId).studiedMinutes+=minutes(session.durationSeconds)/60;
  }
  const rows=[...rowsById.values()].map(row=>({...row,plannedMinutes:Math.round(row.plannedMinutes),studiedMinutes:Math.round(row.studiedMinutes)}))
    .filter(row=>row.plannedMinutes||row.studiedMinutes).sort((a,b)=>(b.plannedMinutes+b.studiedMinutes)-(a.plannedMinutes+a.studiedMinutes)||a.name.localeCompare(b.name,'pt-BR'));
  const plannedMinutes=rows.reduce((sum,row)=>sum+row.plannedMinutes,0),studiedMinutes=rows.reduce((sum,row)=>sum+row.studiedMinutes,0);
  return {state:rows.length?'ready':'empty',rows:rows.map(row=>({...row,plannedShare:plannedMinutes?Math.round(row.plannedMinutes/plannedMinutes*100):null,studiedShare:studiedMinutes?Math.round(row.studiedMinutes/studiedMinutes*100):null})),plannedMinutes,studiedMinutes,start,end:today};
}
