import {describeScoreEvidence} from '../analytics/score-evidence.js';

export const RECOMMENDATION_OUTCOME_VERSION=1;
const METRICS=['mastery','retention','reviewHealth','accuracy','risk'];
const numeric=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Math.max(0,Math.min(100,Number(value)));
const round=value=>Math.round(value*10)/10;

export function normalizeRecommendationMetrics(value={}){
  return Object.fromEntries(METRICS.map(key=>[key,numeric(value?.[key])]));
}

export function evaluateRecommendationOutcome({before={},after={},questionVolume=0,daysElapsed=0,otherActivities=0,measuredAt=null}={}){
  const normalizedBefore=normalizeRecommendationMetrics(before),normalizedAfter=normalizeRecommendationMetrics(after);
  const delta=Object.fromEntries(METRICS.map(key=>{
    const start=normalizedBefore[key],end=normalizedAfter[key];
    return [key,start==null||end==null?null:round((key==='risk'?start-end:end-start))];
  }));
  const comparable=Object.values(delta).filter(value=>value!==null);
  const volume=Math.max(0,Math.floor(Number(questionVolume)||0)),elapsed=Math.max(0,Number(daysElapsed)||0),activities=Math.max(0,Math.floor(Number(otherActivities)||0));
  const reasons=[];
  if(elapsed<1)reasons.push('Aguardando ao menos 1 dia após a recomendação');
  if(volume<20)reasons.push(`Aguardando ${20-volume} questão(ões) adicional(is)`);
  if(comparable.length<2)reasons.push('Menos de 2 indicadores comparáveis');
  if(activities>3)reasons.push('Muitas outras atividades no tópico para atribuir o resultado');
  const state=elapsed<1?'pending':reasons.length?'insufficient':round(comparable.reduce((sum,value)=>sum+value,0)/comparable.length)>=3?'positive':round(comparable.reduce((sum,value)=>sum+value,0)/comparable.length)<=-3?'negative':'neutral';
  const confidence=Math.min(1,volume/50*.55+Math.min(1,elapsed/7)*.2+comparable.length/METRICS.length*.25);
  const evidence=describeScoreEvidence({completeness:comparable.length/METRICS.length,evidenceStrength:confidence});
  return {state,outcome:state,before:normalizedBefore,after:normalizedAfter,delta,averageDelta:comparable.length?round(comparable.reduce((sum,value)=>sum+value,0)/comparable.length):null,
    questionVolume:volume,daysElapsed:round(elapsed),otherActivities:activities,attributionEligible:['positive','negative','neutral'].includes(state),confidence:round(confidence),
    evidence,reasons,measuredAt,algorithmVersion:RECOMMENDATION_OUTCOME_VERSION};
}

