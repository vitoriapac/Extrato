export function calculateWindowTrend(weeklyData,minWindow=30,windowWeeks=4){
  const pool=data=>data.reduce((acc,week)=>({resolved:acc.resolved+(Number(week.resolved)||0),correct:acc.correct+(Number(week.correct)||0)}),{resolved:0,correct:0});
  const accuracy=data=>data.resolved?Math.round(data.correct/data.resolved*1000)/10:null;
  const recent=pool(weeklyData.slice(-windowWeeks)),previous=pool(weeklyData.slice(-(windowWeeks*2),-windowWeeks));
  const recentAccuracy=accuracy(recent),previousAccuracy=accuracy(previous);
  const evidence={sampleSize:recent.resolved+previous.resolved,windowWeeks,confidence:Math.min(1,Math.min(recent.resolved,previous.resolved)/(minWindow*2))};
  if(recent.resolved<minWindow||previous.resolved<minWindow)return {key:'insufficient',icon:'—',label:'Amostra insuficiente',delta:null,recent,previous,recentAccuracy,previousAccuracy,evidence};
  const delta=Math.round((recentAccuracy-previousAccuracy)*10)/10;
  if(delta>=3)return {key:'up',icon:'↗',label:'Em evolução',delta,recent,previous,recentAccuracy,previousAccuracy,evidence};
  if(delta<=-3)return {key:'down',icon:'↘',label:'Em queda',delta,recent,previous,recentAccuracy,previousAccuracy,evidence};
  return {key:'stable',icon:'→',label:'Estável',delta,recent,previous,recentAccuracy,previousAccuracy,evidence};
}
