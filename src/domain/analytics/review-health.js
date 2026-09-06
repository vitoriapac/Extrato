import {calculateFactorScore,createScoreResult,describeScoreEvidence} from './score-evidence.js';

export const REVIEW_HEALTH_ALGORITHM_VERSION=1;
export const REVIEW_HEALTH_WEIGHTS=Object.freeze({recency:.25,retention:.30,mastery:.25,recentPerformance:.15,examResilience:.05});
const clamp=value=>Math.max(0,Math.min(100,Number(value)||0));

export function calculateReviewHealth({daysSinceReview=null,hasPriorStudy=false,retention=null,mastery=null,recentPerformance=null,examImpact=null,evidenceStrength=null}={}){
  const knowledge=[retention,mastery,recentPerformance].filter(value=>value!=null&&Number.isFinite(Number(value)));
  const knowledgeFloor=knowledge.length?Math.min(...knowledge.map(clamp)):null;
  const factors={
    recency:daysSinceReview==null?(hasPriorStudy?0:null):clamp(100-Math.max(0,Number(daysSinceReview))*4),
    retention,mastery,recentPerformance,
    examResilience:examImpact==null||knowledgeFloor==null?null:clamp(100-clamp(examImpact)*(100-knowledgeFloor)/100)
  };
  const scored=calculateFactorScore(factors,REVIEW_HEALTH_WEIGHTS);
  const reasons=[];
  if(daysSinceReview==null&&hasPriorStudy)reasons.push('nenhuma revisão registrada');
  else if(factors.recency!=null&&factors.recency<60)reasons.push('muito tempo desde a última revisão');
  if(factors.retention!=null&&factors.retention<60)reasons.push('retenção pede reforço');
  if(factors.mastery!=null&&factors.mastery<60)reasons.push('domínio ainda frágil');
  if(factors.recentPerformance!=null&&factors.recentPerformance<60)reasons.push('desempenho recente abaixo do esperado');
  if(factors.examResilience!=null&&factors.examResilience<60)reasons.push('fragilidade relevante para a prova');
  const strength=evidenceStrength==null?scored.completeness:Math.max(0,Math.min(1,Number(evidenceStrength)||0));
  const evidence=describeScoreEvidence({completeness:scored.completeness,evidenceStrength:strength});
  return createScoreResult({value:scored.value,state:scored.value===null?'empty':scored.completeness<.5?'insufficient':'estimated',evidence,
    confidence:strength,factors:scored.factors,reasons:reasons.length?reasons:['revisão em condição estável'],algorithmVersion:REVIEW_HEALTH_ALGORITHM_VERSION,
    missingFactors:scored.missingFactors,contributions:scored.contributions,level:scored.value===null?'unknown':scored.value>=70?'healthy':scored.value>=45?'attention':'critical'});
}
