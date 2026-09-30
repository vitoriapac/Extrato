import {strategicScopeKey} from './build-strategic-timeline.js';

const phaseOrder=['construction','consolidation','final_stretch','final_review'];
const rounded=value=>Math.round(value*10)/10;
const validPhase=record=>phaseOrder.includes(record?.examPhase?.state)?record.examPhase:null;
const finite=value=>value!=null&&Number.isFinite(Number(value))?Number(value):null;

// Only values persisted with their phase participate. Revisions of one close count once.
export function buildPhaseComparison({weeklyCloseSnapshots=[],readinessSnapshots=[],activeExamTags=[]}={}){
  const scope=strategicScopeKey(activeExamTags),latest=new Map();
  for(const snapshot of weeklyCloseSnapshots){
    if(strategicScopeKey(snapshot.activeExamTags)!==scope||!validPhase(snapshot)||!snapshot.period?.end)continue;
    const key=`${snapshot.period.start}:${snapshot.period.end}`,previous=latest.get(key);
    if(!previous||(Number(snapshot.revision)||1)>=(Number(previous.revision)||1))latest.set(key,snapshot);
  }
  const rows=phaseOrder.map(state=>{
    const closes=[...latest.values()].filter(item=>item.examPhase.state===state);
    const questions=closes.reduce((sum,item)=>sum+(finite(item.weeklyClose?.questions?.resolved)||0),0);
    const correct=closes.reduce((sum,item)=>sum+(finite(item.weeklyClose?.questions?.correct)||0),0);
    const planned=closes.reduce((sum,item)=>sum+(finite(item.weeklyClose?.investment?.plannedMinutes)||0),0);
    const executed=closes.reduce((sum,item)=>sum+(finite(item.weeklyClose?.investment?.executedMinutes)||0),0);
    const readiness=readinessSnapshots.filter(item=>strategicScopeKey(item.activeExamTags)===scope&&validPhase(item)?.state===state&&finite(item.score)!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.savedAt).localeCompare(String(b.savedAt))).at(-1);
    return {state,label:closes[0]?.examPhase.label||readiness?.examPhase.label||null,closes:closes.length,questions,accuracy:questions>=30?rounded(correct/questions*100):null,adherence:planned>=60?rounded(executed/planned*100):null,readiness:readiness?finite(readiness.score):null};
  }).filter(row=>row.closes||row.readiness!=null);
  return {state:rows.length?'ready':'empty',rows};
}
