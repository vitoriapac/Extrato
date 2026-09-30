import {buildStrategicExecution} from './build-strategic-execution.js';
import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';

const excluded=new Set(['skipped','replaced','discarded','deferred']);
const minutes=value=>Math.max(0,Math.round(Number(value)||0));
const weekStart=date=>{
  const day=parseLocalDate(date)?.getDay();
  return day==null?null:addLocalDays(date,-((day+6)%7));
};
export const plannedMinutesForPlan=plan=>Array.isArray(plan.items)&&plan.items.length
  ?plan.items.filter(item=>!excluded.has(item.status)).reduce((sum,item)=>sum+minutes(item.plannedMinutes),0)
  :minutes(plan.plannedMinutes);

export function buildPlanExecution({today,dailyPlans=[],sessions=[],hoursByDay={},historyWeeks=8,subjects=[]}={}){
  const start=weekStart(today);
  if(!start)return {state:'empty',days:[],history:[]};
  const plansByDate=new Map(),studyByDate=new Map();
  for(const plan of dailyPlans){
    if(!plan.date)continue;
    const row=plansByDate.get(plan.date)||{count:0,minutes:0};
    row.count++;row.minutes+=plannedMinutesForPlan(plan);plansByDate.set(plan.date,row);
  }
  for(const session of sessions){
    if(!session.date)continue;
    studyByDate.set(session.date,(studyByDate.get(session.date)||0)+Math.max(0,Number(session.durationSeconds)||0)/60);
  }
  const days=Array.from({length:7},(_,index)=>{
    const date=addLocalDays(start,index),plan=plansByDate.get(date);
    return {date,plannedMinutes:plan?plan.minutes:null,studiedMinutes:minutes(studyByDate.get(date)),future:date>today};
  });
  const history=Array.from({length:historyWeeks},(_,index)=>{
    const week=addLocalDays(start,-7*(historyWeeks-index)),dates=Array.from({length:7},(_,day)=>addLocalDays(week,day));
    const planned=dates.reduce((sum,date)=>sum+(plansByDate.get(date)?.minutes||0),0);
    const studied=dates.reduce((sum,date)=>sum+minutes(studyByDate.get(date)),0);
    return {start:week,end:addLocalDays(week,6),strategic:buildStrategicExecution({start:week,end:addLocalDays(week,6),today,dailyPlans,sessions,subjects}),plannedMinutes:planned,studiedMinutes:studied,
      adherence:planned?Math.round(studied/planned*100):null};
  });
  const capacityMinutes=Object.values(hoursByDay).reduce((sum,hours)=>sum+Math.max(0,Math.min(24,Number(hours)||0))*60,0);
  const plannedMinutes=days.reduce((sum,day)=>sum+(day.plannedMinutes||0),0);
  const studiedMinutes=days.filter(day=>!day.future).reduce((sum,day)=>sum+day.studiedMinutes,0);
  return {state:plannedMinutes?'ready':'unplanned',days,history,strategic:buildStrategicExecution({start,end:addLocalDays(start,6),today,dailyPlans,sessions,subjects}),capacityMinutes:minutes(capacityMinutes),plannedMinutes,studiedMinutes,
    completedWeeks:history.filter(item=>item.adherence!==null).length};
}
