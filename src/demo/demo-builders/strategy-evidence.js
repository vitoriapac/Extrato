import {buildStudyCandidates} from '../../application/build-study-candidates.js';

export function buildDemoStrategyCandidates(scenario,{today,subjects,sessions,questions,exams,examQuestions,blueprint}={}){
  const strategic=scenario.subjects.flatMap(subject=>subject.topics.filter(topic=>['consolidated','priority_gap'].includes(topic.narrativeRole)).map(topic=>({subjectId:subject.id,topicId:topic.id})));
  const topics=subjects.flatMap(subject=>subject.topics.map(topic=>({...topic,subjectId:subject.id})));
  const priorities=strategic.flatMap(({subjectId,topicId})=>{
    const subject=subjects.find(item=>item.id===subjectId),topic=subject?.topics.find(item=>item.id===topicId);
    const rows=questions.filter(row=>row.topicId===topicId&&row.date<=today).sort((a,b)=>a.date.localeCompare(b.date));
    const resolved=rows.reduce((sum,row)=>sum+row.resolved,0),correct=rows.reduce((sum,row)=>sum+row.correct,0);
    if(!topic||resolved<20)return[];
    const first=rows[0],last=rows.at(-1),firstRate=first.correct/first.resolved*100,lastRate=last.correct/last.resolved*100,delta=Math.round(lastRate-firstRate);
    return [{subjectId,topicId,subjectName:subject.name,topicName:topic.name,tipo:'continuar',estimatedMinutes:30,diasSemEstudar:Math.max(0,Math.round((Date.parse(`${today}T12:00:00Z`)-Date.parse(`${last.date}T12:00:00Z`))/86400000)),diagnosis:{mastery:{score:Math.round(correct/resolved*100),confidence:Math.min(1,resolved/60)},trend:{direction:delta<=-4?'down':delta>=4?'up':'stable',delta},lastActivity:last.date}}];
  });
  return buildStudyCandidates({priorities,topics,sessions,today,blueprint:blueprint?.subjects||[],activeExamTags:blueprint?.activeExamTags||[],exams,examQuestions});
}
