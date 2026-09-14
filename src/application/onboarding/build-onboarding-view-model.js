export function buildOnboardingViewModel({examDate=null,hoursByDay={},subjects=[],sessions=[],questions=[],dailyPlans=[]}={}){
  const hasGoal=Boolean(examDate),availableMinutes=Object.values(hoursByDay||{}).reduce((sum,hours)=>sum+Math.max(0,Number(hours)||0)*60,0),hasAvailability=availableMinutes>0,hasContent=(subjects||[]).some(subject=>!subject.archived&&(subject.topics||[]).some(topic=>!topic.archived)),hasPlan=(dailyPlans||[]).some(plan=>(plan.items||[]).length>0),hasHistory=(sessions||[]).length>0||(questions||[]).length>0;
  const steps=[{id:'goal',label:'Objetivo e data',complete:hasGoal},{id:'availability',label:'Disponibilidade',complete:hasAvailability},{id:'content',label:'Edital ou matérias',complete:hasContent},{id:'plan',label:'Prévia e Hoje',complete:hasPlan||hasHistory}],next=steps.find(step=>!step.complete)||null;
  return{visible:!hasHistory&&!hasPlan,steps,next,completed:steps.filter(step=>step.complete).length,availableMinutes};
}
