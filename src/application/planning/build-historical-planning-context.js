import {capacityForPeriod} from '../../domain/planning/capacity-history.js';

export function buildHistoricalPlanningContext({dailyPlans=[],capacityHistory=[],start,end}={}){
  const items=dailyPlans.filter(plan=>plan.date>=start&&plan.date<=end).flatMap(plan=>(plan.items||[]).map(item=>{
    const snapshot=item.executionSnapshot?.version===1&&item.executionSnapshot.historicalContextKnown!==false?item.executionSnapshot:null;
    return {id:item.id,date:plan.date,status:item.status||null,recorded:Boolean(snapshot),
      planVersion:snapshot?.studyPlanId||null,subjectId:snapshot?.subjectId||null,topicId:snapshot?.topicId||null,
      activityType:snapshot?.type||null,originalMinutes:snapshot?.plannedMinutes??null,
      transferredMinutes:Math.max(0,Number(item.transferredMinutes)||0),originItemId:snapshot?.originItemId||null,
      validFrom:snapshot?.validFrom||snapshot?.date||null,validUntil:snapshot?.validUntil||snapshot?.date||null,
      prioritySnapshot:snapshot?.prioritySnapshot?structuredClone(snapshot.prioritySnapshot):null};
  }));
  const roots=items.filter(item=>item.recorded&&item.originItemId===item.id);
  return {version:1,capacity:capacityForPeriod(capacityHistory,{start,end}),items,
    originalRootMinutes:items.every(item=>item.recorded)?roots.reduce((sum,item)=>sum+item.originalMinutes,0):null,
    legacyItems:items.filter(item=>!item.recorded).length,
    deferredItems:items.filter(item=>item.status==='deferred').length,
    replacedItems:items.filter(item=>item.status==='replaced').length,
    skippedItems:items.filter(item=>['skipped','discarded'].includes(item.status)).length};
}
