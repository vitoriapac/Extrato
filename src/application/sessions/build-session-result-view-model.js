export function buildSessionResultViewModel(session,nextPriority,priorityChanged,{subjectName,topicName,formatMinutes,day=null}={}){
  const typeLabels={study:'Estudo teórico',review:'Revisão',questions:'Questões',simulation:'Simulado'};
  const subject=session.subjectId?subjectName(session.subjectId):'Sem disciplina';
  const topic=session.topicId?topicName(session.topicId):null;
  const questions=session.questionsResolved>0?{resolved:session.questionsResolved,correct:session.correctAnswers,accuracy:Math.round(session.correctAnswers/session.questionsResolved*100)}:null;
  const minutes=Math.round(session.durationSeconds/60);
  // Today's statement moves only when the day progress before and after the save is known.
  const ledger=day?.before&&day?.after?{
    credit:`+${formatMinutes(minutes)}`,
    studied:{before:formatMinutes(Math.round(day.before.studiedMinutes)),after:formatMinutes(Math.round(day.after.studiedMinutes))},
    plan:day.after.progress==null?null:{before:`${day.before.progress??0}%`,after:`${day.after.progress}%`},
    completed:day.after.completedActivities>day.before.completedActivities?{done:day.after.completedActivities,total:day.total}:null
  }:null;
  return {type:typeLabels[session.type]||'Sessão',subject,topic,duration:formatMinutes(minutes),questions,ledger,
    next:nextPriority?{label:`${nextPriority.subjectName} — ${nextPriority.topicName} · ${formatMinutes(nextPriority.estimatedMinutes)}`,changed:Boolean(priorityChanged)}:null,
    simulation:session.type==='simulation'};
}
