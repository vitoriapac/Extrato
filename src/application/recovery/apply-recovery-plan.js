import {prepareRecoveryApplication} from './prepare-recovery-application.js';
import {buildRecoveryDecisionRecord} from './build-recovery-decision-record.js';
import {validateRecoveryState,validateRecoveryConfirmation} from './recovery-invariants.js';
import {createStudyPlanService} from '../planning/study-plan-service.js';
import {createPlanningRepository} from '../../repositories/planning-repository.js';
import {buildRecommendationExplanation} from '../recommendations/build-recommendation-explanation.js';

export const rejectRecovery=(reasonCode,reason='A operação não foi aplicada. Revise a proposta e tente novamente.')=>({status:'rejected',reasonCode,reason});

export function confirmRecoveryDraft(plan,draft,{clock,idGenerator}={}){
  return createStudyPlanService({repository:createPlanningRepository({getState:()=>draft}),clock,idGenerator,
    algorithmVersion:()=>draft.algorithmVersions?.recommendations||1,getActiveExamTags:()=>draft.examBlueprint?.activeExamTags||[]}).confirm(plan);
}

export async function applyRecoveryPlan({state,currentPlan,currentPreview,displayedSignature,activeExamTags=[],services={}}={}){
  try{
    const prepared=prepareRecoveryApplication({displayedSignature,currentPreview,currentPlan,activeExamTags});
    if(prepared.state!=='ready')return rejectRecovery(prepared.state==='stale'?'stale_preview':'invalid_allocation',prepared.reason);
    const before=structuredClone(state),draft=structuredClone(before),createdAt=services.clock.nowISO();
    const decision=(services.buildDecisionRecord||buildRecoveryDecisionRecord)({application:prepared,beforePlan:currentPlan,
      confirmedPlanId:'pending-plan',activeExamTags,createdAt,idGenerator:services.idGenerator,
      explanationSnapshot:(services.buildExplanation||buildRecommendationExplanation)({from:currentPreview.from,to:currentPreview.to,
        transferMinutes:currentPreview.transferMinutes,rationale:currentPreview.explanation},{createdAt,
        weeklyPlannedMinutes:currentPlan.weeklyPlannedMinutes,weeklyAvailableMinutes:currentPlan.weeklyAvailableMinutes})});
    if(!decision)return rejectRecovery('invalid_audit_record');
    const snapshot=services.buildReadinessSnapshot(before,createdAt,'Antes de aplicar um plano de recuperação');
    if(!snapshot)return rejectRecovery('invalid_snapshot');
    const plan=(services.confirmPlan||confirmRecoveryDraft)({...prepared.plan,adaptiveAdvice:null,adaptiveHistoryId:null},draft,services);
    if(!plan)return rejectRecovery('confirmation_failed');
    const confirmed=validateRecoveryConfirmation({expected:prepared.plan,confirmed:plan,activeExamTags});
    if(!confirmed.valid)return rejectRecovery(confirmed.reasonCode);
    decision.planId=plan.id;draft.adaptivePlanningHistory.push(decision);draft.readinessSnapshots.push(snapshot);
    const invariant=validateRecoveryState({before,after:draft});if(!invariant.valid)return rejectRecovery(invariant.reasonCode);
    const committed=await services.commitState({before,after:draft});
    if(committed.status!=='committed')return rejectRecovery(committed.reasonCode,committed.reason);
    return {status:'applied',plan,decisionRecord:decision,readinessSnapshot:snapshot};
  }catch(error){return rejectRecovery('application_failed','Não foi possível concluir a recuperação. O estado em memória foi preservado.')}
}
