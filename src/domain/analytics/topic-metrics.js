import {confidenceLabel,createMetricEvidence} from './evidence.js';
import {describeScoreEvidence} from './score-evidence.js';

const clamp=value=>Math.max(0,Math.min(100,Math.round(Number(value)||0)));
export const MASTERY_ALGORITHM_VERSION=2;
export const MASTERY_BANDS=Object.freeze([
  {min:90,label:'Dominado'},{min:75,label:'Bom'},{min:60,label:'Em desenvolvimento'},
  {min:40,label:'Frágil'},{min:0,label:'Crítico'}
]);

export function classifyTopicMastery(value,bands=MASTERY_BANDS){
  if(value==null)return 'Sem dados';
  return [...bands].sort((a,b)=>b.min-a.min).find(band=>value>=band.min)?.label||'Sem dados';
}

export function calculateTopicMastery({topic={},performance={resolved:0,accuracy:null},trend={key:'insufficient'},reviews=[],recentSessions=[],periodStart=null,periodEnd=null}={}){
  const resolved=Math.max(0,Number(performance.resolved)||0);
  const hasQuestions=resolved>0&&performance.accuracy!=null&&Number.isFinite(Number(performance.accuracy));
  const questionConfidence=Math.min(1,resolved/50);
  const performanceScore=hasQuestions?Number(performance.accuracy)*questionConfidence+40*(1-questionConfidence):null;
  let trendScore=null;
  if(hasQuestions&&trend.key==='up')trendScore=Math.min(100,70+Math.max(0,trend.delta||0)*2);
  else if(hasQuestions&&trend.key==='down')trendScore=Math.max(0,40-Math.abs(trend.delta||0)*2);
  else if(hasQuestions&&trend.key==='stable')trendScore=60;
  const completedReviews=reviews.filter(review=>review.status==='Concluído').length;
  const reviewScore=reviews.length?50+(completedReviews/reviews.length*100-50)*Math.min(1,reviews.length/4):null;
  const recentSeconds=recentSessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0);
  const studyScore=recentSeconds>0?Math.min(100,recentSeconds/7200*100):null;
  const observed=[[performanceScore,.65,'questões'],[trendScore,.15,'tendência'],[reviewScore,.20,'revisões']].filter(([value])=>value!=null);
  const available=observed.length>0;
  const confidence=Math.min(1,questionConfidence*.7+Math.min(1,reviews.length/4)*.2+(available?Math.min(1,recentSessions.length/4)*.1:0));
  const score=available?clamp(observed.reduce((sum,[value,weight])=>sum+value*weight,0)/observed.reduce((sum,[,weight])=>sum+weight,0)):0;
  const completeness=[hasQuestions,trendScore!=null,reviews.length>0,recentSeconds>0].filter(Boolean).length/4;
  const reasons=available?observed.map(([, ,source])=>'Estimativa baseada em '+source):['Sem questões ou revisões para estimar domínio'];
  if(recentSeconds>0&&!available)reasons.push('Tempo estudado é atividade, não medida de domínio');
  return {value:available?score:null,state:!available?'empty':confidence<.35?'insufficient':'estimated',score,available,confidence,confidenceLabel:confidenceLabel(confidence),classification:classifyTopicMastery(available?score:null),performanceScore,trendScore,reviewScore,studyScore,trend,
    factors:{performance:performanceScore,trend:trendScore,reviews:reviewScore,study:studyScore},reasons,algorithmVersion:MASTERY_ALGORITHM_VERSION,
    evidence:{...createMetricEvidence({sampleSize:resolved,periodStart,periodEnd,confidence,sources:[hasQuestions?'questions':null,reviews.length?'reviews':null,recentSeconds?'sessions':null]}),...describeScoreEvidence({completeness,evidenceStrength:confidence})}};
}

// Dates are normalized by the caller to local YYYY-MM-DD values.
export function calculateTopicRetention({due=[],resolved=0,correct=0,lastReview=null,daysSince=null,onTime=0,periodStart=null,periodEnd=null}={}){
  const reviewRate=due.length?onTime/due.length*100:50;
  const accuracy=resolved?correct/resolved*100:50;
  const recency=daysSince===null?50:Math.max(0,100-Math.max(0,daysSince-1)*2.7);
  const confidence=Math.min(1,Math.min(1,due.length/4)*.4+Math.min(1,resolved/50)*.4+(lastReview?1:0)*.2);
  const available=Boolean(due.length||resolved||lastReview);
  const completeness=[due.length>0,resolved>0,Boolean(lastReview)].filter(Boolean).length/3;
  const evidence={...createMetricEvidence({sampleSize:resolved,periodStart,periodEnd,confidence,sources:[due.length?'reviews':null,resolved?'questions':null]}),...describeScoreEvidence({completeness,evidenceStrength:confidence})};
  if(!available)return {value:null,state:'empty',score:0,raw:null,confidence:0,confidenceLabel:'Baixa',available:false,detail:'Sem revisões ou questões vinculadas',evidence,factors:{},reasons:['sem revisões ou questões vinculadas'],algorithmVersion:1};
  const raw=reviewRate*.45+accuracy*.35+recency*.20,score=clamp(50+(raw-50)*(.35+confidence*.65));
  const detail=(due.length?onTime+' de '+due.length+' revisões no prazo':'sem revisões vencidas')+' · '+(resolved?Math.round(accuracy)+'% em '+resolved+' questões recentes':'sem questões recentes')+' · '+(daysSince===null?'sem revisão registrada':daysSince+'d desde a última revisão');
  return {value:score,state:completeness<.5?'insufficient':'estimated',score,raw,confidence,confidenceLabel:confidenceLabel(confidence),available:true,detail,evidence,
    factors:{reviewRate,accuracy,recency},reasons:[detail],algorithmVersion:1};
}
