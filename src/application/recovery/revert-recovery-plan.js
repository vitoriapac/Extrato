import {confirmRecoveryDraft,rejectRecovery} from './apply-recovery-plan.js';
import {validateRecoveryAllocation,validateRecoveryState,validateRecoveryConfirmation} from './recovery-invariants.js';

// Reversion changes the future allocation, never sessions or generated daily activities.
export async function revertRecoveryPlan({state,currentPlan,decisionId,activeExamTags=[],services={},reason='Reversão solicitada pelo usuário'}={}){
  const entry=state.adaptivePlanningHistory.find(item=>item.id===decisionId&&item.status==='applied');
  if(!entry||!currentPlan||entry.planId!==currentPlan.id)return rejectRecovery('stale_plan','O plano mudou desde esse ajuste. Revise o planejamento atual.');
  if(Array.isArray(entry.activeExamTags)&&JSON.stringify([...entry.activeExamTags].sort())!==JSON.stringify([...activeExamTags].sort()))return rejectRecovery('scope_changed','O concurso ativo mudou. Revise o planejamento atual.');
  try{
    const before=structuredClone(state),draft=structuredClone(before),restored=structuredClone(currentPlan);
    const source=restored.subjects.find(item=>item.subjectId===entry.sourceSubjectId),target=restored.subjects.find(item=>item.subjectId===entry.targetSubjectId),
      sourceItem=restored.items.find(item=>(item.topicId||item.id)===entry.sourceTopicId),targetItem=restored.items.find(item=>(item.topicId||item.id)===entry.targetTopicId);
    if(!source||!target||!sourceItem||!targetItem||!entry.sourceMixBefore||!entry.targetMixBefore
      ||source.minutes!==entry.sourceAfter||target.minutes!==entry.targetAfter
      ||sourceItem.minutes!==entry.sourceItemBefore-entry.minutes||targetItem.minutes!==entry.targetItemBefore+entry.minutes)return rejectRecovery('stale_plan','As alocações mudaram desde esse ajuste. Revise o planejamento atual.');
    source.minutes=entry.sourceBefore;target.minutes=entry.targetBefore;
    sourceItem.minutes=entry.sourceItemBefore;targetItem.minutes=entry.targetItemBefore;
    sourceItem.activityMix=structuredClone(entry.sourceMixBefore);targetItem.activityMix=structuredClone(entry.targetMixBefore);
    restored.maintenanceMinutes=restored.items.filter(item=>item.covered).reduce((sum,item)=>sum+item.minutes,0);
    restored.adaptiveAdvice=null;restored.adaptiveHistoryId=null;
    const allocation=validateRecoveryAllocation({before:currentPlan,after:restored,fromSubjectId:entry.targetSubjectId,toSubjectId:entry.sourceSubjectId,minutes:entry.minutes,activeExamTags});
    if(!allocation.valid)return rejectRecovery(allocation.reasonCode);
    const createdAt=services.clock.nowISO(),snapshot=services.buildReadinessSnapshot(before,createdAt,'Antes de reverter uma redistribuição do plano');
    if(!snapshot)return rejectRecovery('invalid_snapshot');
    const plan=(services.confirmPlan||confirmRecoveryDraft)(restored,draft,services);if(!plan)return rejectRecovery('confirmation_failed');
    const confirmed=validateRecoveryConfirmation({expected:restored,confirmed:plan,activeExamTags});
    if(!confirmed.valid)return rejectRecovery(confirmed.reasonCode);
    const record=draft.adaptivePlanningHistory.find(item=>item.id===decisionId);
    Object.assign(record,{status:'reverted',revertedAt:createdAt,reversionPlanId:plan.id,revertReason:reason,originalDecisionId:entry.id});
    draft.readinessSnapshots.push(snapshot);
    const invariant=validateRecoveryState({before,after:draft,revertedDecisionId:decisionId});if(!invariant.valid)return rejectRecovery(invariant.reasonCode);
    const committed=await services.commitState({before,after:draft});
    if(committed.status!=='committed')return rejectRecovery(committed.reasonCode,committed.reason);
    return {status:'reverted',plan,decisionRecord:record,readinessSnapshot:snapshot};
  }catch(error){return rejectRecovery('reversion_failed','Não foi possível concluir a reversão. O estado em memória foi preservado.')}
}
