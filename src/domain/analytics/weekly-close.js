export const WEEKLY_CLOSE_VERSION='1.0.0';
const n=value=>Number.isFinite(Number(value))?Number(value):0;
const pct=(a,b)=>b>0?Math.round(a/b*100):null;
export function buildWeeklyClose({period,current={},previous={},sessions=[],plans=[],questions=[],recommendations=[]}={}){
 const planned=n(current.plannedMinutes),executed=n(current.executedMinutes),plannedCount=plans.length,completedCount=plans.filter(x=>['completed','done','Concluído'].includes(x.status)).length;
 const resolved=questions.reduce((s,q)=>s+n(q.resolved),0),correct=questions.reduce((s,q)=>s+n(q.correct),0);
 const adherence=planned>0?Math.round(executed/planned*100):null;
 const state=planned||executed||resolved?'available':'insufficient';
 return{algorithmVersion:WEEKLY_CLOSE_VERSION,period,state,investment:{plannedMinutes:planned,executedMinutes:executed,deficitMinutes:Math.max(0,planned-executed),adherence},execution:{plannedItems:plannedCount,completedItems:completedCount,rate:plannedCount?pct(completedCount,plannedCount):null},questions:{resolved,correct,accuracy:resolved?pct(correct,resolved):null},recommendations:{total:recommendations.length,accepted:recommendations.filter(x=>x.accepted||x.status==='accepted').length},comparison:{current,previous},priorities:[],reasons:state==='insufficient'?['Registre sessões, planos ou questões para fechar a semana.']:[]};
}
