export const COGNITIVE_CONFIDENCE_LIMITS=Object.freeze({low:20,medium:40,high:80});

export function cognitiveConfidence(categorizedErrors,limits=COGNITIVE_CONFIDENCE_LIMITS){
  const count=Math.max(0,Number(categorizedErrors)||0);
  if(count<limits.low)return {key:'insufficient',label:'Insuficiente'};
  if(count<limits.medium)return {key:'low',label:'Baixa'};
  if(count<limits.high)return {key:'medium',label:'Média'};
  return {key:'high',label:'Alta'};
}

export function buildCognitiveProfile(records=[],categoryKeys=[]){
  const categories=Object.fromEntries(categoryKeys.map(key=>[key,0]));
  let totalErrors=0;const dates=[];
  for(const record of records){
    const errors=Math.max(0,(Number(record.resolved)||0)-(Number(record.correct)||0));
    totalErrors+=errors;if(record.date)dates.push(record.date);
    let remaining=errors;
    for(const key of categoryKeys){const value=Math.max(0,Math.floor(Number(record.errorBreakdown?.[key])||0)),accepted=Math.min(value,remaining);categories[key]+=accepted;remaining-=accepted}
  }
  const categorizedErrors=Object.values(categories).reduce((sum,value)=>sum+value,0),orderedDates=dates.sort();
  return {categories,totalErrors,categorizedErrors,uncategorized:Math.max(0,totalErrors-categorizedErrors),coverage:totalErrors?Math.round(categorizedErrors/totalErrors*100):0,confidence:cognitiveConfidence(categorizedErrors),sampleSize:records.length,periodStart:orderedDates[0]||null,periodEnd:orderedDates[orderedDates.length-1]||null};
}
