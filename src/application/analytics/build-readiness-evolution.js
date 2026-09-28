import {READINESS_WEIGHTS} from '../../domain/analytics/readiness-score.js';
import {readinessHistoryForScope} from './readiness-history.js';

const labels={coverage:'Cobertura',mastery:'Domínio',retention:'Retenção',consistency:'Consistência',simulations:'Simulados'};
const finite=value=>value!==null&&value!==undefined&&Number.isFinite(Number(value));
const weightsFor=item=>{
  const weights=item?.weights||(item?.algorithmVersion===1?READINESS_WEIGHTS:null);
  if(!weights||typeof weights!=='object'||Array.isArray(weights)||!Object.keys(weights).length||Object.values(weights).some(value=>!finite(value)||Number(value)<=0))return null;
  return Object.fromEntries(Object.entries(weights).map(([key,value])=>[key,Number(value)]));
};
const availableKeys=item=>Object.keys(weightsFor(item)||{}).filter(key=>finite(item?.factors?.[key])).sort();

export function compareReadinessSnapshots(previous,current){
  if(!previous||!current||!finite(previous.score)||!finite(current.score))return {state:'insufficient',delta:null,factors:[],reason:'Ainda não há dois valores disponíveis para comparar.'};
  if(previous.algorithmVersion==null||current.algorithmVersion==null||previous.algorithmVersion!==current.algorithmVersion)return {state:'algorithm-change',delta:null,factors:[],reason:'Versões diferentes do algoritmo. Os valores históricos foram preservados, mas não são comparados diretamente.'};
  const previousWeights=weightsFor(previous),weights=weightsFor(current);
  if(!previousWeights||!weights||Object.keys({...previousWeights,...weights}).some(key=>previousWeights[key]!==weights[key]))return {state:'weights-change',delta:null,factors:[],reason:'Os pesos do cálculo mudaram; a comparação direta não está disponível.'};
  const keys=availableKeys(current),beforeKeys=availableKeys(previous);
  if(JSON.stringify(keys)!==JSON.stringify(beforeKeys)||!keys.length)return {state:'evidence-change',delta:null,factors:[],reason:'A disponibilidade dos fatores mudou. Uma alteração na base de evidências não é tratada como melhora ou queda.'};
  const total=keys.reduce((sum,key)=>sum+weights[key],0);
  const factors=keys.map(key=>({key,label:labels[key]||key,before:Number(previous.factors[key]),after:Number(current.factors[key]),delta:Number(current.factors[key])-Number(previous.factors[key]),contribution:(Number(current.factors[key])-Number(previous.factors[key]))*weights[key]/total})).sort((a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution));
  const delta=Number(current.score)-Number(previous.score);
  return {state:'comparable',delta,factors,rises:factors.filter(item=>item.contribution>0).slice(0,3),falls:factors.filter(item=>item.contribution<0).slice(0,3),trend:delta>0?'Em alta':delta<0?'Em queda':'Estável',reason:'Contribuições ponderadas, em pontos do índice; pequenas diferenças na soma decorrem do arredondamento.'};
}

export function buildReadinessEvolution({snapshots=[],activeExamTags=[],current=null,today=null}={}){
  const history=readinessHistoryForScope(snapshots,activeExamTags,null,today).filter(item=>finite(item.score));
  const live=current&&finite(current.value)?{date:today,score:current.value,factors:current.factors,algorithmVersion:current.algorithmVersion,weights:READINESS_WEIGHTS,confidenceLabel:current.confidenceLabel}:null;
  const latest=history.at(-1)||null;
  const weekly=history.filter(item=>!item.captureKind||item.captureKind==='weekly-close');
  const latestWeekly=weekly.at(-1)||null,previousWeekly=weekly.at(-2)||null;
  const reference=live||latest;
  const comparableHistory=history.filter(item=>reference&&compareReadinessSnapshots(item,reference).state==='comparable');
  const best=comparableHistory.reduce((result,item)=>!result||item.score>result.score?item:result,null);
  return {
    state:history.length?'available':'empty',history,latest,current:live,best,
    weeklyComparison:compareReadinessSnapshots(previousWeekly,latestWeekly),
    weeklyPeriod:previousWeekly&&latestWeekly?{start:previousWeekly.date,end:latestWeekly.date}:null,
    currentComparison:compareReadinessSnapshots(latest,live),
    versionChanges:history.filter((item,index)=>index>0&&item.algorithmVersion!==history[index-1].algorithmVersion).length
  };
}
