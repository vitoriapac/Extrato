export const STUDY_ACTION_SOURCES=Object.freeze(['overview','today','diagnosis','planning','review']);

export function recommendationActionKind(item={}){
  if(item.activityType)return item.activityType;
  if((item.blockedPrerequisites||[]).length)return'prerequisite';
  if(item.studyType==='questions')return'questions';
  if(item.studyType==='review')return'review';
  return'study';
}

export function recommendationActionLabel(item){
  return({questions:'Resolver questões',review:'Iniciar revisão',prerequisite:'Estudar pré-requisito',study:'Iniciar estudo'})[recommendationActionKind(item)]||'Iniciar estudo';
}

const finiteOrNull=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
const sourceOrDefault=source=>STUDY_ACTION_SOURCES.includes(source)?source:'overview';

export function buildStudyAction(recommendation,{source='overview'}={}){
  if(!recommendation)return null;
  const recommendationId=recommendation.recommendationId||null;
  const id=recommendationId||recommendation.id||null;
  if(!id)return null;
  const evidence=recommendation.evidence||{};
  return Object.freeze({
    id:String(id),recommendationId:recommendationId?String(recommendationId):null,source:sourceOrDefault(source),
    subjectId:recommendation.subjectId||null,topicId:recommendation.topicId||null,
    activityType:recommendationActionKind(recommendation),suggestedMinutes:finiteOrNull(recommendation.estimatedMinutes),
    priority:finiteOrNull(recommendation.score),reasons:[...(Array.isArray(recommendation.reasons)?recommendation.reasons:[])].filter(Boolean),
    evidence:Object.freeze({mastery:finiteOrNull(recommendation.mastery),retention:finiteOrNull(recommendation.retention),
      strength:finiteOrNull(evidence.evidenceStrength),completeness:finiteOrNull(evidence.completeness),label:evidence.evidenceLabel||null,
      factors:recommendation.factors?structuredClone(recommendation.factors):null}),
    algorithmVersion:finiteOrNull(recommendation.algorithmVersion)
  });
}
