import {addLocalDays} from '../../core/date-utils.js';

const genericErrors={naoSabia:24,esqueci:17,interpretacao:19,calculo:15,desatencao:17,chute:8};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const dateAt=(today,day,historyDays)=>addLocalDays(today,day-historyDays);

export function allocateErrors(errors,categories,profile){
  const weights=categories.map(key=>Math.max(0,Number(profile?.[key]??genericErrors[key]??0)));
  const total=weights.reduce((sum,value)=>sum+value,0)||1;
  const exact=weights.map(value=>errors*value/total),counts=exact.map(Math.floor);
  let remainder=errors-counts.reduce((sum,value)=>sum+value,0);
  const order=exact.map((value,index)=>({index,fraction:value-counts[index]})).sort((a,b)=>b.fraction-a.fraction||a.index-b.index);
  for(let index=0;index<remainder;index++)counts[order[index%order.length].index]++;
  return Object.fromEntries(categories.map((key,index)=>[key,counts[index]]));
}

function phaseSlots(scenario){
  const phases=scenario.profile.phases;
  const weights=phases.map(phase=>(phase.days[1]-phase.days[0]+1)/7*phase.weeklyHours);
  const total=weights.reduce((sum,value)=>sum+value,0),target=scenario.targets.studySessions;
  const exact=weights.map(value=>target*value/total),counts=exact.map(Math.floor);
  let left=target-counts.reduce((sum,value)=>sum+value,0);
  const order=exact.map((value,index)=>({index,fraction:value-counts[index]})).sort((a,b)=>b.fraction-a.fraction);
  for(let index=0;index<left;index++)counts[order[index].index]++;
  return phases.flatMap((phase,phaseIndex)=>{
    const days=Array.from({length:phase.days[1]-phase.days[0]+1},(_,index)=>phase.days[0]+index).filter(day=>day%7!==0&&day%11!==0);
    return Array.from({length:counts[phaseIndex]},(_,index)=>days[(index*7+Math.floor(index/days.length))%days.length]);
  });
}

export function buildDemoStudyHistory(scenario,{today,subjects,random}){
  const {historyDays}=scenario.meta,slots=phaseSlots(scenario),entries=subjects.flatMap(subject=>subject.topics.map(topic=>({subject,topic})));
  const types=scenario.sessions.types,durations=scenario.sessions.durationsMinutes,questionSlots=slots.map((_,index)=>index).filter(index=>types[index%types.length]==='questions');
  const baseQuestions=Math.floor(scenario.targets.studyQuestions/questionSlots.length),extraQuestions=scenario.targets.studyQuestions%questionSlots.length;
  const questionPosition=new Map(questionSlots.map((index,position)=>[index,position]));
  const studySessions=[],questoes=[];
  slots.forEach((day,index)=>{
    const entry=entries[(index*37)%entries.length],date=dateAt(today,day,historyDays),type=types[index%types.length];
    const durationMinutes=durations[(index+Math.floor(random()*durations.length))%durations.length],startedAt=`${date}T${String(7+index%12).padStart(2,'0')}:00:00.000Z`;
    const session={id:`demo-session-${index+1}`,date,startedAt,endedAt:new Date(Date.parse(startedAt)+durationMinutes*60000).toISOString(),durationSeconds:durationMinutes*60,subjectId:entry.subject.id,topicId:entry.topic.id,planItemId:null,type,questionsResolved:0,correctAnswers:0,notes:index%13===0?'Sessão demonstrativa com observação de progresso.':'',createdAt:startedAt};
    if(type==='questions'){
      const position=questionPosition.get(index),resolved=baseQuestions+(position<extraQuestions?1:0);
      const month=Math.min(scenario.questions.monthlyAccuracyPct.length-1,Math.floor((day-1)/30));
      const phaseRate=scenario.questions.monthlyAccuracyPct[month],subjectRate=Number(scenario.subjects.find(item=>item.id===entry.subject.id)?.targetAccuracyPct)||70;
      const rate=clamp(phaseRate+(subjectRate-70)*.55+(random()-.5)*10,30,95),correct=Math.round(resolved*rate/100),errors=resolved-correct;
      session.questionsResolved=resolved;session.correctAnswers=correct;
      questoes.push({id:`demo-question-${questoes.length+1}`,date,subjectId:entry.subject.id,topicId:entry.topic.id,resolved,correct,errorBreakdown:allocateErrors(errors,scenario.questions.errorCategories,scenario.questions.profiles?.[entry.subject.name]),studySessionId:session.id,createdAt:startedAt});
    }
    studySessions.push(session);
  });
  return {studySessions,questoes};
}
