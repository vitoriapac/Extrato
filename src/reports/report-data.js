const sum=(items,selector)=>items.reduce((total,item)=>total+(Number(selector(item))||0),0);

export function buildStrategicReport({state,generatedAt,isDemo=false,readiness=null,diagnosis=null,forecast=null}={}){
  const subjects=(state.subjects||[]).filter(item=>!item.archived),topics=subjects.flatMap(subject=>(subject.topics||[]).filter(item=>!item.archived));
  const sessions=state.studySessions||[],questions=state.questoes||[],simulations=state.simulados||[],reviews=state.reviewAgenda||[];
  const resolved=sum(questions,item=>item.resolved),correct=sum(questions,item=>item.correct),studySeconds=sum(sessions,item=>item.durationSeconds);
  const simulationTotal=sum(simulations,item=>item.total),simulationCorrect=sum(simulations,item=>item.correct);
  const activePlan=[...(state.studyPlans||[])].reverse().find(item=>!item.undoneAt)||null;
  const adjustments=state.planAdjustments||[],feedback=state.recommendationFeedback||[];
  return {
    title:isDemo?'Relatório estratégico de demonstração':'Relatório estratégico',isDemo,generatedAt,
    overview:{subjects:subjects.length,topics:topics.length,completedTopics:topics.filter(item=>item.status==='Concluído').length,studySeconds,resolved,accuracy:resolved?Math.round(correct/resolved*100):null,simulations:simulations.length,simulationAverage:simulationTotal?Math.round(simulationCorrect/simulationTotal*100):null,pendingReviews:reviews.filter(item=>item.status!=='Concluído').length},
    readiness,forecast,activePlan,
    execution:{dailyPlans:(state.dailyPlans||[]).length,replans:adjustments.filter(item=>item.status==='applied').length,undoneReplans:adjustments.filter(item=>item.status==='undone').length},
    risks:(diagnosis?.bottlenecks||[]).slice(0,5),opportunities:(diagnosis?.opportunities||[]).slice(0,5),
    recommendations:{decisions:feedback.length,accepted:feedback.filter(item=>item.accepted).length,completed:feedback.filter(item=>item.completed).length,useful:feedback.filter(item=>item.useful===true).length},
    errors:Object.entries(questions.reduce((totals,item)=>{Object.entries(item.errorBreakdown||{}).forEach(([key,value])=>totals[key]=(totals[key]||0)+(Number(value)||0));return totals},{})).sort((a,b)=>b[1]-a[1])
  };
}
