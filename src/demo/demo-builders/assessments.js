import {addLocalDays} from '../../core/date-utils.js';
import {EXAM_TAGS} from '../../domain/exams/exam-constants.js';
import {isTopicInExamScope} from '../../domain/exams/exam-scope.js';

const stamp=date=>`${date}T12:00:00.000Z`;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function buildDemoSimulations(scenario,{today,subjects}){
  const comparison=scenario.simulationLatestComparison||{};
  return scenario.simulations.map((source,index)=>{
    const date=addLocalDays(today,source.dayOffset),lastPair=index>=scenario.simulations.length-2,examTag=index%2?EXAM_TAGS.CAIXA:EXAM_TAGS.BB;
    const breakdown=subjects.map((subject,subjectIndex)=>{
      if(!subject.topics.some(topic=>isTopicInExamScope(topic,[examTag])))return null;
      const target=comparison[subject.name];
      const rate=lastPair&&Array.isArray(target)?target[index===scenario.simulations.length-2?0:1]:source.accuracyPct+(Number(scenario.subjects[subjectIndex]?.targetAccuracyPct)||70)-70;
      const total=10,correct=clamp(Math.round(total*clamp(rate,20,98)/100),0,total);
      return {id:`demo-simulation-row-${index+1}-${subjectIndex+1}`,subjectId:subject.id,total,correct};
    }).filter(Boolean);
    return {id:`demo-simulation-${index+1}`,date,nome:`Simulado ${index+1}`,examTags:[examTag],total:breakdown.reduce((sum,row)=>sum+row.total,0),correct:breakdown.reduce((sum,row)=>sum+row.correct,0),breakdown,createdAt:stamp(date)};
  });
}

export function addDemoEssays(scenario,{today,subjects,sessions}){
  const subject=subjects.find(item=>item.name==='Redação');
  if(!subject)return;
  const eligible=sessions.filter(item=>item.type==='study').sort((a,b)=>a.date.localeCompare(b.date));
  scenario.essays.dayOffsets.forEach((offset,index)=>{
    const session=eligible[index];if(!session)return;
    const date=addLocalDays(today,offset),score=scenario.essays.scores[index];
    session.date=date;session.startedAt=`${date}T09:00:00.000Z`;session.endedAt=new Date(Date.parse(session.startedAt)+session.durationSeconds*1000).toISOString();
    session.createdAt=session.startedAt;session.subjectId=subject.id;session.topicId=subject.topics[index%subject.topics.length].id;
    session.notes=`Redação demonstrativa ${index+1}: avaliação ${score}/100. Registro de estudo fictício; a nota não entra no cálculo de questões objetivas.`;
  });
}

export function buildDemoReviews(scenario,{today,subjects}){
  const topics=subjects.flatMap(subject=>subject.topics.map(topic=>({subject,topic}))),states=scenario.reviews.states;
  const groups=[['completed',scenario.targets.reviews-Object.values(states).reduce((sum,value)=>sum+value,0)],['emDia',states.emDia],['proximas',states.proximas],['atrasadas',states.atrasadas],['criticas',states.criticas]];
  let number=0;
  return groups.flatMap(([group,count])=>Array.from({length:count},(_,index)=>{
    const entry=topics[(number*29+7)%topics.length],id=`demo-review-${++number}`;
    const offset=group==='completed'?-55-index*3:group==='emDia'?8+index:group==='proximas'?index+1:group==='atrasadas'?-index-1:-14-index*4;
    const date=addLocalDays(today,offset),completed=group==='completed';
    return {id,date,subjectId:entry.subject.id,topicId:entry.topic.id,topicRef:entry.topic.id,topic:entry.topic.name,tipo:['Revisão 24h','Revisão 7 dias','Revisão 30 dias'][number%3],difficulty:entry.topic.difficulty,status:completed?'Concluído':'Não iniciado',completedAt:completed?stamp(date):null,manualDate:false,adaptive:true,adaptiveReason:'Intervalo ajustado pelo histórico demonstrativo.',suggestedDate:date,baseIntervalDays:[1,7,30][number%3],createdAt:stamp(addLocalDays(date,-7))};
  }));
}
