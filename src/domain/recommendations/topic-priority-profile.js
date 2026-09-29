const number=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
export function captureTopicPriorityProfile(candidate={}, {capturedAt=null,activeExamTags=null}={}){
  return {version:1,capturedAt,topicId:candidate.topicId||null,subjectId:candidate.subjectId||null,activeExamTags:Array.isArray(activeExamTags)?[...activeExamTags]:null,algorithmVersion:candidate.algorithmVersion??null,score:number(candidate.score??candidate.priority),mastery:number(candidate.mastery),retention:number(candidate.retention),examImpact:number(candidate.examImpact),incidence:number(candidate.examIntelligence?.presencePercent),confidence:number(candidate.evidence?.evidenceStrength??candidate.evidence?.confidence??candidate.evidenceStrength),historicalConfidence:candidate.examIntelligence?.confidenceLabel||null,reasons:[...(candidate.reasons||[])],topicName:candidate.topicName||null,subjectName:candidate.subjectName||null};
}
export function classifyTopicPriority(profile){
  if(profile.score==null)return 'Sem prioridade registrada';
  if(profile.confidence==null||profile.confidence<.35)return 'Evidência limitada';
  if(profile.score<40&&profile.mastery>=70&&profile.retention>=60)return 'Manutenção';
  return profile.score>=85?'Crítica':profile.score>=70?'Alta':profile.score>=40?'Moderada':'Baixa';
}
export function compareTopicPriority(previous,current){
  if(!previous||previous.algorithmVersion==null||previous.algorithmVersion!==current.algorithmVersion)return {state:'insufficient',label:'Sem comparação de método equivalente',reasons:[]};
  const fields=[['mastery','Domínio'],['retention','Retenção'],['examImpact','Impacto'],['incidence','Incidência']];
  const reasons=fields.filter(([key])=>previous[key]!=null&&current[key]!=null&&previous[key]!==current[key]).map(([key,label])=>`${label}: ${previous[key]} → ${current[key]}`);
  if(previous.confidence==null||current.confidence==null||Math.min(previous.confidence,current.confidence)<.35||previous.mastery==null||current.mastery==null||previous.retention==null||current.retention==null)return {state:'insufficient',label:'Evidência insuficiente para avaliar a trajetória',reasons};
  const mastery=current.mastery-previous.mastery,retention=current.retention-previous.retention;
  const state=classifyTopicPriority(current)==='Manutenção'?'consolidated':mastery>=3&&retention>-3||retention>=3&&mastery>-3?'improving':mastery<=-3&&retention<3||retention<=-3&&mastery<3?'worsening':Math.abs(mastery)<3&&Math.abs(retention)<3?'stable':'mixed';
  return {state,label:{consolidated:'Consolidada · manutenção',improving:'Melhorando',worsening:'Piorando',stable:'Estável',mixed:'Sinais mistos'}[state],reasons};
}
