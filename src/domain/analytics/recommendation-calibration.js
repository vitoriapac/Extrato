export const RECOMMENDATION_CALIBRATION_VERSION='1.0.0';
const dateOf=item=>String(item?.outcome?.measuredAt||item?.completedAt||item?.date||'').slice(0,10);
const priorityBand=value=>value==null?'Não identificado':value>=80?'80–100':value>=60?'60–79':value>=40?'40–59':'0–39';
const label=value=>value==null||value===''?'Não identificado':String(value);
const confidence=(eligible,total)=>eligible>=20?'Alta':eligible>=10?'Média':total>=5?'Baixa':'Insuficiente';
function summarize(items,key,getLabel,minimumSample){
  const buckets=new Map();for(const item of items){const value=label(key(item)),bucket=buckets.get(value)||{key:value,label:getLabel?.(value,item)||value,total:0,positive:0,neutral:0,negative:0,insufficient:0};bucket.total++;const state=item.outcome?.state;if(state==='positive')bucket.positive++;else if(state==='neutral')bucket.neutral++;else if(state==='negative')bucket.negative++;else bucket.insufficient++;buckets.set(value,bucket)}
  return [...buckets.values()].map(item=>{const attributable=item.positive+item.neutral+item.negative;return{...item,attributable,positiveRate:attributable>=minimumSample?Math.round(item.positive/attributable*100):null,confidence:confidence(attributable,item.total),state:attributable>=minimumSample?'ready':'insufficient'}}).sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label));
}
export function buildRecommendationCalibration(feedback=[],{periodStart=null,periodEnd=null,minimumSample=5,subjectNames={},topicNames={}}={}){
  const measured=(Array.isArray(feedback)?feedback:[]).filter(item=>item?.outcome).filter(item=>{const date=dateOf(item);return(!periodStart||date>=periodStart)&&(!periodEnd||date<=periodEnd)});
  const groups={factor:summarize(measured,item=>item.snapshot?.dominantFactor||item.dominantFactor,null,minimumSample),type:summarize(measured,item=>item.snapshot?.recommendationType||item.recommendationType,null,minimumSample),subject:summarize(measured,item=>item.subjectId,value=>subjectNames[value]||value,minimumSample),topic:summarize(measured,item=>item.topicId,value=>topicNames[value]||value,minimumSample),priority:summarize(measured,item=>priorityBand(item.snapshot?.priorityScore??item.score),null,minimumSample)};
  return{algorithmVersion:RECOMMENDATION_CALIBRATION_VERSION,period:{start:periodStart,end:periodEnd},minimumSample,total:measured.length,state:measured.length?'available':'empty',groups};
}
