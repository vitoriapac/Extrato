const clamp=value=>Math.max(0,Math.min(100,Number(value)||0));

export function generateDiagnosis(candidates=[]){
  const valid=candidates.filter(item=>item&&!item.archived);
  const bottlenecks=valid.map(item=>{
    const factors=[
      ['Domínio',item.mastery==null?null:100-clamp(item.mastery)],
      ['Retenção',item.retention==null?null:100-clamp(item.retention)],
      ['Cobertura',item.coverage==null?null:100-clamp(item.coverage)],
      ['Frequência',item.frequency==null?null:100-clamp(item.frequency)],
      ['Tendência',item.trendRisk==null?null:clamp(item.trendRisk)]
    ].filter(([,value])=>value!=null);
    const strongest=factors.sort((a,b)=>b[1]-a[1])[0];
    return strongest?{...item,severity:item.risk?.value??Math.round(strongest[1]),factor:strongest[0],reason:`${strongest[0]} requer atenção`}:null;
  }).filter(Boolean).filter(item=>item.severity>=35).sort((a,b)=>b.severity-a.severity);

  const opportunityWeights={examImpact:.4,improvementPotential:.35,effortEfficiency:.25};
  const opportunities=valid.map(item=>{
    let weighted=0,availableWeight=0;const factors={},missingFactors=[];
    Object.entries(opportunityWeights).forEach(([key,weight])=>{
      if(item[key]==null){missingFactors.push(key);return}
      factors[key]=clamp(item[key]);weighted+=factors[key]*weight;availableWeight+=weight;
    });
    const opportunityScore=availableWeight?Math.round(weighted/availableWeight):null;
    const confidence=Math.round(availableWeight*100)/100;
    return {...item,opportunityScore,opportunityFactors:factors,missingFactors,confidence,confidenceLabel:confidence>=.8?'Alta':confidence>=.5?'Média':'Baixa'};
  }).filter(item=>item.opportunityScore!=null&&item.opportunityScore>=30).sort((a,b)=>b.opportunityScore-a.opportunityScore);

  const criticalReviews=valid.filter(item=>item.reviewUrgency>0).sort((a,b)=>b.reviewUrgency-a.reviewUrgency);
  const topicsAtRisk=valid.filter(item=>(item.retention!=null&&item.retention<60)||(item.daysSinceContact||0)>=10).sort((a,b)=>(b.daysSinceContact||0)-(a.daysSinceContact||0));
  const subjectScores=new Map();
  opportunities.forEach(item=>subjectScores.set(item.subjectName,(subjectScores.get(item.subjectName)||0)+item.opportunityScore));
  const total=[...subjectScores.values()].reduce((sum,value)=>sum+value,0);
  const weeklyFocus=[...subjectScores].map(([subjectName,value])=>({subjectName,percentage:total?Math.round(value/total*100):0})).sort((a,b)=>b.percentage-a.percentage).slice(0,4);
  return {bottlenecks,opportunities,criticalReviews,topicsAtRisk,weeklyFocus,state:valid.length?'estimated':'insufficient'};
}
