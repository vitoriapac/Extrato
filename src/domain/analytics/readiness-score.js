export function clampMetric(value){return Math.max(0,Math.min(100,Math.round(Number(value)||0)))}

export function calculateWeightedScore(metrics,weights){
  return clampMetric(Object.entries(weights).reduce((sum,[key,weight])=>sum+(Number(metrics?.[key]?.score)||0)*weight,0));
}

export function calculateWeightedConfidence(metrics,weights){
  return Math.max(0,Math.min(1,Object.entries(weights).reduce((sum,[key,weight])=>sum+(Number(metrics?.[key]?.confidence)||0)*weight,0)));
}

export const READINESS_WEIGHTS=Object.freeze({coverage:.30,mastery:.25,retention:.20,consistency:.15,simulations:.10});

export function calculateReadinessScore(metrics,weights=READINESS_WEIGHTS){
  const entries=Object.entries(weights);
  const available=entries.filter(([key])=>metrics?.[key]?.available&&Number.isFinite(Number(metrics[key].score)));
  const missingFactors=entries.filter(([key])=>!available.some(([availableKey])=>availableKey===key)).map(([key])=>key);
  if(!available.length)return {value:null,confidence:0,confidenceLabel:'Baixa',state:'empty',factors:Object.fromEntries(entries.map(([key])=>[key,null])),missingFactors,availableFactors:[]};
  const availableWeight=available.reduce((sum,[,weight])=>sum+weight,0);
  const value=clampMetric(available.reduce((sum,[key,weight])=>sum+Number(metrics[key].score)*weight,0)/availableWeight);
  const evidenceConfidence=available.reduce((sum,[key,weight])=>sum+(Number(metrics[key].confidence)||0)*weight,0)/availableWeight;
  const coverageFactor=available.length/entries.length;
  const confidence=Math.max(0,Math.min(1,evidenceConfidence*(.55+.45*coverageFactor)));
  return {
    value,confidence,confidenceLabel:confidence>=.70?'Alta':confidence>=.35?'Média':'Baixa',
    state:available.length<2?'insufficient':'estimated',
    factors:Object.fromEntries(entries.map(([key])=>[key,metrics?.[key]?.available?Number(metrics[key].score):null])),
    missingFactors,availableFactors:available.map(([key])=>key)
  };
}
