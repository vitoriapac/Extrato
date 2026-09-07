import {evaluateRecommendationOutcome,normalizeRecommendationMetrics} from '../../domain/recommendations/recommendation-outcome.js';

export function recommendationOutcomeConfidence(questionVolume=0){const volume=Math.max(0,Number(questionVolume)||0);return volume<1?'Aguardando':volume<20?'Amostra inicial':volume<50?'Estimativa':'Mais confiável'}

export function captureRecommendationBaseline({mastery=null,accuracy=null,questionVolume=0,retention=null,retentionScore=null,reviewHealth=null,risk=null,trend=null,evidence=null,daysSinceContact=null,measuredAt}={}){
  const metrics=normalizeRecommendationMetrics({mastery,accuracy,retention:retention??retentionScore,reviewHealth,risk});
  return {...metrics,retentionScore:metrics.retention,accuracy:metrics.accuracy,questionVolume:Math.max(0,Number(questionVolume)||0),daysSinceContact:Number.isFinite(Number(daysSinceContact))?Math.max(0,Number(daysSinceContact)):null,trend:trend?structuredClone(trend):null,evidence:evidence?structuredClone(evidence):null,measuredAt};
}

export function captureRecommendationSnapshot(recommendation,{baseline=null,createdAt=null}={}){
  const before=baseline||captureRecommendationBaseline({measuredAt:createdAt});
  return Object.freeze({recommendationId:recommendation.recommendationId,algorithmVersion:Number(recommendation.algorithmVersion)||1,subjectId:recommendation.subjectId||null,topicId:recommendation.topicId||null,
    priorityScore:Number.isFinite(Number(recommendation.score))?Number(recommendation.score):null,riskScore:Number.isFinite(Number(recommendation.risk?.value))?Number(recommendation.risk.value):null,
    recommendedMinutes:Math.max(0,Number(recommendation.estimatedMinutes)||0),recommendedQuestions:Math.max(0,Number(recommendation.recommendedQuestions)||0),masteryBefore:before.mastery??null,retentionBefore:before.retention??null,reviewHealthBefore:before.reviewHealth??null,evidenceBefore:before.evidence?structuredClone(before.evidence):null,before:structuredClone(before),createdAt:createdAt||recommendation.shownAt||null});
}

export function measureRecommendationOutcome(feedback,{masteryAfter=null,accuracyAfter=null,questionVolumeAfter=0,nextReviewRating=null,retentionAfter=null,reviewHealthAfter=null,riskAfter=null,measuredAt,daysElapsed=0,otherActivities=0}={}){
  if(!feedback)return null;const before=feedback.snapshot?.before||feedback.baseline||{};
  const evaluated=evaluateRecommendationOutcome({before,after:{mastery:masteryAfter,accuracy:accuracyAfter,retention:retentionAfter,reviewHealth:reviewHealthAfter,risk:riskAfter},questionVolume:questionVolumeAfter,measuredAt,daysElapsed,otherActivities});
  const outcome={...evaluated,accuracyAfter:evaluated.after.accuracy,questionVolumeAfter:evaluated.questionVolume,nextReviewRating:nextReviewRating||null,retentionAfter:evaluated.after.retention,confidenceLabel:recommendationOutcomeConfidence(evaluated.questionVolume)};
  feedback.outcome=outcome;return outcome;
}
