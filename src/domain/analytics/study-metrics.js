export function summarizeStudyRecords({sessions=[],questions=[],simulations=[]}){
  const seconds=sessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0);
  const sessionQuestions=sessions.reduce((sum,item)=>sum+(Number(item.questionsResolved)||0),0);
  const sessionCorrect=sessions.reduce((sum,item)=>sum+(Number(item.correctAnswers)||0),0);
  const resolved=sessionQuestions+questions.reduce((sum,item)=>sum+(Number(item.resolved)||0),0);
  const correct=sessionCorrect+questions.reduce((sum,item)=>sum+(Number(item.correct)||0),0);
  return {seconds,questions:resolved,correct,accuracy:resolved?Math.round(correct/resolved*100):null,simulations:simulations.length};
}
