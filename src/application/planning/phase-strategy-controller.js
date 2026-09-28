const signature=proposal=>JSON.stringify([proposal.basePlanId,proposal.budget,proposal.capacity,proposal.phase,proposal.changes,proposal.candidateEvidence]);

export function createPhaseStrategyController({getProposal,getLatestPlan,getPlans,confirmPlan,getCapacity,getExamDate,clock,onBeforeChange=()=>{}}={}){
  let draft=null;
  const view=()=>draft;
  const preview=()=>{draft=getProposal();return draft};
  const cancel=()=>{draft=null};
  const confirm=()=>{
    const fresh=getProposal();
    if(draft?.state!=='proposal'||fresh?.state!=='proposal'||signature(draft)!==signature(fresh)){draft=fresh;return {state:'changed',proposal:fresh}}
    onBeforeChange('Antes de confirmar a estratégia por fase');
    const plan=confirmPlan({...fresh.plan,examDate:getExamDate(),phaseStrategy:{version:fresh.version,status:'applied',sourcePlanId:fresh.basePlanId,phase:structuredClone(fresh.phase),appliedAt:clock.nowISO(),changes:structuredClone(fresh.changes),readiness:structuredClone(fresh.readiness),candidateEvidence:structuredClone(fresh.candidateEvidence)}});
    if(!plan)return {state:'blocked',reason:'Não foi possível confirmar a estratégia.'};
    draft=null;return {state:'applied',plan};
  };
  const revert=()=>{
    const current=getLatestPlan(),metadata=current?.phaseStrategy;
    if(metadata?.status!=='applied')return {state:'blocked',reason:'Não há estratégia por fase aplicada para reverter.'};
    const source=getPlans().find(item=>item.id===metadata.sourcePlanId);
    if(!source)return {state:'blocked',reason:'A versão anterior não está disponível.'};
    const capacity=getCapacity();
    if(!Number.isFinite(capacity)||source.weeklyPlannedMinutes>capacity)return {state:'blocked',reason:'A versão anterior excede a disponibilidade atual. Calcule uma nova proposta.'};
    onBeforeChange('Antes de reverter a estratégia por fase');
    const plan=confirmPlan({...structuredClone(source),weeklyAvailableMinutes:capacity,examDate:getExamDate(),phaseStrategy:{version:1,status:'reverted',sourcePlanId:current.id,restoredPlanId:source.id,appliedAt:clock.nowISO(),phase:structuredClone(source.examPhase||metadata.phase)}});
    if(!plan)return {state:'blocked',reason:'Não foi possível restaurar a divisão anterior.'};
    draft=null;return {state:'reverted',plan};
  };
  return Object.freeze({view,preview,cancel,confirm,revert});
}
