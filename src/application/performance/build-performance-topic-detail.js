import {buildQuestionEvolution} from '../questions/build-question-evolution.js';

export function buildPerformanceTopicDetail({topicRow=null,questions=[],today,period='30',examProfile=null,history=[]}={}){
  if(!topicRow)return null;
  const evolution=buildQuestionEvolution({questions,today,scope:'topic',topicId:topicRow.id,period});
  const labels={topic_started:'Estudo iniciado',topic_completed:'Tópico concluído',topic_reopened:'Tópico reaberto'};
  const events=history.filter(item=>labels[item.type]).slice().sort((a,b)=>String(a.localDate||a.date).localeCompare(String(b.localDate||b.date))).slice(-8)
    .map(item=>({date:item.localDate||String(item.date||'').slice(0,10),label:labels[item.type]}));
  return {topic:topicRow,evolution,examProfile,events};
}
