export function buildReplanProposal({plans=[],periodStart,periodEnd,futureDays=[]}={}){
  const inPeriod=plans.filter(plan=>plan.date>=periodStart&&plan.date<=periodEnd);
  const plannedMinutes=inPeriod.reduce((sum,plan)=>sum+(plan.items||[]).filter(item=>!['skipped','replaced'].includes(item.status)).reduce((n,item)=>n+(Number(item.plannedMinutes)||0),0),0);
  const executedMinutes=Math.round(inPeriod.reduce((sum,plan)=>sum+(plan.items||[]).reduce((n,item)=>n+(Number(item.executedSeconds)||0)/60,0),0));
  const deficitMinutes=Math.max(0,plannedMinutes-executedMinutes);
  let remaining=deficitMinutes;
  const allocations=futureDays.map(day=>{const available=Math.max(0,Math.round(Number(day.availableMinutes)||0)),minutes=Math.min(available,remaining);remaining-=minutes;return {date:day.date,minutes}}).filter(item=>item.minutes>0);
  const redistributedMinutes=allocations.reduce((sum,item)=>sum+item.minutes,0);
  return {state:deficitMinutes?'proposal':'balanced',periodStart,periodEnd,plannedMinutes,executedMinutes,deficitMinutes,redistributedMinutes,discardedMinutes:Math.max(0,deficitMinutes-redistributedMinutes),allocations,reasons:deficitMinutes?['execução abaixo do planejado no período']:[]};
}
