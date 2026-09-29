import {strategicScopeKey} from './build-strategic-timeline.js';
const number=value=>value!=null&&Number.isFinite(Number(value))?Number(value):null;
export function captureCloseComparisonMetrics(model,projection=null){
  const current=model?.weeklyClose?.decisionCycle?.readiness?.current;
  return {readiness:number(current?.score),coverage:number(current?.factors?.coverage),accuracy:number(model?.weeklyClose?.questions?.accuracy),strategicAdherence:number(model?.weeklyClose?.decisionCycle?.execution?.strategicAdherence),readinessVersion:current?.algorithmVersion??null,readinessWeights:current?.weights?structuredClone(current.weights):null,projection:projection?.available?{low:projection.low,high:projection.high,algorithmVersion:projection.calibration?.algorithmVersion??null}:null};
}
export function buildCloseComparison({current,snapshots=[],activeExamTags=[]}={}){
  const previous=[...snapshots].filter(item=>strategicScopeKey(item.activeExamTags)===strategicScopeKey(activeExamTags)&&item.period?.end<=current?.period?.end).sort((a,b)=>String(b.savedAt||b.period.end).localeCompare(String(a.savedAt||a.period.end))||(Number(b.revision)||1)-(Number(a.revision)||1))[0];
  if(!previous)return {state:'empty',rows:[],previous:null};
  const before=previous.comparisonMetrics||captureCloseComparisonMetrics(previous),after=current.comparisonMetrics||captureCloseComparisonMetrics(current);
  const sameReadiness=before.readinessVersion!=null&&before.readinessVersion===after.readinessVersion&&JSON.stringify(before.readinessWeights)===JSON.stringify(after.readinessWeights);
  const rows=[['readiness','Prontidão','pontos'],['accuracy','Precisão','p.p.'],['coverage','Cobertura no índice','pontos'],['strategicAdherence','Aderência estratégica','p.p.']].map(([key,label,unit])=>{
    const comparable=!['readiness','coverage'].includes(key)||sameReadiness;
    const old=number(before[key]),value=number(after[key]);return {key,label,unit,before:old,after:value,delta:comparable&&old!=null&&value!=null?Math.round((value-old)*10)/10:null,reason:comparable?'Sem evidência registrada nas duas medições':'Versões de cálculo não comparáveis'};
  });
  const a=before.projection,b=after.projection,comparable=a&&b&&a.algorithmVersion!=null&&a.algorithmVersion===b.algorithmVersion;
  rows.push({key:'projection',label:'Faixa da projeção',before:a,after:b,delta:comparable?Math.round(((b.low+b.high)-(a.low+a.high))/2*10)/10:null,unit:'pontos',reason:'Projeção anterior ausente ou método diferente'});
  return {state:'available',rows,previous:{id:previous.id,period:previous.period,savedAt:previous.savedAt,revision:previous.revision||1},overlap:previous.period.end>=current.period.start};
}
