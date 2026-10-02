import {applyAdaptivePlanningAdvice} from '../../domain/planning/adaptive-planning.js';
import {compareRecoveryPlan} from './compare-recovery-plan.js';

const total=items=>items.reduce((sum,item)=>sum+Number(item.minutes),0);

export function buildRecoveryAllocation(plan,advice){
  const proposed=applyAdaptivePlanningAdvice(plan,advice);
  if(!proposed||proposed.weeklyPlannedMinutes!==plan.weeklyPlannedMinutes
    ||proposed.weeklyAvailableMinutes!==plan.weeklyAvailableMinutes
    ||total(proposed.items)!==total(plan.items)||total(proposed.subjects)!==total(plan.subjects))return null;
  const comparison=compareRecoveryPlan(plan,proposed);
  if(comparison.increased.length!==1||comparison.reduced.length!==1
    ||comparison.increased[0].deltaMinutes!==advice.transferMinutes
    ||comparison.reduced[0].deltaMinutes!==-advice.transferMinutes)return null;
  return {...comparison,proposedPlan:proposed};
}
