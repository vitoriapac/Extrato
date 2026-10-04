import {resolveExamPhase} from '../../domain/planning/adaptive-planning.js';
import {buildPhaseStrategyProposal} from '../../domain/planning/phase-strategy.js';
const scope=tags=>[...new Set(tags||[])].sort();
// Projection supplies context; existing phase strategy owns the activity split.
export function buildPhasePlanningPreview({trajectory=null,activeExamTags=[],examDate=null,targetScore=null,eligibleTopicIds=null,...input}={}){
  const active=scope(activeExamTags);
  const unavailable=reason=>({state:'insufficient',version:1,phase:resolveExamPhase(input.daysToExam),reason});
  if(Array.isArray(input.plan?.activeExamTags)&&JSON.stringify(scope(input.plan.activeExamTags))!==JSON.stringify(active))return unavailable('O plano pertence a outro escopo de concurso. Revise o planejamento antes de adaptar a fase.');
  if(Array.isArray(eligibleTopicIds)&&input.plan?.items?.some(item=>!eligibleTopicIds.includes(item.topicId||item.id)))return unavailable('Há conteúdo fora do escopo ativo ou arquivado no plano. Revise-o antes de adaptar a fase.');
  const proposal=buildPhaseStrategyProposal(input);
  const risks=(trajectory?.topicRisks||[]).filter(risk=>(input.plan?.items||[]).some(item=>item.topicId===risk.topicId)).map(risk=>({subjectId:risk.subjectId,topicId:risk.topicId,name:risk.topicName||risk.topicId,impact:risk.examImpact??null})).sort((a,b)=>String(a.topicId).localeCompare(String(b.topicId)));
  const decisionContext={examDate:examDate??trajectory?.exam?.date??null,targetScore:targetScore??trajectory?.current?.targetScore??null,activeExamTags:active,
    trajectoryStatus:trajectory?.status||'insufficient_data',confidence:trajectory?.confidence?.level||'insufficient',currentScore:trajectory?.current?.simulationAccuracy??null,risks};
  return {...proposal,decisionContext,contextExplanation:trajectory?.status&&trajectory.status!=='insufficient_data'
    ?'A trajetória e as lacunas contextualizam esta proposta. A fase ajusta a divisão das atividades existentes, sem prever ganho de nota nem alterar a prioridade.'
    :'Sem trajetória suficiente, a proposta usa apenas a fase e a evidência pessoal dos tópicos; não presume uma nota futura.'};
}
