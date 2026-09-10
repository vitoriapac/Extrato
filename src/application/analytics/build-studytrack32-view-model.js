const sum=(items,selector)=>items.reduce((total,item)=>total+(Number(selector(item))||0),0);
const inRange=(item,start,end)=>Boolean(item?.date&&item.date>=start&&item.date<=end);

export function selectWeeklyPlans(dailyPlans=[],start,end){
  const plans=(Array.isArray(dailyPlans)?dailyPlans:[]).filter(plan=>inRange(plan,start,end));
  const items=plans.flatMap(plan=>(plan.items||[]).map(item=>({...item,date:plan.date})));
  const eligible=items.filter(item=>!['skipped','replaced','discarded'].includes(item.status));
  return {plans:eligible,plannedMinutes:sum(eligible,item=>item.plannedMinutes)};
}

export function buildStudyTrack32ViewModel({today,sessions=[],questions=[],dailyPlans=[],planAdjustments=[],recommendations=[],simulations=[],subjects=[],weeklyCapacityMinutes=0,targetAccuracy=80,algorithmServices={},nameResolvers={}}={}){
  const {addDays,buildWeeklyClose,buildGapMap,buildDecisionHistory,buildPostSimulationReplan,buildCandidates}=algorithmServices;
  const start=addDays(today,-6),previousEnd=addDays(start,-1),previousStart=addDays(start,-7),currentSessions=sessions.filter(item=>inRange(item,start,today)),currentQuestions=questions.filter(item=>inRange(item,start,today)),previousSessions=sessions.filter(item=>inRange(item,previousStart,previousEnd)),previousQuestions=questions.filter(item=>inRange(item,previousStart,previousEnd)),currentPlan=selectWeeklyPlans(dailyPlans,start,today),previousPlan=selectWeeklyPlans(dailyPlans,previousStart,previousEnd);
  const questionTotals=list=>({resolved:sum(list,item=>item.resolved),correct:sum(list,item=>item.correct)}),previousTotals=questionTotals(previousQuestions),hasPrevious=previousSessions.length+previousQuestions.length+previousPlan.plans.length>0,executedMinutes=Math.round(sum(currentSessions,item=>item.durationSeconds)/60),previousExecutedMinutes=Math.round(sum(previousSessions,item=>item.durationSeconds)/60);
  const weeklyClose=buildWeeklyClose({period:{start,end:today},current:{plannedMinutes:currentPlan.plannedMinutes,executedMinutes},previous:hasPrevious?{plannedMinutes:previousPlan.plannedMinutes,executedMinutes:previousExecutedMinutes,resolved:previousTotals.resolved,accuracy:previousTotals.resolved?Math.round(previousTotals.correct/previousTotals.resolved*100):null}:{},plans:currentPlan.plans,sessions:currentSessions,questions:currentQuestions,recommendations,targetAccuracy});
  const candidates=buildCandidates(),gapRows=candidates.map(item=>({topicId:item.topicId,name:item.topicName||nameResolvers.topic(item.topicId)||'Tópico removido',subjectName:item.subjectName||nameResolvers.subject(item.subjectId)||'Disciplina removida',mastery:item.mastery,examImpact:item.examImpact,retention:item.retention,coverage:item.coverage,trendRisk:item.trendRisk??item.risk?.value??null})),gapMap=buildGapMap(gapRows),decisionHistory=buildDecisionHistory(recommendations,{limit:5,resolveSubjectName:nameResolvers.subject,resolveTopicName:nameResolvers.topic});
  const latestSimulation=[...simulations].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0],plannedOpen=sum(dailyPlans.flatMap(plan=>plan.items||[]).filter(item=>!['completed','skipped','replaced','discarded'].includes(item.status)),item=>item.plannedMinutes),availableMinutes=Math.max(0,weeklyCapacityMinutes-plannedOpen),postSimulation=buildPostSimulationReplan({simulation:latestSimulation,subjects,availableMinutes,existingSimulationIds:planAdjustments.map(item=>item.simulationId).filter(Boolean)});
  return {period:{start,end:today,previousStart,previousEnd},weeklyClose,gapMap,decisionHistory,postSimulation:{...postSimulation,availableMinutes}};
}
