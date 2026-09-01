const asBoolean=value=>value===true;

export function createRecommendationPresentation(recommendation,{id,shownAt,algorithmVersion=1}={}){
  if(!recommendation||!id||!shownAt)throw new Error('Recomendação, identidade e instante são obrigatórios.');
  return {...recommendation,recommendationId:id,shownAt,algorithmVersion};
}

export function recordRecommendationDecision(feedbackList,recommendation,{accepted,reasonSkipped=null,now,idGenerator}={}){
  const existing=feedbackList.find(item=>item.recommendationId===recommendation.recommendationId);
  if(existing)return existing;
  const feedback={
    id:idGenerator('recommendation-feedback'),recommendationId:recommendation.recommendationId,
    date:String(recommendation.shownAt).slice(0,10),subjectId:recommendation.subjectId||null,topicId:recommendation.topicId||null,
    accepted:asBoolean(accepted),completed:false,useful:null,reasonSkipped,resultingSessionId:null,
    score:Number(recommendation.score)||0,confidence:recommendation.confidence||'baixa',algorithmVersion:Number(recommendation.algorithmVersion)||1,
    shownAt:recommendation.shownAt,createdAt:now,completedAt:null,ratedAt:null
  };
  feedbackList.push(feedback);return feedback;
}

export function completeRecommendationFeedback(feedbackList,recommendationId,{sessionId,completedAt}={}){
  const feedback=feedbackList.find(item=>item.recommendationId===recommendationId&&item.accepted);
  if(!feedback)return null;
  feedback.completed=true;feedback.completedAt=completedAt;feedback.resultingSessionId=sessionId||null;return feedback;
}

export function rateRecommendationFeedback(feedbackList,recommendationId,{useful,ratedAt}={}){
  const feedback=feedbackList.find(item=>item.recommendationId===recommendationId&&item.completed);
  if(!feedback)return null;
  feedback.useful=asBoolean(useful);feedback.ratedAt=ratedAt;return feedback;
}

export function summarizeRecommendationFeedback(feedbackList=[]){
  const decisions=feedbackList.filter(item=>typeof item.accepted==='boolean');
  const accepted=decisions.filter(item=>item.accepted);const completed=accepted.filter(item=>item.completed);const rated=completed.filter(item=>typeof item.useful==='boolean');
  const pct=(part,total)=>total?Math.round(part/total*100):null;
  return {shown:decisions.length,accepted:accepted.length,completed:completed.length,rated:rated.length,acceptanceRate:pct(accepted.length,decisions.length),completionRate:pct(completed.length,accepted.length),usefulnessRate:pct(rated.filter(item=>item.useful).length,rated.length)};
}
