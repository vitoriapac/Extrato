const seconds=items=>items.reduce((sum,item)=>sum+Math.max(0,Number(item.durationSeconds)||0),0);

export function buildWeeklyStrategicFocus({sessions=[],candidates=[],recommendations=[],start,end}={}){
  const relevantSessions=sessions.filter(item=>item.date>=start&&item.date<=end);
  const candidatesByTopic=new Map(candidates.filter(item=>item.topicId).map(item=>[item.topicId,item]));
  const totalSeconds=seconds(relevantSessions);
  const highImpactSeconds=seconds(relevantSessions.filter(item=>(candidatesByTopic.get(item.topicId)?.examImpact??-1)>=70));
  const unknownSeconds=seconds(relevantSessions.filter(item=>!item.topicId||candidatesByTopic.get(item.topicId)?.examImpact==null));
  const workedIds=new Set(relevantSessions.filter(item=>{
    const candidate=candidatesByTopic.get(item.topicId);
    return candidate?.examImpact>=70&&candidate.mastery!=null&&candidate.mastery<70;
  }).map(item=>item.topicId));
  const outcomes=new Map();
  for(const item of recommendations){
    if(!workedIds.has(item.topicId)||item.date<start||item.date>end)continue;
    const measuredDate=String(item.outcome?.measuredAt||'').slice(0,10);
    if(measuredDate&&(measuredDate<start||measuredDate>end))continue;
    const state=item.outcome?.state;
    if(!['positive','neutral','negative'].includes(state))continue;
    const previous=outcomes.get(item.topicId);
    if(previous!=='positive'&&(state==='positive'||previous!=='negative'))outcomes.set(item.topicId,state);
  }
  const values=[...outcomes.values()];
  return {state:totalSeconds?'available':'insufficient',totalMinutes:Math.round(totalSeconds/60),highImpactMinutes:Math.round(highImpactSeconds/60),unknownMinutes:Math.round(unknownSeconds/60),highImpactPercent:totalSeconds?Math.round(highImpactSeconds/totalSeconds*100):null,workedGaps:workedIds.size,improved:values.filter(value=>value==='positive').length,stable:values.filter(value=>value==='neutral').length,declined:values.filter(value=>value==='negative').length,unmeasured:workedIds.size-outcomes.size};
}
