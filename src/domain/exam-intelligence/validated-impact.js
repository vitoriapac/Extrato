// Historical evidence adjusts only the existing exam-impact input. A small sample
// or an explicit official/manual choice must never silently replace that choice.
export function historicalImpactEstimate(profile){
  if(profile.presencePercent==null)return null;
  return Math.max(0,Math.min(100,Math.round(profile.presencePercent*.8+(profile.participationPercent??0)*.2)));
}

export function isHistoricalImpactUsable(profile){return ['moderate','high'].includes(profile.confidence)&&profile.analyzedExamCount>=4&&profile.presencePercent!=null}

export function resolveValidatedExamImpact(profile){
  const baseline=profile.impactValue;
  const usable=isHistoricalImpactUsable(profile);
  if(!usable||['manual','official'].includes(profile.impactSourceType))return {value:baseline,usedHistory:false};
  const historical=historicalImpactEstimate(profile);
  const value=baseline==null?historical:Math.max(0,Math.min(100,Math.round(baseline+Math.max(-15,Math.min(15,(historical-baseline)*.35)))));
  return {value,usedHistory:true,historical};
}
