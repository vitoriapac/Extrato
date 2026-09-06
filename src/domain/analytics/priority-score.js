import {calculateFactorScore,describeScoreEvidence} from './score-evidence.js';

export const PRIORITY_ALGORITHM_VERSION=2;
export const PRIORITY_WEIGHTS=Object.freeze({examImpact:.25,retentionRisk:.20,masteryGap:.20,reviewUrgency:.15,planAlignment:.10,recencyRisk:.10});

export function calculatePriorityScore(candidate={}){
  const result=calculateFactorScore({...candidate,retentionRisk:candidate.retentionRisk??candidate.retentionNeed},PRIORITY_WEIGHTS);
  const reasons=[];
  if(result.factors.reviewUrgency>=40)reasons.push('revisão atrasada ou prevista para agora');
  if(result.factors.retentionRisk>=40)reasons.push('retenção estimada pede reforço');
  if(result.factors.masteryGap>=40)reasons.push('há margem relevante para melhorar o domínio');
  if(result.factors.examImpact>=60)reasons.push('alto impacto configurado na prova');
  if(result.factors.recencyRisk>=40)reasons.push('tempo elevado sem contato');
  const evidence=describeScoreEvidence({completeness:result.completeness,evidenceStrength:candidate.evidenceStrength});
  return {...result,score:result.value??0,reasons:reasons.length?reasons:['prioridade calculada pelos fatores disponíveis'],
    confidence:evidence.completenessLabel.toLowerCase(),evidence,algorithmVersion:PRIORITY_ALGORITHM_VERSION};
}
