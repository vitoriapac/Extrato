export const RECOMMENDATION_WEIGHTS=Object.freeze({examImpact:.25,retentionRisk:.20,masteryGap:.20,reviewUrgency:.15,planAlignment:.10,recencyRisk:.10});
const clamp=value=>Math.max(0,Math.min(100,Number(value)||0));

export function recommendStudy(candidates=[],options={}){
  const availableMinutes=Math.max(0,Number(options.availableMinutes)||0);
  const excluded=new Set(options.excludedIds||[]);
  return candidates.filter(item=>item&&!item.archived&&!item.completed&&!excluded.has(item.id))
    .map(item=>{
      const factors={}; let weighted=0,weight=0;
      Object.entries(RECOMMENDATION_WEIGHTS).forEach(([key,factorWeight])=>{
        if(item[key]==null)return;
        factors[key]=clamp(item[key]);weighted+=factors[key]*factorWeight;weight+=factorWeight;
      });
      const reasons=[];
      if(factors.reviewUrgency>=40)reasons.push('revisão atrasada ou prevista para agora');
      if(factors.retentionRisk>=40)reasons.push('retenção estimada pede reforço');
      if(factors.masteryGap>=40)reasons.push('há margem relevante para melhorar o domínio');
      if(factors.examImpact>=60)reasons.push('alto impacto configurado na prova');
      if(factors.recencyRisk>=40)reasons.push('tempo elevado sem contato');
      const factorCount=Object.keys(factors).length;
      return {...item,factors,score:weight?Math.round(weighted/weight):0,reasons:reasons.length?reasons:['prioridade compatível com o plano atual'],confidence:factorCount>=5?'alta':factorCount>=3?'média':'baixa'};
    })
    .filter(item=>item.estimatedMinutes<=availableMinutes&&Object.keys(item.factors).length)
    .sort((a,b)=>b.score-a.score||a.estimatedMinutes-b.estimatedMinutes);
}
