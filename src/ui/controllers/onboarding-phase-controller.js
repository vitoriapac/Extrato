// Reuse one phase surface so updates never leave a duplicate or stale copy.
export function syncOnboardingPhase(document,{visible=false}={}){
  const phase=document.getElementById('overviewExamPhase'),entry=document.getElementById('guidedOnboarding'),daily=document.getElementById('dailyExecutionDashboard');
  if(!phase||!entry||!daily)return;
  if(visible)entry.append(phase);
  else daily.before(phase);
}
