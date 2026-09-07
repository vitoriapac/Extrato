export const TREND_ALGORITHM_VERSION=2;
const clamp=value=>Math.max(0,Math.min(100,value));
const round=value=>Math.round(value*10)/10;
const pool=data=>data.reduce((acc,week)=>({resolved:acc.resolved+(Number(week.resolved)||0),correct:acc.correct+(Number(week.correct)||0)}),{resolved:0,correct:0});
const accuracy=data=>data.resolved?round(data.correct/data.resolved*100):null;
function classification(delta){
  if(delta>=12)return {state:'strong_up',key:'up',direction:'up',icon:'↗',label:'Forte evolução'};
  if(delta>=3)return {state:'up',key:'up',direction:'up',icon:'↗',label:'Em evolução'};
  if(delta<=-12)return {state:'strong_down',key:'down',direction:'down',icon:'↘',label:'Forte queda'};
  if(delta<=-3)return {state:'down',key:'down',direction:'down',icon:'↘',label:'Em queda'};
  return {state:'stable',key:'stable',direction:'stable',icon:'→',label:'Estável'};
}
export function calculateWindowTrend(weeklyData=[],minWindow=30,windowWeeks=4){
  const weeks=Array.isArray(weeklyData)?weeklyData:[],recent=pool(weeks.slice(-windowWeeks)),previous=pool(weeks.slice(-(windowWeeks*2),-windowWeeks)),recentAccuracy=accuracy(recent),previousAccuracy=accuracy(previous),sampleSize=recent.resolved+previous.resolved,confidence=round(Math.min(1,Math.min(recent.resolved,previous.resolved)/minWindow));
  const evidence={sampleSize,windowWeeks,confidence,minimumPerPeriod:minWindow,sources:['questions']},periods={previous,recent,windowWeeks};
  if(recent.resolved<minWindow||previous.resolved<minWindow)return {value:null,state:'insufficient',key:'insufficient',direction:'none',icon:'—',label:'Amostra insuficiente',delta:null,recent,previous,recentAccuracy,previousAccuracy,periods,evidence,confidence,factors:{recentAccuracy,previousAccuracy},reasons:['Cada período precisa atingir a amostra mínima'],algorithmVersion:TREND_ALGORITHM_VERSION};
  const delta=round(recentAccuracy-previousAccuracy),kind=classification(delta);
  return {...kind,value:round(clamp(50+delta*2)),delta,recent,previous,recentAccuracy,previousAccuracy,periods,evidence,confidence,factors:{recentAccuracy,previousAccuracy},reasons:[kind.label],algorithmVersion:TREND_ALGORITHM_VERSION};
}
export function aggregateTrendScores(trends=[]){
  const usable=(Array.isArray(trends)?trends:[]).filter(item=>item&&item.state!=='insufficient'&&Number.isFinite(Number(item.delta)));
  if(!usable.length)return {value:null,state:'insufficient',key:'insufficient',direction:'none',delta:null,evidence:{sampleSize:0,confidence:0,sources:[]},confidence:0,factors:[],reasons:['Nenhum tópico possui tendência suficiente'],algorithmVersion:TREND_ALGORITHM_VERSION};
  const weighted=usable.map(item=>({item,weight:Math.max(1,Number(item.evidence?.sampleSize)||1)})),weight=weighted.reduce((sum,row)=>sum+row.weight,0),delta=round(weighted.reduce((sum,row)=>sum+row.item.delta*row.weight,0)/weight),kind=classification(delta),confidence=round(weighted.reduce((sum,row)=>sum+(Number(row.item.confidence)||0)*row.weight,0)/weight);
  return {...kind,value:round(clamp(50+delta*2)),delta,evidence:{sampleSize:weight,confidence,sources:['topic_trends']},confidence,factors:usable.map(item=>({state:item.state,delta:item.delta,confidence:item.confidence})),reasons:[kind.label],algorithmVersion:TREND_ALGORITHM_VERSION};
}
