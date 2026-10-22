export function buildSessionResultViewModel(session,nextPriority,priorityChanged,{subjectName,topicName,formatMinutes,day=null,planNext=null}={}){
  const typeLabels={study:'Estudo teórico',review:'Revisão',questions:'Questões',simulation:'Simulado'};
  const subject=session.subjectId?subjectName(session.subjectId):'Sem disciplina';
  const topic=session.topicId?topicName(session.topicId):null;
  const questions=session.questionsResolved>0?{resolved:session.questionsResolved,correct:session.correctAnswers,accuracy:Math.round(session.correctAnswers/session.questionsResolved*100)}:null;
  const minutes=Math.round(session.durationSeconds/60);
  // Today's statement moves only when the day progress before and after the save is known.
  // A session too short to credit a whole minute posts what was actually done instead of "+0min".
  const changed=(before,after)=>before===after?null:{before,after};
  const seconds=`${Math.max(0,Math.round(Number(session.durationSeconds)||0))} s`,duration=minutes>0?formatMinutes(minutes):seconds;
  const credit=minutes>0?`+${duration}`:questions?`+${questions.resolved} ${questions.resolved===1?'questão':'questões'}`:`+${seconds}`;
  const ledger=day?.before&&day?.after?{
    credit,
    detail:minutes===0&&questions?`${questions.accuracy}% de acerto`:null,
    studied:changed(formatMinutes(Math.round(day.before.studiedMinutes)),formatMinutes(Math.round(day.after.studiedMinutes))),
    plan:day.after.progress==null?null:changed(`${day.before.progress??0}%`,`${day.after.progress}%`),
    completed:day.after.completedActivities>day.before.completedActivities?{done:day.after.completedActivities,total:day.total}:null
  }:null;
  return {type:typeLabels[session.type]||'Sessão',subject,topic,questions,ledger,duration,
    // A pending plan item is the next step; the engine's pick is only a suggestion when it points elsewhere.
    plan:planNext?{label:`${planNext.subjectName||'Disciplina'} — ${planNext.topicName||'Sem tópico'} · ${formatMinutes(Math.ceil(planNext.remainingSeconds/60))}`,
      suggestion:nextPriority&&!(nextPriority.subjectId===planNext.subjectId&&nextPriority.topicId===planNext.topicId)?`${nextPriority.subjectName} — ${nextPriority.topicName}`:null}:null,
    next:!planNext&&nextPriority?{label:`${nextPriority.subjectName} — ${nextPriority.topicName} · ${formatMinutes(nextPriority.estimatedMinutes)}`,changed:Boolean(priorityChanged)}:null,
    simulation:session.type==='simulation'};
}
