import {applyRecoveryPlan,rejectRecovery} from '../../application/recovery/apply-recovery-plan.js';
import {revertRecoveryPlan} from '../../application/recovery/revert-recovery-plan.js';

export function createRecoveryController({getState,getPlan,getActiveExamTags,getPreview,services,isDisabled=()=>false}={}){
  let pending=false;
  const preview=trajectory=>{
    const result=getPreview(trajectory),state=getState();
    return {...result,canApply:result.canApply&&!isDisabled(),signature:result.signature?JSON.stringify({allocation:result.signature,
      examDate:state.examDate,goals:state.metas,blueprint:state.examBlueprint}):null};
  };
  const run=async(operation,{allowDemo=false}={})=>{
    if(isDisabled()&&!allowDemo)return rejectRecovery('demo_mode','A recuperação real fica indisponível durante a demonstração.');
    if(pending)return rejectRecovery('operation_pending','Aguarde a conclusão da operação em andamento.');
    pending=true;try{return await operation()}catch(error){return rejectRecovery('operation_failed','Não foi possível concluir a operação. Revise o planejamento atual.')}finally{pending=false}
  };
  return {
    preview,
    apply:displayedSignature=>run(()=>applyRecoveryPlan({state:getState(),currentPlan:getPlan(),currentPreview:preview(),
      displayedSignature,activeExamTags:getActiveExamTags(),services})),
    revert:decisionId=>run(()=>revertRecoveryPlan({state:getState(),currentPlan:getPlan(),decisionId,activeExamTags:getActiveExamTags(),services}),
      {allowDemo:getState().adaptivePlanningHistory.find(item=>item.id===decisionId)?.decisionType!=='recovery'})
  };
}
