const clamp=(value,min=0,max=Infinity)=>Math.max(min,Math.min(max,Number(value)||0));

export function createGoalService({repository,getDayOfWeek}={}){
  if(!repository||typeof repository.getGoals!=='function')throw new TypeError('Serviço de metas requer repositório.');
  return Object.freeze({
    hoursForDay:day=>clamp(repository.getGoals()?.horasPorDia?.[String(day)]??repository.getGoals()?.horasDiarias),
    hoursForDate:date=>clamp(repository.getGoals()?.horasPorDia?.[String(getDayOfWeek(date))]??repository.getGoals()?.horasDiarias),
    updateDailyHours:(day,value,{isToday=false}={})=>{const hours=clamp(value);repository.updateDailyHours(day,hours);if(isToday)repository.updateGoal('horasDiarias',hours);return hours},
    applyHoursToEveryDay:value=>{const hours=clamp(value);for(let day=0;day<7;day++)repository.updateDailyHours(day,hours);repository.updateGoal('horasDiarias',hours);return hours},
    clearWeekend:()=>{repository.updateDailyHours(0,0);repository.updateDailyHours(6,0)},
    update:(key,value)=>repository.updateGoal(key,key==='metaAprovacao'?clamp(value,0,100):clamp(value))
  });
}
