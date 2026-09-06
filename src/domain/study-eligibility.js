export const MIN_SESSION_MINUTES=15;

export function needsMaintenance(item){
  return (item.masteryGap!=null&&item.masteryGap>40)||
    ((item.retentionRisk??item.retentionNeed)!=null&&(item.retentionRisk??item.retentionNeed)>40)||
    (item.reviewHealthRisk!=null&&item.reviewHealthRisk>40)||item.reviewUrgency>=40;
}

export function canStudy(item,{ignoreToday=false}={}){
  return Boolean(item&&!item.archived&&!item.blockedPrerequisites?.length&&
    (ignoreToday||!item.completed)&&(!item.covered||needsMaintenance(item)));
}

export function sessionMinutes(item,availableMinutes){
  const available=Math.floor(Number(availableMinutes)||0);
  if(available<MIN_SESSION_MINUTES)return 0;
  const desired=Number(item.sessionMinutes??item.estimatedMinutes)||30;
  return Math.min(available,60,Math.max(MIN_SESSION_MINUTES,Math.round(desired)));
}

// Missing references, archived bases and transitive cycles remain blocked.
export function prerequisiteBlockers(topic,topics=[]){
  const byId=new Map(topics.map(item=>[item.id,item]));
  const blockers=new Set();
  const visit=(id,path)=>{
    if(path.has(id)){blockers.add(id);return;}
    const base=byId.get(id);
    if(!base||base.archived){blockers.add(id);return;}
    const known=base.mastery!=null&&Number.isFinite(Number(base.mastery));
    if(known?base.mastery<60:!(base.covered||base.status==='Concluído'))blockers.add(id);
    const next=new Set(path);next.add(id);
    for(const parent of base.prerequisites||[])visit(parent,next);
  };
  for(const id of topic.prerequisites||[])visit(id,new Set([topic.id]));
  return [...blockers];
}

export function withPrerequisiteEligibility(candidates,topics=candidates){
  return candidates.map(item=>({...item,blockedPrerequisites:prerequisiteBlockers(item,topics)}));
}

export function resolveStudyEligibility(candidates,topics){
  return candidates.filter(Boolean).map(item=>({...item,blockedPrerequisites:
    topics?prerequisiteBlockers(item,topics):item.blockedPrerequisites??prerequisiteBlockers(item,candidates.filter(Boolean))}));
}
