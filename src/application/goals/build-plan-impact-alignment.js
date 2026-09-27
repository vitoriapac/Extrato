export function buildPlanImpactAlignment({distribution,topics=[],impactForTopic}={}){
  const planned=(distribution?.rows||[]).filter(row=>row.subjectId!=='unassigned'&&row.plannedMinutes>0);
  if(planned.length<2)return {state:'insufficient',reason:'Planeje tempo para pelo menos duas disciplinas nesta semana.'};
  const rows=planned.map(row=>{
    const subjectTopics=topics.filter(topic=>topic.subjectId===row.subjectId);
    const impacts=subjectTopics.map(impactForTopic).filter(value=>Number.isFinite(value)&&value>=0&&value<=100);
    const coverage=subjectTopics.length?impacts.length/subjectTopics.length:0;
    return {...row,topicCount:subjectTopics.length,impactCount:impacts.length,coverage,averageImpact:impacts.length?impacts.reduce((sum,value)=>sum+value,0)/impacts.length:null};
  });
  if(rows.some(row=>row.coverage<.5||row.impactCount<1))return {state:'insufficient',reason:'O impacto estimado cobre menos da metade dos tópicos de alguma disciplina planejada.'};
  const impactTotal=rows.reduce((sum,row)=>sum+row.averageImpact,0);
  const plannedTotal=rows.reduce((sum,row)=>sum+row.plannedMinutes,0);
  if(!impactTotal)return {state:'insufficient',reason:'Ainda não há impacto estimado para comparar as disciplinas planejadas.'};
  return {state:'ready',rows:rows.map(row=>({...row,plannedShare:row.plannedMinutes/plannedTotal*100,impactShare:row.averageImpact/impactTotal*100})),subjectCount:rows.length};
}
