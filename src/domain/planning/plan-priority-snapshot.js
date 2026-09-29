import {captureTopicPriorityProfile} from '../recommendations/topic-priority-profile.js';
export const PLAN_PRIORITY_POLICY_VERSION=1;
export const PLAN_PRIORITY_THRESHOLD=70;
const numeric=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);

// Captured at creation/confirmation. Legacy plans remain unclassified.
export function capturePlanPriority(candidate={}, {capturedAt=null,algorithmVersion=null,selectedPriority=false}={}){
  const score=numeric(candidate.score??candidate.priorityScore);
  const reasons=Array.isArray(candidate.reasons)?candidate.reasons.filter(value=>typeof value==='string'):[candidate.reasonSummary||candidate.reason].filter(Boolean);
  return {
    policyVersion:PLAN_PRIORITY_POLICY_VERSION,threshold:PLAN_PRIORITY_THRESHOLD,
    priority:score==null&&!selectedPriority?null:selectedPriority||score>=PLAN_PRIORITY_THRESHOLD,
    score,selection:selectedPriority?'weekly-close':'score',capturedAt,
    algorithmVersion:candidate.algorithmVersion??algorithmVersion,
    reasons:[...reasons],evidence:candidate.evidence?structuredClone(candidate.evidence):null,
    factors:candidate.factors?structuredClone(candidate.factors):null,
    examImpact:numeric(candidate.examImpact),mastery:numeric(candidate.mastery),retention:numeric(candidate.retention),
    topicProfile:captureTopicPriorityProfile({...candidate,algorithmVersion:candidate.algorithmVersion??algorithmVersion},{capturedAt})
  };
}
