import {calculateFactorScore,createScoreResult,describeScoreEvidence} from '../analytics/score-evidence.js';

export const RISK_ALGORITHM_VERSION=1;
export const RISK_WEIGHTS=Object.freeze({masteryRisk:.25,retentionRisk:.25,trendRisk:.15,recencyRisk:.15,examImpact:.15,examProximity:.05});

export function calculateRiskScore(factors={},weights=RISK_WEIGHTS,{evidenceStrength=null}={}){
  const result=calculateFactorScore(factors,weights);
  const evidence=describeScoreEvidence({completeness:result.completeness,evidenceStrength:evidenceStrength??result.completeness});
  const value=result.value;
  const reasons=Object.entries(result.contributions).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([key])=>key);
  return {...result,...createScoreResult({value,state:value===null?'empty':'estimated',evidence,confidence:evidence.evidenceStrength,
    factors:result.factors,reasons,algorithmVersion:RISK_ALGORITHM_VERSION}),level:value===null?'insufficient':value>=70?'high':value>=40?'medium':'low',
    completeness:result.completeness,confidenceLabel:evidence.evidenceLabel};
}
