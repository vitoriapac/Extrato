export function recommendationOutcomeConfidence(questionVolume=0){const volume=Math.max(0,Number(questionVolume)||0);return volume<1?'Aguardando':volume<20?'Amostra inicial':volume<50?'Estimativa':'Mais confiável'}

export function captureRecommendationBaseline({accuracy=null,questionVolume=0,retentionScore=null,daysSinceContact=null,measuredAt}={}){
  return {accuracy:Number.isFinite(Number(accuracy))?Number(accuracy):null,questionVolume:Math.max(0,Number(questionVolume)||0),retentionScore:Number.isFinite(Number(retentionScore))?Number(retentionScore):null,daysSinceContact:Number.isFinite(Number(daysSinceContact))?Math.max(0,Number(daysSinceContact)):null,measuredAt};
}

export function measureRecommendationOutcome(feedback,{accuracyAfter=null,questionVolumeAfter=0,nextReviewRating=null,retentionAfter=null,measuredAt,daysElapsed=0,otherActivities=0}={}){
  if(!feedback)return null;const volume=Math.max(0,Number(questionVolumeAfter)||0),reasons=[];
  if(volume<20)reasons.push('Amostra inferior a 20 questões');if(Number(daysElapsed)<1)reasons.push('Período de observação muito curto');if(Number(otherActivities)>3)reasons.push('Muitas outras atividades no tópico');
  const outcome={accuracyAfter:Number.isFinite(Number(accuracyAfter))?Number(accuracyAfter):null,questionVolumeAfter:volume,nextReviewRating:nextReviewRating||null,retentionAfter:Number.isFinite(Number(retentionAfter))?Number(retentionAfter):null,measuredAt,confidence:recommendationOutcomeConfidence(volume),attributionEligible:reasons.length===0,reasons};feedback.outcome=outcome;return outcome;
}
