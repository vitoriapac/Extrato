import {EXAM_TAGS,institutionForExamTag} from './exam-catalog.js';

const tagsOf=topic=>Array.isArray(topic?.examTags)?topic.examTags:[];
export const normalizeExamTags=tags=>[...new Set((Array.isArray(tags)?tags:[]).filter(Boolean).map(String))].sort();
export function isTopicInExamScope(topic,activeExamTags=[]){const active=new Set(activeExamTags||[]),tags=tagsOf(topic);return active.size===0||tags.length===0||tags.some(tag=>active.has(tag))}
export function filterTopicsByExamScope(topics=[],activeExamTags=[]){return topics.filter(topic=>isTopicInExamScope(topic,activeExamTags))}
export function resolveExamScope(topics=[],activeExamTags=[]){
  const activeTags=normalizeExamTags(activeExamTags),eligibleTopics=[],excludedTopics=[],catalogTopics=[],personalTopics=[];
  for(const topic of topics||[]){
    if(topic?.archived)continue;
    const personal=tagsOf(topic).length===0;
    (personal?personalTopics:catalogTopics).push(topic);
    (isTopicInExamScope(topic,activeTags)?eligibleTopics:excludedTopics).push(topic);
  }
  return Object.freeze({eligibleTopics,catalogTopics,personalTopics,excludedTopics,activeExamTags:activeTags});
}
export function isCommonTopic(topic,examTags=[EXAM_TAGS.BB,EXAM_TAGS.CAIXA]){const tags=new Set(tagsOf(topic));return examTags.length>1&&examTags.every(tag=>tags.has(tag))}
export function topicExamScopeLabel(topic){const tags=tagsOf(topic);if(!tags.length)return 'Conteúdo pessoal';return tags.map(tag=>tag===EXAM_TAGS.BB?'BB':tag===EXAM_TAGS.CAIXA?'CAIXA':tag===EXAM_TAGS.CAIXA_TI?'CAIXA TI':tag).join(' · ')}
export function institutionsForExamTags(tags=[]){return [...new Set(tags.map(institutionForExamTag).filter(Boolean))]}
