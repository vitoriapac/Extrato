import {trendToRisk} from './trends.js';

const finite=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Math.max(0,Math.min(100,Number(value)));

// Shared, presentation-free inputs for risk, priority, recommendations and planning.
// A missing observation stays null; it is never interpreted as poor performance.
export function buildTopicSignals({topic={},priority={},mastery=null,retention=null,reviewHealth=null,examImpact=null,daysSinceContact=null,reviewUrgency=0,evidenceStrength=0}={}){
  const trend=priority.diagnosis?.trend||null;
  const signals={
    topicId:priority.topicId||topic.id||null,subjectId:priority.subjectId||topic.subjectId||null,
    examImpact:finite(examImpact),coverage:topic.status==='Concluído'?100:topic.status==='Em andamento'?50:0,
    mastery:finite(mastery),retention:finite(retention?.available?retention.score:null),
    reviewHealth:finite(reviewHealth?.value),trend,trendRisk:trendToRisk(trend),
    daysSinceContact:daysSinceContact==null?null:Math.max(0,Number(daysSinceContact)||0),
    reviewUrgency:finite(reviewUrgency),evidenceStrength:Math.max(0,Math.min(1,Number(evidenceStrength)||0))
  };
  signals.masteryGap=signals.mastery==null?null:100-signals.mastery;
  signals.retentionRisk=signals.retention==null?null:100-signals.retention;
  signals.reviewHealthRisk=signals.reviewHealth==null?null:100-signals.reviewHealth;
  signals.recencyRisk=signals.daysSinceContact==null?null:Math.min(100,signals.daysSinceContact*5);
  return signals;
}
