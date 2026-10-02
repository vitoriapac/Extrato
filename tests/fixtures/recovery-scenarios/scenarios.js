export function recoveryScenario(profile='critical'){
  const currentPlan={id:'dense',activeExamTags:['bb'],weeklyPlannedMinutes:720,weeklyAvailableMinutes:720,
    subjects:['source-a','source-b','target-a','target-b'].map(subjectId=>({subjectId,subjectName:subjectId,minutes:180})),
    items:['source-a','source-b','target-a','target-b'].flatMap(subjectId=>['a','b'].map(topic=>({id:`${subjectId}-${topic}`,subjectId,topicId:topic,minutes:90,capacityMinutes:180,activityMix:{theory:30,questions:30,reviews:30}})))};
  const priorities=currentPlan.items.map(item=>({...item,mastery:item.subjectId.startsWith('source')?90:40,evidenceStrength:.8,examImpact:item.subjectId.startsWith('source')?40:90,trend:{direction:'stable'}}));
  const trajectory={status:'attention',exam:{date:'2026-12-01',phase:'consolidation'},current:{targetScore:80},topicRisks:priorities.filter(item=>item.mastery===40)};
  if(profile==='healthy')trajectory.status='on_track';
  if(profile==='final')trajectory.exam.phase='final_review';
  if(profile==='all-critical')priorities.forEach(item=>{item.mastery=40;item.examImpact=90;});
  if(profile==='low-evidence')priorities.forEach(item=>{item.evidenceStrength=.1;});
  if(profile==='optimized')currentPlan.items.filter(item=>item.subjectId.startsWith('target')).forEach(item=>{item.capacityMinutes=item.minutes;});
  return {trajectory,currentPlan,weeklyCapacityMinutes:720,priorities,history:[],today:'2026-10-02',activeExamTags:['bb']};
}
