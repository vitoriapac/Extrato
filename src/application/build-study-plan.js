const clamp=value=>Math.max(0,Math.min(100,Number(value)||0));

export function buildStudyPlan({topics=[],weeklyAvailableMinutes=0,weeksUntilExam=0}={}){
  const active=topics.filter(item=>item&&!item.archived&&!item.completed);
  const configured=active.filter(item=>Number(item.estimatedMinutes)>0);
  const missingEffort=active.filter(item=>!Number(item.estimatedMinutes)).map(item=>item.id);
  const availability=Math.max(0,Math.round(Number(weeklyAvailableMinutes)||0));
  const weeks=Math.max(0,Math.ceil(Number(weeksUntilExam)||0));
  if(!configured.length||availability<=0||weeks<=0)return {state:'insufficient',weeklyAvailableMinutes:availability,weeksUntilExam:weeks,remainingMinutes:configured.reduce((sum,item)=>sum+Number(item.estimatedMinutes),0),missingEffort,items:[],subjects:[],activityMix:{theory:0,questions:0,reviews:0},confidence:0};
  const remainingMinutes=configured.reduce((sum,item)=>sum+Number(item.estimatedMinutes),0);
  const weeklyBudget=Math.min(availability,Math.ceil(remainingMinutes/weeks));
  const scored=configured.map(item=>{
    const examImpact=item.examImpact==null?50:clamp(item.examImpact),masteryGap=item.masteryGap==null?50:clamp(item.masteryGap),retentionNeed=item.retentionNeed==null?50:clamp(item.retentionNeed),urgency=clamp(100-(weeks-1)*4);
    const score=Math.max(1,examImpact*.35+masteryGap*.30+retentionNeed*.20+urgency*.15);
    return {...item,score};
  });
  const totalScore=scored.reduce((sum,item)=>sum+item.score,0);
  const allocations=new Map(scored.map(item=>[item.id,Math.min(Math.round(Number(item.estimatedMinutes)),Math.floor(weeklyBudget*item.score/totalScore))]));
  let unallocated=weeklyBudget-[...allocations.values()].reduce((sum,value)=>sum+value,0);
  for(const item of [...scored].sort((a,b)=>b.score-a.score)){
    if(unallocated<=0)break;
    const current=allocations.get(item.id),capacity=Math.max(0,Math.round(Number(item.estimatedMinutes))-current),extra=Math.min(capacity,unallocated);
    allocations.set(item.id,current+extra);unallocated-=extra;
  }
  const items=scored.map(item=>{
    const minutes=allocations.get(item.id)||0;
    const reviewShare=item.retentionNeed>=60?.35:.20,questionShare=item.masteryGap>=60?.40:.30;
    const reviews=Math.round(minutes*reviewShare),questions=Math.round(minutes*questionShare),theory=Math.max(0,minutes-reviews-questions);
    return {...item,minutes,activityMix:{theory,questions,reviews}};
  }).filter(item=>item.minutes>0);
  const subjectMap=new Map();
  items.forEach(item=>{const current=subjectMap.get(item.subjectId)||{subjectId:item.subjectId,subjectName:item.subjectName,minutes:0};current.minutes+=item.minutes;subjectMap.set(item.subjectId,current)});
  const activityMix=items.reduce((sum,item)=>({theory:sum.theory+item.activityMix.theory,questions:sum.questions+item.activityMix.questions,reviews:sum.reviews+item.activityMix.reviews}),{theory:0,questions:0,reviews:0});
  const coverage=active.length?configured.length/active.length:0;
  const strategicCoverage=configured.filter(item=>item.examImpact!=null).length/configured.length;
  const confidence=Math.round((coverage*.65+strategicCoverage*.35)*100)/100;
  return {state:confidence>=.75?'ready':'estimated',weeklyAvailableMinutes:availability,weeklyPlannedMinutes:items.reduce((sum,item)=>sum+item.minutes,0),weeksUntilExam:weeks,remainingMinutes,missingEffort,items,subjects:[...subjectMap.values()].sort((a,b)=>b.minutes-a.minutes),activityMix,confidence,confidenceLabel:confidence>=.8?'Alta':confidence>=.5?'Média':'Baixa'};
}
