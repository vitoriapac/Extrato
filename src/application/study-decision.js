import {calculatePriorityScore} from '../domain/analytics/priority-score.js';

// One decision contract for Today, the overview and the weekly plan.
export function scoreStudyDecision(candidate={}){
  const score=calculatePriorityScore(candidate);
  const reasons=score.reasons;
  return {...candidate,...score,primaryReason:reasons[0],reasonSummary:reasons.join(' · ')};
}
