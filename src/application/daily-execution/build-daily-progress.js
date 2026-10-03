export function buildDailyProgress({items=[],studiedSeconds=0,additionalSeconds=0,mismatchedSeconds=0}={}){
  const total=field=>items.reduce((sum,item)=>sum+(Number(item[field])||0),0);
  const plannedMinutes=total('plannedMinutes'),creditedMinutes=total('creditedTodaySeconds')/60,remainingMinutes=total('remainingSeconds')/60;
  return {plannedMinutes,studiedMinutes:studiedSeconds/60,creditedMinutes,remainingMinutes,
    linkedMinutes:total('executedTodaySeconds')/60,excessLinkedMinutes:Math.max(0,total('executedTodaySeconds')/60-creditedMinutes),
    additionalMinutes:additionalSeconds/60,mismatchedMinutes:mismatchedSeconds/60,
    progress:plannedMinutes?Math.min(100,Math.round((plannedMinutes-remainingMinutes)/plannedMinutes*100)):null,
    todayAdherence:plannedMinutes?Math.min(100,Math.round(creditedMinutes/plannedMinutes*100)):null,
    completedActivities:items.filter(item=>item.remainingSeconds===0).length,pendingActivities:items.filter(item=>item.remainingSeconds>0).length};
}
