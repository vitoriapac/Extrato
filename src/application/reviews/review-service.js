const REVIEW_TYPES=Object.freeze({1:'Revisão 24h',3:'Revisão 3 dias',7:'Revisão 7 dias',14:'Revisão 14 dias',15:'Revisão 15 dias',30:'Revisão 30 dias'});

export function reviewTypeForDays(days){return REVIEW_TYPES[Number(days)]||'Revisão livre'}

export function createReviewService({repository,clock,idGenerator,findTopic=()=>null,calculateAdaptiveState,algorithmVersion=()=>1,onEvent=()=>{},onTopicChanged=()=>{}}={}){
  if(!repository||typeof repository.findById!=='function')throw new TypeError('Serviço de revisões requer repositório.');
  if(!clock||typeof clock.today!=='function'||typeof clock.nowISO!=='function')throw new TypeError('Serviço de revisões requer relógio.');
  if(typeof idGenerator!=='function')throw new TypeError('Serviço de revisões requer gerador de IDs.');
  const topicIdOf=review=>review?.topicId||review?.topicRef||null;
  const complete=(review,completedAt=clock.nowISO())=>{
    if(!review||review.status==='Concluído')return review||null;
    repository.update(review.id,{status:'Concluído',completedAt});
    onEvent('review_completed',review,{reviewId:review.id,reviewType:review.tipo});
    if(topicIdOf(review))onTopicChanged(topicIdOf(review));
    return review;
  };
  return Object.freeze({
    completeReview:id=>complete(repository.findById(id)),
    createManualReview:input=>repository.add({id:idGenerator('review'),topicId:null,date:clock.today(),subjectId:null,topic:'',tipo:'Revisão livre',status:'Não iniciado',adaptive:false,manualDate:true,adaptiveReason:null,suggestedDate:null,baseIntervalDays:7,createdAt:clock.nowISO(),completedAt:null,...input}),
    removeReview:id=>repository.remove(id),
    rescheduleReview:(id,date)=>repository.update(id,{date,manualDate:true,adaptive:false}),
    restoreAdaptiveSchedule:(id,suggestion)=>repository.update(id,{date:suggestion.date,suggestedDate:suggestion.date,adaptiveReason:suggestion.reason,manualDate:false,adaptive:true}),
    rateReview:(id,rating,{label='adaptativa'}={})=>{
      const review=repository.findById(id),topicId=topicIdOf(review),topic=topicId?findTopic(topicId):null;
      if(!review||!topicId||!topic||typeof calculateAdaptiveState!=='function')return null;
      const adaptiveState=calculateAdaptiveState(topic.adaptiveReview,rating,{reviewDate:clock.today(),algorithmVersion:algorithmVersion()});
      topic.adaptiveReview=adaptiveState;
      repository.update(id,{lastRating:rating,adaptiveState:structuredClone(adaptiveState),adaptiveReason:`Avaliação: ${label} · próximo intervalo: ${adaptiveState.intervalDays} dia${adaptiveState.intervalDays===1?'':'s'}`});
      complete(review);
      let next=null;
      if(!repository.hasPendingForTopic(topicId,adaptiveState.nextReviewDate,{exceptId:id}))next=repository.add({id:idGenerator('review'),subjectId:review.subjectId||null,topicId,topicRef:topicId,topic:topic.name||review.topic||'',date:adaptiveState.nextReviewDate,suggestedDate:adaptiveState.nextReviewDate,baseIntervalDays:adaptiveState.intervalDays,adaptive:true,manualDate:false,adaptiveReason:`Agendada após avaliação ${label}.`,tipo:reviewTypeForDays(adaptiveState.intervalDays),status:'Não iniciado',lastRating:null,adaptiveState:structuredClone(adaptiveState),createdAt:clock.nowISO(),completedAt:null});
      onEvent('adaptive_review_rated',review,{reviewId:id,rating,intervalDays:adaptiveState.intervalDays,nextReviewDate:adaptiveState.nextReviewDate,algorithmVersion:adaptiveState.algorithmVersion});
      onTopicChanged(topicId);
      return {review,next,adaptiveState};
    }
  });
}
