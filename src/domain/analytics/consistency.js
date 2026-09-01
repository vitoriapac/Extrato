export function calculateActivityStreak(activityDates,{today,addDays}){
  let cursor=today;
  if(!activityDates.has(cursor)){
    cursor=addDays(cursor,-1);
    if(!activityDates.has(cursor))return 0;
  }
  let count=0;
  while(activityDates.has(cursor)){count++;cursor=addDays(cursor,-1)}
  return count;
}

export function calculateGoalConsistency(days=[]){
  const applicable=days.filter(day=>Number(day.targetSeconds)>0);
  const achieved=applicable.filter(day=>Number(day.studiedSeconds)>=Number(day.targetSeconds)).length;
  const studiedDays=days.filter(day=>Number(day.studiedSeconds)>0).length;
  return {value:applicable.length?achieved/applicable.length*100:null,achieved,applicable:applicable.length,studiedDays,available:applicable.length>0&&studiedDays>0};
}
