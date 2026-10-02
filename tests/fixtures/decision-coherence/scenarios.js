const risk={subjectId:'math',topicId:'interest',examImpact:85};
const trajectory={status:'attention',topicRisks:[risk]};
const examIntelligence={rows:[{...risk,impact:85}]};
const adaptivePlan={items:[{subjectId:'math',topicId:'interest'}]};
const weeklyClose={gapMap:{rows:[{subjectId:'math',topicId:'interest'}]}};
const context={readiness:{score:67},examIntelligence,adaptivePlan,weeklyClose,consistency:{studiedDays:5}};
const action=(subjectId,topicId,decisionReasonCode)=>({action:{subjectId,topicId},decisionReasonCode});

export const decisionCoherenceScenarios={
  healthy:{...context,trajectory,nextBestAction:action('math','interest'),expected:'coherent'},
  conflictingPriority:{...context,trajectory,nextBestAction:action('informatics','security'),adaptivePlan:{items:[]},expected:'needs_review'},
  overdueReview:{...context,trajectory,nextBestAction:action('portuguese','syntax','overdue_review'),expected:'explained_divergence'},
  examRisk:{...context,trajectory:{...trajectory,status:'at_risk'},nextBestAction:action('math','interest'),expected:'coherent'},
  lowEvidence:{...context,trajectory:{status:'insufficient_data',topicRisks:[risk]},nextBestAction:action('informatics','security'),expected:'coherent'},
  finalStretch:{...context,trajectory:{...trajectory,exam:{phase:'final_stretch'}},nextBestAction:action('portuguese','syntax','exam_phase'),expected:'explained_divergence'},
  recovery:{...context,trajectory:{...trajectory,status:'on_track',topicRisks:[]},nextBestAction:action('math','interest'),expected:'coherent'}
};
