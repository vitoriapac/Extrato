const finite=value=>Number.isFinite(Number(value))?Number(value):null;
export const TOPIC_IMPACT_SOURCES=Object.freeze({MANUAL:'manual',CATALOG:'catalog',SUBJECT:'subject',MISSING:'missing'});

export function resolveTopicExamImpact({topic={},subjectConfig=null,activeExamTags=[]}={}){
  if(topic.examImportance!=null){
    const value=Math.max(0,Math.min(100,Number(topic.examImportance)*100));
    return {value,source:TOPIC_IMPACT_SOURCES.MANUAL,sourceLabel:'Definido manualmente no tópico'};
  }
  const estimates=Object.entries(topic.examImportanceEstimates||{})
    .filter(([profile])=>!activeExamTags.length||activeExamTags.some(tag=>profile.startsWith(tag)))
    .map(([,value])=>finite(value)).filter(value=>value!=null);
  if(estimates.length){
    return {value:Math.max(...estimates)*100,source:TOPIC_IMPACT_SOURCES.CATALOG,sourceLabel:'Estimativa do catálogo para o concurso ativo'};
  }
  if(subjectConfig){
    const questions=Math.max(0,finite(subjectConfig.expectedQuestions)||0);
    const weight=Math.max(0,finite(subjectConfig.questionWeight)||1);
    return {value:Math.min(100,questions*4*weight),source:TOPIC_IMPACT_SOURCES.SUBJECT,sourceLabel:'Herdado do peso configurado para a disciplina'};
  }
  return {value:null,source:TOPIC_IMPACT_SOURCES.MISSING,sourceLabel:'Sem impacto de prova configurado'};
}

export function wouldCreatePrerequisiteCycle(topicId,candidateId,topics=[]){
  if(!topicId||!candidateId||topicId===candidateId)return true;
  const byId=new Map(topics.map(topic=>[topic.id,topic]));
  const visited=new Set();
  const reachesTopic=id=>{
    if(id===topicId)return true;
    if(visited.has(id))return false;
    visited.add(id);
    const topic=byId.get(id);
    return (topic?.prerequisites||[]).some(reachesTopic);
  };
  return reachesTopic(candidateId);
}
