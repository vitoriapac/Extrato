import {calculateFactorScore,createScoreResult,describeScoreEvidence} from './score-evidence.js';

export const PRIORITY_ALGORITHM_VERSION=4;
export const PRIORITY_WEIGHTS=Object.freeze({examImpact:.225,retentionRisk:.175,masteryGap:.175,trendRisk:.10,reviewUrgency:.10,reviewHealthRisk:.10,planAlignment:.0625,recencyRisk:.0625});

export function calculatePriorityScore(candidate={}){
  const result=calculateFactorScore({...candidate,retentionRisk:candidate.retentionRisk??candidate.retentionNeed},PRIORITY_WEIGHTS);
  const reasons=[];
  if(result.factors.trendRisk>=60)reasons.push('tendência recente em queda');
  if(result.factors.reviewUrgency>=40)reasons.push('revisão atrasada ou prevista para agora');
  if(result.factors.reviewHealthRisk>=40)reasons.push('saúde da revisão requer atenção');
  if(result.factors.retentionRisk>=40)reasons.push('retenção estimada pede reforço');
  if(result.factors.masteryGap>=40)reasons.push('há margem relevante para melhorar o domínio');
  if(result.factors.examImpact>=60)reasons.push('alto impacto configurado na prova');
  if(result.factors.recencyRisk>=40)reasons.push('tempo elevado sem contato');
  const evidence=describeScoreEvidence({completeness:result.completeness,evidenceStrength:candidate.evidenceStrength??result.completeness});
  const finalReasons=reasons.length?reasons:['prioridade calculada pelos fatores disponíveis'];
  return {...result,...createScoreResult({value:result.value,state:result.value===null?'empty':result.completeness<.5?'insufficient':'estimated',evidence,
    confidence:evidence.evidenceStrength,factors:result.factors,reasons:finalReasons,algorithmVersion:PRIORITY_ALGORITHM_VERSION}),
    score:result.value??0,confidenceLabel:evidence.evidenceLabel};
}
