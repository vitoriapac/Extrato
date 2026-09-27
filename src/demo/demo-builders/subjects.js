import {EXAM_TAGS} from '../../domain/exams/exam-constants.js';
import {addLocalDays} from '../../core/date-utils.js';

export function demoExamTags(source=[]){
  const mapped=source.flatMap(tag=>tag==='COMUM'?[EXAM_TAGS.BB,EXAM_TAGS.CAIXA]:tag==='BB'?[EXAM_TAGS.BB]:tag==='CAIXA'?[EXAM_TAGS.CAIXA]:[]);
  return [...new Set(mapped)];
}

export function buildDemoSubjects(scenario,{createdAt,random}){
  return scenario.subjects.map((source,subjectIndex)=>({
    id:source.id,name:source.name,collapsed:false,archived:false,archivedAt:null,createdAt,
    topics:source.topics.map((topic,topicIndex)=>{
      const stage=topicIndex%5,status=stage===0?'Não iniciado':stage===1?'Em andamento':stage===2?'Revisão':'Concluído';
      const completedAt=status==='Concluído'?`${addLocalDays(createdAt.slice(0,10),20+(topicIndex*7+subjectIndex*11)%110)}T12:00:00.000Z`:null;
      return {id:topic.id,name:topic.name,examTags:demoExamTags(topic.examTags),link:'',status,archived:false,archivedAt:null,notes:'',tags:[],difficulty:topic.difficulty||'Médio',createdAt,firstCompletedAt:completedAt,lastCompletedAt:completedAt,completionCount:completedAt?1:0,lastReviewedAt:null,reviewCount:0,examImportance:Math.round((.4+random()*.55)*100)/100,estimatedStudyMinutes:120+Math.floor(random()*300),prerequisites:topicIndex===0?[]:[source.topics[topicIndex-1].id]};
    })
  }));
}
