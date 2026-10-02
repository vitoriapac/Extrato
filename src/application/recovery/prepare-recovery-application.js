const scopeKey=tags=>JSON.stringify([...(Array.isArray(tags)?tags:[])].sort());
const total=items=>items.reduce((sum,item)=>sum+Number(item.minutes),0);

export function prepareRecoveryApplication({displayedSignature,currentPreview,currentPlan,activeExamTags=[]}={}){
  if(!displayedSignature||!currentPreview?.available||currentPreview.status!=='recoverable'
    ||displayedSignature!==currentPreview.signature||!currentPlan||currentPreview.basis?.planId!==currentPlan.id
    ||!currentPreview.canApply)
    return {state:'stale',reason:'A proposta mudou. Atualize a Trajetória e revise a prévia novamente.'};
  if(scopeKey(currentPreview.basis.activeExamTags)!==scopeKey(activeExamTags))
    return {state:'stale',reason:'O concurso ativo mudou. Atualize a proposta antes de aplicá-la.'};
  const proposed=currentPreview.proposedPlan;
  if(!proposed||proposed.weeklyPlannedMinutes!==currentPlan.weeklyPlannedMinutes
    ||proposed.weeklyAvailableMinutes!==currentPlan.weeklyAvailableMinutes
    ||total(proposed.subjects)!==total(currentPlan.subjects)
    ||total(proposed.items)!==total(currentPlan.items))
    return {state:'invalid',reason:'A proposta não preserva a carga semanal atual.'};
  const changes=currentPreview.changes.filter(item=>item.direction!=='preserved');
  if(changes.length!==2||currentPreview.increased.length!==1||currentPreview.reduced.length!==1
    ||currentPreview.increased[0].deltaMinutes!==-currentPreview.reduced[0].deltaMinutes)
    return {state:'invalid',reason:'A proposta não representa uma redistribuição única e equilibrada.'};
  return {state:'ready',plan:structuredClone(proposed),changes:structuredClone(changes),
    totalMinutes:currentPlan.weeklyPlannedMinutes,capacityMinutes:currentPlan.weeklyAvailableMinutes,
    transferMinutes:currentPreview.transferMinutes,from:structuredClone(currentPreview.from),
    to:structuredClone(currentPreview.to),reasons:[...currentPreview.explanation],
    trajectoryStatus:currentPreview.basis.trajectoryStatus,examPhase:currentPreview.basis.examPhase,
    algorithmVersion:currentPreview.algorithmVersion};
}
