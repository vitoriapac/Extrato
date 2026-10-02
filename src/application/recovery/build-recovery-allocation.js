import {applyAdaptivePlanningAdvice} from '../../domain/planning/adaptive-planning.js';
import {compareRecoveryPlan} from './compare-recovery-plan.js';
import {validateRecoveryAllocation} from './recovery-invariants.js';

export function buildRecoveryAllocation(plan,advice){
  const proposed=applyAdaptivePlanningAdvice(plan,advice);
  if(!validateRecoveryAllocation({before:plan,after:proposed,fromSubjectId:advice.from?.subjectId,
    toSubjectId:advice.to?.subjectId,minutes:advice.transferMinutes,activeExamTags:plan.activeExamTags||[]}).valid)return null;
  const comparison=compareRecoveryPlan(plan,proposed);
  if(comparison.increased.length!==1||comparison.reduced.length!==1
    ||comparison.increased[0].deltaMinutes!==advice.transferMinutes
    ||comparison.reduced[0].deltaMinutes!==-advice.transferMinutes)return null;
  return {...comparison,proposedPlan:proposed};
}
