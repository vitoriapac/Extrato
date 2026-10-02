import {validateRecoveryAllocation} from './recovery-invariants.js';
import {compareRecoveryPlan} from './compare-recovery-plan.js';
const scopeKey=tags=>JSON.stringify([...(Array.isArray(tags)?tags:[])].sort());

export function prepareRecoveryApplication({displayedSignature,currentPreview,currentPlan,activeExamTags=[]}={}){
  if(!displayedSignature||!currentPreview?.available||currentPreview.status!=='recoverable'
    ||displayedSignature!==currentPreview.signature||!currentPlan||currentPreview.basis?.planId!==currentPlan.id
    ||!currentPreview.canApply)
    return {state:'stale',reason:'A proposta mudou. Atualize a Trajetória e revise a prévia novamente.'};
  if(scopeKey(currentPreview.basis.activeExamTags)!==scopeKey(activeExamTags))
    return {state:'stale',reason:'O concurso ativo mudou. Atualize a proposta antes de aplicá-la.'};
  const proposed=currentPreview.proposedPlan;
  const invariant=validateRecoveryAllocation({before:currentPlan,after:proposed,fromSubjectId:currentPreview.from?.subjectId,
    toSubjectId:currentPreview.to?.subjectId,minutes:currentPreview.transferMinutes,activeExamTags});
  if(!invariant.valid)return {state:'invalid',reasonCode:invariant.reasonCode,reason:'A proposta não preserva as invariantes do plano atual.'};
  const changes=compareRecoveryPlan(currentPlan,proposed).changes.filter(item=>item.direction!=='preserved');
  return {state:'ready',plan:structuredClone(proposed),changes:structuredClone(changes),
    totalMinutes:currentPlan.weeklyPlannedMinutes,capacityMinutes:currentPlan.weeklyAvailableMinutes,
    transferMinutes:currentPreview.transferMinutes,from:structuredClone(currentPreview.from),
    to:structuredClone(currentPreview.to),reasons:[...currentPreview.explanation],
    trajectoryStatus:currentPreview.basis.trajectoryStatus,examPhase:currentPreview.basis.examPhase,
    algorithmVersion:currentPreview.algorithmVersion};
}
