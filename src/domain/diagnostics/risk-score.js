export const RISK_WEIGHTS=Object.freeze({masteryRisk:.25,retentionRisk:.25,trendRisk:.15,recencyRisk:.15,examImpact:.15,examProximity:.05});
const clamp=value=>Math.max(0,Math.min(100,Number(value)||0));

export function calculateRiskScore(factors={},weights=RISK_WEIGHTS){
  let weighted=0,availableWeight=0;const normalized={},missingFactors=[],contributions={};
  Object.entries(weights).forEach(([key,weight])=>{
    if(factors[key]==null){missingFactors.push(key);return}
    normalized[key]=clamp(factors[key]);weighted+=normalized[key]*weight;availableWeight+=weight;
  });
  if(!availableWeight)return {value:null,level:'insufficient',confidence:0,confidenceLabel:'Baixa',factors:normalized,missingFactors,contributions:{}};
  const value=Math.round(weighted/availableWeight);
  Object.entries(normalized).forEach(([key,factor])=>{contributions[key]=Math.round(factor*(weights[key]/availableWeight))});
  const confidence=Math.round(availableWeight*100)/100;
  return {value,level:value>=70?'high':value>=40?'medium':'low',confidence,confidenceLabel:confidence>=.8?'Alta':confidence>=.5?'Média':'Baixa',factors:normalized,missingFactors,contributions};
}
