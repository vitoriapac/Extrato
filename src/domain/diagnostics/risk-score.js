import {calculateFactorScore,describeScoreEvidence} from '../analytics/score-evidence.js';

export const RISK_WEIGHTS=Object.freeze({masteryRisk:.25,retentionRisk:.25,trendRisk:.15,recencyRisk:.15,examImpact:.15,examProximity:.05});

export function calculateRiskScore(factors={},weights=RISK_WEIGHTS,{evidenceStrength=null}={}){
  const result=calculateFactorScore(factors,weights);
  const evidence=describeScoreEvidence({completeness:result.completeness,evidenceStrength});
  const value=result.value;
  return {...result,level:value===null?'insufficient':value>=70?'high':value>=40?'medium':'low',
    confidence:result.completeness,confidenceLabel:evidence.completenessLabel,evidence};
}
