export function calculateWindowTrend(weeklyData,minWindow=30){
  const pool=data=>data.reduce((acc,week)=>({resolved:acc.resolved+(Number(week.resolved)||0),correct:acc.correct+(Number(week.correct)||0)}),{resolved:0,correct:0});
  const accuracy=data=>data.resolved?Math.round(data.correct/data.resolved*1000)/10:null;
  const recent=pool(weeklyData.slice(-3)),previous=pool(weeklyData.slice(-6,-3));
  if(recent.resolved<minWindow||previous.resolved<minWindow)return {key:'insufficient',icon:'—',label:'Amostra insuficiente',delta:null,recent,previous};
  const delta=accuracy(recent)-accuracy(previous);
  if(delta>=3)return {key:'up',icon:'↗',label:'Em evolução',delta,recent,previous};
  if(delta<=-3)return {key:'down',icon:'↘',label:'Em queda',delta,recent,previous};
  return {key:'stable',icon:'→',label:'Estável',delta,recent,previous};
}
