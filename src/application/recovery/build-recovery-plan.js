import {ADAPTIVE_PLANNING_VERSION,buildAdaptivePlanningAdvice} from '../../domain/planning/adaptive-planning.js';
import {buildRecoveryCandidates} from './build-recovery-candidates.js';
import {buildRecoveryAllocation} from './build-recovery-allocation.js';
import {RECOVERY_STATUS} from './recovery-status.js';

const base=(status,reasonCode,reason)=>({available:false,status,reasonCode,reason,capacity:null,totalMinutes:null,
  changes:[],preserved:[],reduced:[],increased:[],explanation:[]});
const scope=tags=>JSON.stringify([...(tags||[])].sort());

// Preview only. The adaptive planner owns pair selection, limits and cooldown.
export function buildRecoveryPlan({trajectory=null,topicRisks=trajectory?.topicRisks||[],currentPlan=null,
  weeklyCapacityMinutes=null,priorities=[],history=[],today,activeExamTags=[],constraints={}}={}){
  if(trajectory?.status==='on_track')return base(RECOVERY_STATUS.notNeeded,'on_track','A trajetória atual não exige redistribuição.');
  if(!trajectory||trajectory.status==='insufficient_data')return base(RECOVERY_STATUS.unavailable,'insufficient_evidence','Reúna simulados comparáveis antes de propor redistribuição.');
  if(!currentPlan)return base(RECOVERY_STATUS.unavailable,'missing_plan','Confirme um plano semanal antes de avaliar a recuperação.');
  const capacity=weeklyCapacityMinutes??currentPlan.weeklyAvailableMinutes;
  const budget=Number(currentPlan.weeklyPlannedMinutes);
  if(!Number.isSafeInteger(capacity)||capacity<=0||!Number.isSafeInteger(budget)||budget<=0||budget>capacity
    ||currentPlan.weeklyAvailableMinutes!=null&&currentPlan.weeklyAvailableMinutes!==capacity)
    return base(RECOVERY_STATUS.unavailable,'capacity_changed','A disponibilidade atual não corresponde à versão do plano. Atualize o plano antes de simular recuperação.');
  if(Array.isArray(currentPlan.activeExamTags)&&scope(currentPlan.activeExamTags)!==scope(activeExamTags))
    return base(RECOVERY_STATUS.unavailable,'scope_changed','O plano pertence a outro concurso.');
  if(trajectory.exam?.phase==='final_review')return base(RECOVERY_STATUS.limited,'exam_phase','Na revisão final, preserve o plano confirmado e priorize sua execução.');
  const {eligible,riskSubjects}=buildRecoveryCandidates({candidates:priorities,topicRisks,
    eligibleSubjectIds:constraints.eligibleSubjectIds,eligibleTopicIds:constraints.eligibleTopicIds});
  if(!riskSubjects.size)return base(RECOVERY_STATUS.unavailable,'no_scoped_risk','Não há lacuna de alto impacto elegível para receber tempo.');
  const advice=buildAdaptivePlanningAdvice({plan:currentPlan,candidates:eligible,history,today});
  if(advice.state!=='proposal')return base(advice.reasonCode==='cooldown'||advice.reasonCode==='capacity_constraint'
    ?RECOVERY_STATUS.limited:RECOVERY_STATUS.unavailable,advice.reasonCode||'unknown',advice.reason);
  if(!riskSubjects.has(advice.to.subjectId))return base(RECOVERY_STATUS.unavailable,'destination_mismatch','A transferência sugerida não atende à lacuna identificada na trajetória.');
  if(constraints.archivedSubjectIds?.includes(advice.from.subjectId)||constraints.archivedSubjectIds?.includes(advice.to.subjectId))
    return base(RECOVERY_STATUS.unavailable,'archived_content','A proposta envolve uma disciplina arquivada.');
  const comparison=buildRecoveryAllocation(currentPlan,advice);
  if(!comparison)return base(RECOVERY_STATUS.unavailable,'invalid_allocation','A redistribuição não preservou as invariantes do plano.');
  const basis={planId:currentPlan.id||null,weeklyCapacityMinutes:capacity,weeklyPlannedMinutes:budget,
    activeExamTags:[...activeExamTags].sort(),examDate:trajectory.exam?.date||null,
    targetScore:trajectory.current?.targetScore??null,algorithmVersion:ADAPTIVE_PLANNING_VERSION};
  return {available:true,status:RECOVERY_STATUS.recoverable,reasonCode:'transfer_proposed',
    capacity:{current:capacity,proposed:capacity},totalMinutes:{current:budget,proposed:budget},
    ...comparison,transferMinutes:advice.transferMinutes,from:structuredClone(advice.from),to:structuredClone(advice.to),
    explanation:[...advice.rationale],basis,signature:JSON.stringify(basis),
    algorithmVersion:ADAPTIVE_PLANNING_VERSION};
}
