import {confidenceLabel,createMetricEvidence} from './evidence.js';
import {describeScoreEvidence} from './score-evidence.js';

const clamp=value=>Math.max(0,Math.min(100,Math.round(Number(value)||0)));

export function calculateTopicMastery({topic={},performance={resolved:0,accuracy:null},trend={key:'insufficient'},reviews=[],recentSessions=[],periodStart=null,periodEnd=null}={}){
  const questionConfidence=Math.min(1,performance.resolved/50);
  const performanceScore=performance.accuracy===null?0:performance.accuracy*questionConfidence+40*(1-questionConfidence);
  let trendScore=50;
  if(trend.key==='up')trendScore=Math.min(100,70+Math.max(0,trend.delta||0)*2);
  else if(trend.key==='down')trendScore=Math.max(0,40-Math.abs(trend.delta||0)*2);
  else if(trend.key==='stable')trendScore=60;
  const completedReviews=reviews.filter(review=>review.status==='Concluído').length;
  const reviewScore=reviews.length?completedReviews/reviews.length*100:(topic.status==='Concluído'?50:20);
  const recentSeconds=recentSessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0);
  const studyScore=Math.min(100,recentSeconds/7200*100);
  const confidence=Math.min(1,questionConfidence*.6+Math.min(1,reviews.length/4)*.2+Math.min(1,recentSessions.length/4)*.2);
  const available=performance.resolved>0||reviews.length>0||recentSeconds>0;
  const score=available?clamp(performanceScore*.4+trendScore*.2+reviewScore*.15+studyScore*.15+confidence*10):0;
  const classification=!available?'Sem dados':score>=80?'Dominado':score>=60?'Em consolidação':score>=40?'Em desenvolvimento':'Inicial';
  const completeness=[performance.resolved>0,trend.key!=='insufficient',reviews.length>0,recentSeconds>0].filter(Boolean).length/4;
  return {score,available,confidence,confidenceLabel:confidenceLabel(confidence),classification,performanceScore,trendScore,reviewScore,studyScore,trend,
    evidence:{...createMetricEvidence({sampleSize:performance.resolved,periodStart,periodEnd,confidence,sources:[performance.resolved?'questions':null,reviews.length?'reviews':null,recentSeconds?'sessions':null]}),...describeScoreEvidence({completeness,evidenceStrength:confidence})}};
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
  if(!available)return {score:0,raw:null,confidence:0,confidenceLabel:'Baixa',available:false,detail:'Sem revisões ou questões vinculadas',evidence};
  const raw=reviewRate*.45+accuracy*.35+recency*.20,score=clamp(50+(raw-50)*(.35+confidence*.65));
  const detail=(due.length?onTime+' de '+due.length+' revisões no prazo':'sem revisões vencidas')+' · '+(resolved?Math.round(accuracy)+'% em '+resolved+' questões recentes':'sem questões recentes')+' · '+(daysSince===null?'sem revisão registrada':daysSince+'d desde a última revisão');
  return {score,raw,confidence,confidenceLabel:confidenceLabel(confidence),available:true,detail,evidence};
}
