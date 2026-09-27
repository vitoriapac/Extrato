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

function narrativeQuestionSlots(questionSlots,entries,totalQuestions){
  const strategic=entries.filter(entry=>entry.source?.narrativeRole),assigned=new Map(),used=new Set();
  for(const [roleIndex,entry] of strategic.entries()){
    const count=entry.source.narrativeRole==='insufficient_evidence'?1:3;
    for(let part=0;part<count;part++){
      const target=Math.floor((part+1)*questionSlots.length/(count+1))+roleIndex;
      let position=target%questionSlots.length;
      while(used.has(position))position=(position+1)%questionSlots.length;
      used.add(position);
      assigned.set(questionSlots[position],{entry,part,count});
    }
  }
  const reserved=strategic.reduce((sum,entry)=>sum+entry.source.targetQuestionVolume,0);
  if(reserved>totalQuestions)throw new RangeError('Volumes narrativos excedem as questões da demonstração.');
  const genericCount=questionSlots.length-assigned.size,genericTotal=totalQuestions-reserved;
  if(!genericCount||genericTotal<genericCount)throw new RangeError('Questões insuficientes para as sessões genéricas.');
  const genericBase=Math.floor(genericTotal/genericCount),genericExtra=genericTotal%genericCount;
  let genericIndex=0;
  return new Map(questionSlots.map(index=>{
    const selected=assigned.get(index);
    if(selected){const volume=selected.entry.source.targetQuestionVolume;return[index,{entry:selected.entry,resolved:Math.floor(volume/selected.count)+(selected.part<volume%selected.count?1:0)}]}
    const resolved=genericBase+(genericIndex++<genericExtra?1:0);
    return[index,{entry:null,resolved}];
  }));
}

function narrativeAccuracy(source,day,historyDays){
  const target=source.targetMastery,progress=day/historyDays;
  if(source.narrativeRole==='improving')return clamp(target-16+16*progress,0,100);
  if(source.narrativeRole==='declining')return clamp(target+13-13*progress,0,100);
  if(source.narrativeRole==='priority_gap')return clamp(target+5-5*progress,0,100);
  return target;
}

export function buildDemoStudyHistory(scenario,{today,subjects,random}){
  const {historyDays}=scenario.meta,slots=phaseSlots(scenario),sourceTopics=new Map(scenario.subjects.flatMap(subject=>subject.topics.map(topic=>[topic.id,topic]))),entries=subjects.flatMap(subject=>subject.topics.map(topic=>({subject,topic,source:sourceTopics.get(topic.id)})));
  const types=scenario.sessions.types,durations=scenario.sessions.durationsMinutes,questionSlots=slots.map((_,index)=>index).filter(index=>types[index%types.length]==='questions');
  const questionAssignments=narrativeQuestionSlots(questionSlots,entries,scenario.targets.studyQuestions),genericEntries=entries.filter(entry=>!entry.source?.narrativeRole),narrativeEntries=entries.filter(entry=>entry.source?.narrativeRole);
  const studySessions=[],questoes=[];
  slots.forEach((day,index)=>{
    const type=types[index%types.length],assignment=questionAssignments.get(index),entry=assignment?.entry||(!assignment&&index%5===0&&narrativeEntries.length?narrativeEntries[(Math.floor(index/5))%narrativeEntries.length]:genericEntries[(index*37)%genericEntries.length]),date=dateAt(today,day,historyDays);
    const durationMinutes=durations[(index+Math.floor(random()*durations.length))%durations.length],startedAt=`${date}T${String(7+index%12).padStart(2,'0')}:00:00.000Z`;
    const session={id:`demo-session-${index+1}`,date,startedAt,endedAt:new Date(Date.parse(startedAt)+durationMinutes*60000).toISOString(),durationSeconds:durationMinutes*60,subjectId:entry.subject.id,topicId:entry.topic.id,planItemId:null,type,questionsResolved:0,correctAnswers:0,notes:index%13===0?'Sessão demonstrativa com observação de progresso.':'',createdAt:startedAt};
    if(type==='questions'){
      const resolved=assignment.resolved;
      const month=Math.min(scenario.questions.monthlyAccuracyPct.length-1,Math.floor((day-1)/30));
      const phaseRate=scenario.questions.monthlyAccuracyPct[month],subjectRate=Number(scenario.subjects.find(item=>item.id===entry.subject.id)?.targetAccuracyPct)||70;
      const rate=entry.source?.narrativeRole?narrativeAccuracy(entry.source,day,historyDays):clamp(phaseRate+(subjectRate-70)*.55+(random()-.5)*10,30,95),correct=Math.round(resolved*rate/100),errors=resolved-correct;
      session.questionsResolved=resolved;session.correctAnswers=correct;
      questoes.push({id:`demo-question-${questoes.length+1}`,date,subjectId:entry.subject.id,topicId:entry.topic.id,resolved,correct,errorBreakdown:allocateErrors(errors,scenario.questions.errorCategories,scenario.questions.profiles?.[entry.subject.name]),studySessionId:session.id,createdAt:startedAt});
    }
    studySessions.push(session);
  });
  return {studySessions,questoes};
}
