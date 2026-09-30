export function updateSubjectAccuracyTargets(blueprint={},subjectIds=[],value=null){
  if(value!==null&&(!Number.isFinite(Number(value))||Number(value)<0||Number(value)>100))return null;
  const selected=new Set(subjectIds.filter(Boolean));
  if(!selected.size)return null;
  const configs=new Map((blueprint.subjects||[]).map(item=>[item.subjectId,{...item}]));
  for(const subjectId of selected){
    const current=configs.get(subjectId)||{subjectId,expectedQuestions:0,questionWeight:1,priority:'normal',masteryTarget:null};
    configs.set(subjectId,{...current,accuracyTarget:value===null?null:Number(value)});
  }
  return {...blueprint,subjects:[...configs.values()]};
}
