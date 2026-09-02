export function createPlanningRepository({getState}={}){
  if(typeof getState!=='function')throw new TypeError('Repositório de planejamento requer acesso ao estado.');
  const state=()=>getState(),plans=()=>state().studyPlans||[],daily=()=>state().dailyPlans||[],adjustments=()=>state().planAdjustments||[];
  const save=list=>item=>{const current=list().find(entry=>entry.id===item.id);if(current){Object.assign(current,item);return current}list().push(item);return item};
  return Object.freeze({getStudyPlans:()=>plans(),getActiveStudyPlan:()=>[...plans()].sort((a,b)=>String(b.confirmedAt||'').localeCompare(String(a.confirmedAt||'')))[0]||null,saveStudyPlan:save(plans),getDailyPlans:()=>daily(),getDailyPlan:date=>daily().find(plan=>plan.date===date)||null,saveDailyPlan:save(daily),getAdjustments:()=>adjustments(),findAdjustment:id=>adjustments().find(item=>item.id===id)||null,saveAdjustment:save(adjustments)});
}
