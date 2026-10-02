import {buildDailyExecutionModel} from '../daily-execution/build-daily-execution-model.js';

export function buildTodayViewModel({date,availableMinutes=0,plan=null,priorities=[],pastPlans=[],sessions,subjects,activeExamTags=[],nextBestAction=null,activePlan=null}={}){
  const minutes=value=>Math.max(0,Math.round(Number(value)||0));
  const items=plan?.items||[];
  const plannedMinutes=items.filter(item=>!['skipped','replaced','deferred'].includes(item.status)).reduce((sum,item)=>sum+minutes(item.plannedMinutes),0);
  const executedMinutes=Math.round(items.reduce((sum,item)=>sum+Math.max(0,Number(item.executedSeconds)||0)/60,0));
  const recoveryMinutes=pastPlans.filter(row=>row.date<date).flatMap(row=>row.items||[]).filter(item=>!['completed','skipped','replaced','deferred'].includes(item.status)).reduce((sum,item)=>sum+Math.max(0,minutes(item.plannedMinutes)-Math.round((Number(item.executedSeconds)||0)/60)),0);
  const execution=Array.isArray(sessions)&&Array.isArray(subjects)?buildDailyExecutionModel({today:date,availableMinutes,dailyPlans:plan?[plan]:[],sessions,subjects,activeExamTags,nextBestAction,activePlan}):null;
  if(execution&&execution.state!=='invalid_date')return {date,availableMinutes:minutes(availableMinutes),plannedMinutes:execution.progress.plannedMinutes,
    executedMinutes:Math.round(execution.progress.studiedMinutes),recoveryMinutes,progress:execution.progress.progress,
    nextActivity:execution.priority.nextItem||execution.priority.unplannedAction||null,execution};
  return {date,availableMinutes:minutes(availableMinutes),plannedMinutes,executedMinutes,recoveryMinutes,progress:plannedMinutes?Math.min(100,Math.round(executedMinutes/plannedMinutes*100)):null,
    nextActivity:items.find(item=>!['completed','skipped','replaced','deferred'].includes(item.status))||priorities[0]||null};
}
