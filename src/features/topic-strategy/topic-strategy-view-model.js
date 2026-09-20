import {resolveTopicExamImpact,wouldCreatePrerequisiteCycle} from '../../domain/analytics/topic-strategy.js';

export function buildTopicStrategyViewModel({subject,topic,subjectConfig=null,activeExamTags=[],topics=[]}={}){
  const impact=resolveTopicExamImpact({topic,subjectConfig,activeExamTags});
  const prerequisites=new Set(topic?.prerequisites||[]);
  const candidates=topics.filter(candidate=>candidate.id!==topic?.id&&!candidate.subjectArchived&&!candidate.topicArchived).map(candidate=>({
    id:candidate.id,
    label:`${candidate.subjectName} — ${candidate.name||'Tópico sem nome'}`,
    checked:prerequisites.has(candidate.id),
    cyclic:!prerequisites.has(candidate.id)&&wouldCreatePrerequisiteCycle(topic.id,candidate.id,topics)
  }));
  return{subjectId:subject?.id,topicId:topic?.id,impactValue:impact.value==null?null:Math.round(impact.value),impactSourceLabel:impact.sourceLabel,examImportance:topic?.examImportance==null?'':Math.round(topic.examImportance*100),estimatedStudyMinutes:topic?.estimatedStudyMinutes??'',prerequisiteCount:prerequisites.size,candidates};
}
