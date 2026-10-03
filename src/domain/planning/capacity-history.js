import {parseLocalDate,localDateRange} from '../../core/date-utils.js';

const validHours=hours=>hours&&typeof hours==='object'&&Array.from({length:7},(_,day)=>hours[String(day)]).every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=24);
export function validCapacityRecord(record){
  return record?.version===1&&typeof record.id==='string'&&record.id.length>0&&typeof record.effectiveDate==='string'&&Boolean(parseLocalDate(record.effectiveDate))
    &&typeof record.capturedAt==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(record.capturedAt)&&Number.isFinite(Date.parse(record.capturedAt))&&validHours(record.hoursByDay)
    &&Math.abs(record.totalMinutes-Object.values(record.hoursByDay).reduce((sum,value)=>sum+value*60,0))<1e-6
    &&['observed','edited'].includes(record.source)&&Object.keys(record.hoursByDay).length===7;
}
export function recordPlanningCapacity(history,{hoursByDay,today,capturedAt,id,source='observed'}={}){
  if(!Array.isArray(history)||!validHours(hoursByDay)||!parseLocalDate(today))return false;
  const hours=Object.fromEntries(Array.from({length:7},(_,day)=>[String(day),hoursByDay[String(day)]]));
  const prior=history.filter(record=>validCapacityRecord(record)&&record.effectiveDate<=today)
    .sort((a,b)=>a.effectiveDate.localeCompare(b.effectiveDate)||Date.parse(a.capturedAt)-Date.parse(b.capturedAt)).at(-1);
  if(prior&&JSON.stringify(prior.hoursByDay)===JSON.stringify(hours))return false;
  const record={id,version:1,effectiveDate:today,capturedAt,hoursByDay:hours,totalMinutes:Object.values(hours).reduce((sum,value)=>sum+value*60,0),source};
  if(!validCapacityRecord(record))return false;
  history.push(record);return true;
}
export function capacityForPeriod(history,{start,end}={}){
  const records=(history||[]).filter(validCapacityRecord).map((record,index)=>({...record,index}))
    .sort((a,b)=>a.effectiveDate.localeCompare(b.effectiveDate)||Date.parse(a.capturedAt)-Date.parse(b.capturedAt)||a.index-b.index);
  const days=localDateRange(start,end).map(date=>{
    const record=records.filter(record=>record.effectiveDate<=date).at(-1);
    return {date,availableMinutes:record?record.hoursByDay[String(parseLocalDate(date).getDay())]*60:null,recordId:record?.id||null};
  });
  const complete=days.length>0&&days.every(day=>day.availableMinutes!==null);
  return {state:complete?'recorded':'unknown',availableMinutes:complete?days.reduce((sum,day)=>sum+day.availableMinutes,0):null,
    changedWithinPeriod:new Set(days.map(day=>day.recordId).filter(Boolean)).size>1,days};
}
