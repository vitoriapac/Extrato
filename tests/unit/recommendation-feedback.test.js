import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecommendationPresentation,recordRecommendationDecision,completeRecommendationFeedback,rateRecommendationFeedback,summarizeRecommendationFeedback} from '../../src/application/recommendations/recommendation-feedback.js';

test('preserva identidade, versão e evidência da recomendação',()=>{
  const list=[];const recommendation=createRecommendationPresentation({id:'topic-1',score:82,confidence:'alta',subjectId:'s1',topicId:'t1'},{id:'rec-1',shownAt:'2026-09-01T12:00:00.000Z',algorithmVersion:3});
  const feedback=recordRecommendationDecision(list,recommendation,{accepted:true,now:'2026-09-01T12:01:00.000Z',idGenerator:()=> 'feedback-1'});
  assert.equal(feedback.recommendationId,'rec-1');assert.equal(feedback.algorithmVersion,3);assert.equal(feedback.score,82);
  completeRecommendationFeedback(list,'rec-1',{sessionId:'session-1',completedAt:'2026-09-01T13:00:00.000Z'});
  rateRecommendationFeedback(list,'rec-1',{useful:true,ratedAt:'2026-09-01T13:01:00.000Z'});
  assert.deepEqual(summarizeRecommendationFeedback(list),{shown:1,accepted:1,completed:1,rated:1,acceptanceRate:100,completionRate:100,usefulnessRate:100});
});

test('não duplica uma decisão da mesma exibição',()=>{
  const list=[],recommendation={recommendationId:'rec-1',shownAt:'2026-09-01T12:00:00.000Z'};
  const first=recordRecommendationDecision(list,recommendation,{accepted:false,now:recommendation.shownAt,idGenerator:()=> 'one'});
  const second=recordRecommendationDecision(list,recommendation,{accepted:true,now:recommendation.shownAt,idGenerator:()=> 'two'});
  assert.equal(first,second);assert.equal(list.length,1);assert.equal(first.accepted,false);
});
