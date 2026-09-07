const LABELS=Object.freeze({mastery:'Domínio',retention:'Retenção',reviewHealth:'Saúde da revisão',accuracy:'Acerto',risk:'Risco'});
const STATE_MAP=Object.freeze({positive:'improved',negative:'worsened',improved:'improved',worsened:'worsened',neutral:'neutral',pending:'pending',insufficient:'insufficient'});
const STATE_LABELS=Object.freeze({improved:'A recomendação ajudou',worsened:'O resultado piorou',neutral:'Resultado estável',pending:'Resultado em acompanhamento',insufficient:'Evidência insuficiente'});
const numeric=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
export function buildRecommendationOutcomeViewModel(feedbackList=[]){
  const measured=(Array.isArray(feedbackList)?feedbackList:[]).filter(item=>item?.completed&&item?.outcome).sort((a,b)=>String(b.outcome.measuredAt||b.completedAt||'').localeCompare(String(a.outcome.measuredAt||a.completedAt||'')));
  const feedback=measured[0];if(!feedback)return {state:'empty',available:false,metrics:[]};
  const outcome=feedback.outcome,before=outcome.before||feedback.snapshot?.before||feedback.baseline||{},after=outcome.after||{},deltas=outcome.delta||{};
  const metrics=Object.keys(LABELS).map(key=>{const start=numeric(before[key]),end=numeric(after[key]??outcome[key+'After']),delta=numeric(deltas[key]);return {key,label:LABELS[key],before:start,after:end,delta,available:start!==null&&end!==null}}).filter(item=>item.available);
  const state=STATE_MAP[outcome.state]||'insufficient',confidence=numeric(outcome.confidence);
  return {state,available:true,title:STATE_LABELS[state],metrics,confidence,confidenceLabel:outcome.confidenceLabel||outcome.evidence?.evidenceLabel||null,evidenceLabel:outcome.evidence?.evidenceLabel||null,reasons:Array.isArray(outcome.reasons)?outcome.reasons:[],questionVolume:Math.max(0,Number(outcome.questionVolumeAfter??outcome.questionVolume)||0),measuredAt:outcome.measuredAt||null,recommendationId:feedback.recommendationId,algorithmVersion:Number(outcome.algorithmVersion)||1};
}
