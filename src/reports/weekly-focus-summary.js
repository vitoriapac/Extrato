import {addLocalDays} from '../core/date-utils.js';
import {buildWeeklyStrategicFocus} from '../application/analytics/build-weekly-strategic-focus.js';

export function buildReportWeeklyFocus({state={},sessions=[],candidates=[],end}={}){
  const start=addLocalDays(end,-6);
  const weeklySessions=sessions.filter(item=>item.date>=start&&item.date<=end);
  const focus=buildWeeklyStrategicFocus({sessions:weeklySessions,candidates,recommendations:state.recommendationFeedback||[],start,end});
  const plannedMinutes=(state.dailyPlans||[]).filter(item=>item.date>=start&&item.date<=end)
    .flatMap(item=>item.items||[]).reduce((sum,item)=>sum+Math.max(0,Number(item.plannedMinutes)||0),0);
  const executedMinutes=focus.totalMinutes;
  return {period:{start,end},plannedMinutes,executedMinutes,executionRate:plannedMinutes?Math.round(executedMinutes/plannedMinutes*100):null,focus};
}
