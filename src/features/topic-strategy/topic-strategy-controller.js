import {wouldCreatePrerequisiteCycle} from '../../domain/analytics/topic-strategy.js';

export function createTopicStrategyController({findTopic,listTopics,subjectService,normalizeTopic,invalidatePlan=()=>{},onChanged=()=>{},onCycle=()=>{}}={}){
  if(typeof findTopic!=='function'||typeof listTopics!=='function'||!subjectService)throw new TypeError('Controller de estratégia requer tópicos e serviço de disciplinas.');
  const update=(subjectId,topicId,field,value)=>{
    const found=findTopic(topicId);if(!found||found.subject.id!==subjectId)return false;
    const changes={fieldOrigins:{...(found.topic.fieldOrigins||{}),[field]:'manual'}};
    if(field==='examImportance')changes.examImportance=value===''?null:Number(value)/100;
    else if(field==='estimatedStudyMinutes')changes.estimatedStudyMinutes=value===''?null:Number(value);
    else return false;
    const next={...found.topic,...changes};normalizeTopic?.(next);invalidatePlan();subjectService.updateTopic(subjectId,topicId,next);onChanged();return true;
  };
  const togglePrerequisite=(subjectId,topicId,prerequisiteId,checked)=>{
    const found=findTopic(topicId);if(!found||found.subject.id!==subjectId)return false;
    const topics=listTopics();
    if(checked&&wouldCreatePrerequisiteCycle(topicId,prerequisiteId,topics)){onCycle();return false}
    const next=new Set(found.topic.prerequisites||[]);checked?next.add(prerequisiteId):next.delete(prerequisiteId);
    invalidatePlan();subjectService.updateTopic(subjectId,topicId,{prerequisites:[...next]});onChanged();return true;
  };
  return Object.freeze({update,togglePrerequisite});
}
