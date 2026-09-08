export const PERFORMANCE_SCENARIOS_VERSION='1.0.0';
const clamp=value=>Math.max(0,Math.min(100,Math.round(value)));
export function buildPerformanceScenarios(forecast,{weeklyMinutes=0}={}){
  const definitions=[['current','Cenário atual',0],['plus_2h','+2h por semana',120],['plus_4h','+4h por semana',240]];
  if(!forecast?.forecast30?.available)return{algorithmVersion:PERFORMANCE_SCENARIOS_VERSION,available:false,reason:forecast?.forecast30?.reason||'Projeção de 30 dias indisponível.',scenarios:[]};
  const base=Math.max(60,Number(weeklyMinutes)||0),range=forecast.forecast30;
  return{algorithmVersion:PERFORMANCE_SCENARIOS_VERSION,available:true,reason:null,scenarios:definitions.map(([id,label,extraWeeklyMinutes])=>{const workloadRatio=Math.min(1.5,(base+extraWeeklyMinutes)/base),uplift=extraWeeklyMinutes?Math.min(6,Math.max(1,Math.round((workloadRatio-1)*Math.max(2,range.slopePerWeek||2)*4))):0;return{id,label,extraWeeklyMinutes,low:clamp(range.low+uplift),high:clamp(range.high+uplift),central:clamp(range.central+uplift),confidence:range.confidence,confidenceLabel:range.confidenceLabel,evidence:forecast.evidence,premises:['Mantém a qualidade e a distribuição atuais do estudo','Simulação de capacidade; não estima causalidade nem aprovação']}})};
}
