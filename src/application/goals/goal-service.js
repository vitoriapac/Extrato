const clamp=(value,min=0,max=Infinity)=>Math.max(min,Math.min(max,Number(value)||0));
import {validAdherenceTarget} from '../adherence/adherence-target.js';

export function createGoalService({repository,getDayOfWeek,onCapacityObserved=()=>{}}={}){
  if(!repository||typeof repository.getGoals!=='function')throw new TypeError('Serviço de metas requer repositório.');
  return Object.freeze({
    hoursForDay:day=>clamp(repository.getGoals()?.horasPorDia?.[String(day)]??repository.getGoals()?.horasDiarias,0,24),
    hoursForDate:date=>clamp(repository.getGoals()?.horasPorDia?.[String(getDayOfWeek(date))]??repository.getGoals()?.horasDiarias,0,24),
    updateDailyHours:(day,value,{isToday=false}={})=>{onCapacityObserved('observed');const hours=clamp(value,0,24);repository.updateDailyHours(day,hours);if(isToday)repository.updateGoal('horasDiarias',hours);onCapacityObserved('edited');return hours},
    applyHoursToEveryDay:value=>{onCapacityObserved('observed');const hours=clamp(value,0,24);for(let day=0;day<7;day++)repository.updateDailyHours(day,hours);repository.updateGoal('horasDiarias',hours);onCapacityObserved('edited');return hours},
    clearWeekend:()=>{onCapacityObserved('observed');repository.updateDailyHours(0,0);repository.updateDailyHours(6,0);onCapacityObserved('edited')},
    update:(key,value)=>{
      if(key==='aderenciaSemanal'){
        const target=value===null?null:value===''?NaN:Number(value);
        if(!validAdherenceTarget(target))return false;
        repository.updateGoal(key,target);return true;
      }
      return repository.updateGoal(key,key==='metaAprovacao'?clamp(value,0,100):key==='consistenciaSemanal'?Math.round(clamp(value,1,7)):clamp(value));
    }
  });
}
