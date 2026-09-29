// Shared inputs for the existing gap engine in the overview and consolidated diagnosis.
export function buildTopicGapInputs(candidates=[],{resolveAccuracyTarget=(_,item)=>item.accuracyTarget??null,topicName=()=>null,subjectName=()=>null}={}){
  return candidates.map(item=>({subjectId:item.subjectId,topicId:item.topicId,
    accuracy:item.diagnosis?.performance?.accuracy??null,accuracyTarget:resolveAccuracyTarget(item.subjectId,item),
    name:item.topicName||topicName(item.topicId)||'Tópico removido',subjectName:item.subjectName||subjectName(item.subjectId)||'Disciplina removida',
    mastery:item.mastery,examImpact:item.examImpact,retention:item.retention,coverage:item.coverage,
    trendRisk:item.trendRisk??item.risk?.value??null,
    evidenceStrength:item.evidenceStrength??item.evidence?.evidenceStrength??null}));
}
