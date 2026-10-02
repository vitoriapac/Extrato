import {DECISION_REASON_LABELS,decisionReasonCode} from './decision-reason-codes.js';

// Read-only audit of outputs already produced by the decision engines.
// A divergence is evidence for inspection, never an instruction to rerank actions.
export function buildDecisionCoherenceReport({trajectory=null,nextBestAction=null,examIntelligence=null,
  adaptivePlan=null,weeklyClose=null}={}) {
  const risks=trajectory?.status==='insufficient_data'?[]:(trajectory?.topicRisks||[]);
  const action=nextBestAction?.action||null;
  const topics=Array.isArray(examIntelligence)?examIntelligence:examIntelligence?.rows||examIntelligence?.topics||[];
  const signals=risks.map(risk=>{
    const evidence=topics.find(item=>item.topicId===risk.topicId&&item.subjectId===risk.subjectId);
    return {topicId:risk.topicId,subjectId:risk.subjectId,trajectoryRisk:true,
      highExamImpact:risk.examImpact>=70||Number(evidence?.examImpact??evidence?.impact)>=70,
      nextAction:action?.topicId===risk.topicId&&action?.subjectId===risk.subjectId,
      weeklyGap:Boolean(weeklyClose?.gapMap?.rows?.some(item=>item.topicId===risk.topicId)),
      planned:Boolean(adaptivePlan?.items?.some(item=>item.topicId===risk.topicId))};
  });
  const divergences=[];
  if(action&&risks.length&&!signals.some(item=>item.nextAction)) {
    const reasonCode=decisionReasonCode(nextBestAction.decisionReasonCode);
    divergences.push({type:'trajectory_action_mismatch',riskTopicId:risks[0].topicId,
      actionTopicId:action.topicId,explainable:reasonCode!=='unknown',reasonCode,
      reason:reasonCode==='unknown'?null:DECISION_REASON_LABELS[reasonCode]});
  }
  const explained=divergences.filter(item=>item.explainable).length;
  const unexplained=divergences.length-explained;
  const status=unexplained?'needs_review':explained?'explained_divergence':'coherent';
  return {status,coherent:unexplained===0,signals,divergences,summary:{risks:signals.length,
    aligned:signals.filter(item=>item.nextAction||item.planned).length,explained,unexplained}};
}
