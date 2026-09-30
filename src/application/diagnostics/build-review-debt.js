export function buildReviewDebt({reviews=[],candidates=[],today,riskTopicIds=[]}={}){
  const byTopic=new Map(candidates.filter(item=>item.topicId).map(item=>[item.topicId,item]));
  const risk=new Set(riskTopicIds),seen=new Set();
  const rows=reviews.filter(item=>item.id&&!seen.has(item.id)&&seen.add(item.id)&&item.date&&item.date<today&&item.status!=='Concluído')
    .map(item=>{
      const topicId=item.topicId||item.topicRef,candidate=byTopic.get(topicId);
      return {id:item.id,date:item.date,subjectId:item.subjectId||candidate?.subjectId||null,topicId,
        topicName:candidate?.topicName||item.topic||'Tópico',subjectName:candidate?.subjectName||'Disciplina',
        highPriority:Boolean(candidate&&Number(candidate.score)>=70&&Number(candidate.examImpact)>=70),
        consolidationRisk:risk.has(topicId)};
    }).sort((a,b)=>Number(b.highPriority)-Number(a.highPriority)||a.date.localeCompare(b.date)||a.topicName.localeCompare(b.topicName,'pt-BR'));
  return {rows,count:rows.length,highPriorityCount:rows.filter(item=>item.highPriority).length,
    consolidationRiskCount:new Set(rows.filter(item=>item.consolidationRisk).map(item=>item.topicId)).size};
}
