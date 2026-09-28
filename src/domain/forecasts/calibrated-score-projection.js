import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';
const median=values=>{const ordered=[...values].sort((a,b)=>a-b),middle=Math.floor(ordered.length/2);return ordered.length%2?ordered[middle]:(ordered[middle-1]+ordered[middle])/2};
const clamp=value=>Math.max(0,Math.min(100,Math.round(value)));
const composition=item=>JSON.stringify([...(item.examTags||[])].sort())+'|'+JSON.stringify((item.breakdown||[]).filter(row=>row.subjectId&&Number(row.total)>0).map(row=>[row.subjectId,Number(row.total)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));

export function buildCalibratedScoreProjection({simulations=[],today,target=80}={}){
  const seen=new Set(),cutoff=addLocalDays(today,-89);
  const records=simulations.filter(item=>{if(!parseLocalDate(item.date)||item.date>today||item.date<cutoff||seen.has(item.id)||!(Number(item.total)>0))return false;seen.add(item.id);return Number.isFinite(Number(item.correct))&&Number(item.correct)>=0&&Number(item.correct)<=Number(item.total)}).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
  const latest=records.at(-1),key=latest?composition(latest):null;
  const comparable=[...new Map(records.filter(item=>composition(item)===key).map(item=>[item.date,item])).values()].slice(-12),dates=new Set(comparable.map(item=>item.date)),sampleSize=comparable.reduce((sum,item)=>sum+Number(item.total),0);
  const spanDays=comparable.length?Math.round((Date.parse(comparable.at(-1).date+'T12:00:00Z')-Date.parse(comparable[0].date+'T12:00:00Z'))/86400000):0;
  const detailed=Boolean(latest?.breakdown?.length&&latest.breakdown.every(row=>row.subjectId&&Number(row.total)>0));
  const evidence={observationCount:comparable.length,sampleSize,spanDays,excludedCount:records.length-comparable.length,compositionKnown:detailed};
  if(dates.size<3||sampleSize<120||spanDays<14)return {available:false,algorithmVersion:1,evidence,reason:'Registre pelo menos 3 simulados comparáveis em datas distintas, 120 questões e 14 dias de histórico nos últimos 90 dias.'};
  const scores=comparable.map(item=>Number(item.correct)/Number(item.total)*100),center=median(scores.slice(-3));
  const residuals=scores.slice(3).map((score,index)=>Math.abs(score-median(scores.slice(index,index+3))));
  const ordered=[...residuals].sort((a,b)=>a-b),empirical=ordered.length?ordered[Math.min(ordered.length-1,Math.ceil(ordered.length*.8)-1)]:null;
  const dispersion=Math.sqrt(scores.reduce((sum,value)=>sum+(value-center)**2,0)/scores.length);
  const margin=Math.max(4,dispersion*1.5,empirical??12,detailed?0:15);
  const confidence=detailed&&dates.size>=6&&residuals.length>=3&&spanDays>=28?'moderate':'low';
  const low=clamp(center-margin),high=clamp(center+margin),targetValue=Math.max(0,Math.min(100,Number(target)||80));
  return {available:true,algorithmVersion:1,central:clamp(center),low,high,confidence,confidenceLabel:confidence==='moderate'?'Moderada':'Baixa',target:targetValue,status:high<targetValue?'below':low>=targetValue?'above':'overlap',evidence,calibration:{state:residuals.length>=3&&detailed?'retrospective':'insufficient',observations:residuals.length,meanAbsoluteError:residuals.length?Math.round(residuals.reduce((sum,value)=>sum+value,0)/residuals.length*10)/10:null},observations:comparable.map((item,index)=>({date:item.date,value:scores[index],sampleSize:Number(item.total)})),reason:'Mediana dos três últimos simulados comparáveis; margem conservadora considera dispersão e erros retrospectivos. Não é um intervalo estatístico de aprovação.'};
}
