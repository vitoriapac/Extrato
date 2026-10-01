import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';
import {plannedMinutesForPlan} from '../goals/build-plan-execution.js';
import {buildStrategicExecution} from '../goals/build-strategic-execution.js';
import {countStudyDaysInRange} from './study-day-count.js';

const inRange=(date,range)=>Boolean(date&&range?.end&&date<=range.end&&(!range.start||date>=range.start));
const weekStart=date=>{
  const weekday=parseLocalDate(date)?.getDay();
  return weekday==null?null:addLocalDays(date,-((weekday+6)%7));
};
const round=value=>Math.round(value*10)/10;

export function buildPerformanceConsistency({range,today,sessions=[],questions=[],dailyPlans=[],subjects=[]}={}){
  const studied=sessions.filter(item=>inRange(item.date,range)),answered=questions.filter(item=>inRange(item.date,range)),plans=dailyPlans.filter(item=>inRange(item.date,range));
  const starts=[...studied,...answered,...plans].map(item=>item.date).filter(Boolean).sort();
  const first=range?.start||starts[0]||today;
  const weeks=new Map();
  const row=date=>{const start=weekStart(date);if(!start)return null;if(!weeks.has(start))weeks.set(start,{start,plannedMinutes:0,studiedMinutes:0,questions:0});return weeks.get(start)};
  for(const item of plans)row(item.date).plannedMinutes+=plannedMinutesForPlan(item);
  for(const item of studied)row(item.date).studiedMinutes+=Math.max(0,Number(item.durationSeconds)||0)/60;
  for(const item of answered)row(item.date).questions+=Math.max(0,Number(item.resolved)||0);
  const weekly=[...weeks.values()].sort((a,b)=>a.start.localeCompare(b.start)).map(item=>{
    const end=addLocalDays(item.start,6),strategic=buildStrategicExecution({start:item.start,end:end>today?today:end,today,dailyPlans:plans,sessions:studied,subjects});
    return {...item,studiedMinutes:round(item.studiedMinutes),adherence:item.plannedMinutes?round(item.studiedMinutes/item.plannedMinutes*100):null,
      strategicAdherence:strategic.strategicAdherence,inProgress:end>=today};
  });
  const studiedMinutes=round(studied.reduce((sum,item)=>sum+Math.max(0,Number(item.durationSeconds)||0)/60,0));
  const plannedMinutes=plans.reduce((sum,item)=>sum+plannedMinutesForPlan(item),0);
  const strategic=buildStrategicExecution({start:first,end:today,today,dailyPlans:plans,sessions:studied,subjects});
  const byDate=new Map();for(const item of studied)byDate.set(item.date,(byDate.get(item.date)||0)+Math.max(0,Number(item.durationSeconds)||0)/60);
  const heatmapStart=first>addLocalDays(today,-89)?first:addLocalDays(today,-89);
  const heatmap=[];
  for(let date=heatmapStart;date&&date<=today;date=addLocalDays(date,1))heatmap.push({date,minutes:round(byDate.get(date)||0)});
  const previous=range?.previous?sessions.filter(item=>inRange(item.date,range.previous)).reduce((sum,item)=>sum+Math.max(0,Number(item.durationSeconds)||0)/60,0):null;
  return {weekly,heatmap,studiedMinutes,plannedMinutes,adherence:plannedMinutes?round(studiedMinutes/plannedMinutes*100):null,
    strategicAdherence:strategic.strategicAdherence,strategicCoverage:strategic.classifiedCoverage,
    activeDays:countStudyDaysInRange(studied,range),questions:answered.reduce((sum,item)=>sum+Math.max(0,Number(item.resolved)||0),0),
    previousMinutes:previous==null?null:round(previous),heatmapLimited:range?.start==null||range.start<heatmapStart};
}
