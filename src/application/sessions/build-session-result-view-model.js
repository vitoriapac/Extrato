export function buildSessionResultViewModel(session,nextPriority,priorityChanged,{subjectName,topicName,formatMinutes}={}){
  const typeLabels={study:'Estudo teórico',review:'Revisão',questions:'Questões',simulation:'Simulado'};
  const subject=session.subjectId?subjectName(session.subjectId):'Sem disciplina';
  const topic=session.topicId?topicName(session.topicId):null;
  const questions=session.questionsResolved>0?{resolved:session.questionsResolved,correct:session.correctAnswers,accuracy:Math.round(session.correctAnswers/session.questionsResolved*100)}:null;
  return {type:typeLabels[session.type]||'Sessão',subject,topic,duration:formatMinutes(Math.round(session.durationSeconds/60)),questions,
    next:nextPriority?{label:`${nextPriority.subjectName} — ${nextPriority.topicName} · ${formatMinutes(nextPriority.estimatedMinutes)}`,changed:Boolean(priorityChanged)}:null,
    simulation:session.type==='simulation'};
}
