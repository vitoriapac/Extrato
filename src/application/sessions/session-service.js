export function createSessionService({repository,questionsRepository,historyRepository,planningRepository,recommendationsRepository,clock,idGenerator,normalizeQuestion=()=>{},completeRecommendation=()=>{}}={}){
  if(!repository||typeof repository.add!=='function')throw new TypeError('Serviço de sessões requer repositório.');
  if(!questionsRepository||!planningRepository||!clock||typeof idGenerator!=='function')throw new TypeError('Serviço de sessões requer dependências de aplicação.');
  const normalize=input=>{const resolved=Math.max(0,Math.floor(Number(input.questionsResolved)||0));return {...input,durationSeconds:Math.max(0,Number(input.durationSeconds)||0),questionsResolved:resolved,correctAnswers:Math.max(0,Math.min(Math.floor(Number(input.correctAnswers)||0),resolved))}};
  const findPlanItem=id=>{if(!id)return null;for(const plan of planningRepository.getDailyPlans()){const item=(plan.items||[]).find(candidate=>candidate.id===id);if(item)return{plan,item}}return null};
  const syncPlan=planItemId=>{
    const found=findPlanItem(planItemId);if(!found)return null;
    const linked=repository.listByPlanItem(planItemId),latest=[...linked].sort((a,b)=>String(a.endedAt||'').localeCompare(String(b.endedAt||''))).pop();
    found.item.sessionIds=linked.map(item=>item.id);found.item.executedSeconds=linked.reduce((sum,item)=>sum+Math.max(0,Number(item.durationSeconds)||0),0);
    found.item.status=!linked.length?'planned':found.item.plannedMinutes>0&&found.item.executedSeconds>=found.item.plannedMinutes*60?'completed':'partial';
    found.item.lastExecutedAt=latest?.endedAt||null;found.plan.updatedAt=clock.nowISO();
    if(latest&&found.item.recommendationId&&found.item.status==='completed')completeRecommendation(recommendationsRepository?.all?.()||[],found.item.recommendationId,{sessionId:latest.id,completedAt:found.item.lastExecutedAt});
    return found.item;
  };
  const syncQuestion=session=>{
    const linked=questionsRepository.all().filter(item=>item.studySessionId===session.id),existing=linked[0]||null;
    linked.slice(1).forEach(item=>questionsRepository.remove(item.id));
    if(session.questionsResolved<=0){if(existing)questionsRepository.remove(existing.id);return null}
    const values={date:session.date,subjectId:session.subjectId||null,topicId:session.topicId||null,resolved:session.questionsResolved,correct:session.correctAnswers,studySessionId:session.id};
    const question=existing?questionsRepository.update(existing.id,values):questionsRepository.add({id:idGenerator('question'),createdAt:clock.nowISO(),...values});normalizeQuestion(question);return question;
  };
  return Object.freeze({
    complete:input=>{const session=normalize({id:idGenerator('session'),createdAt:clock.nowISO(),...input});const saved=repository.add(session);syncQuestion(saved);syncPlan(saved.planItemId);const occurredAt=clock.nowISO();historyRepository?.add?.({id:idGenerator('history'),date:occurredAt,occurredAt,localDate:saved.date||clock.today(),type:'study_session',subjectId:saved.subjectId||null,topicId:saved.topicId||null,metadata:{sessionId:saved.id,durationSeconds:saved.durationSeconds}});return saved},
    edit:(id,changes)=>{const current=repository.findById(id);if(!current)return null;const oldPlanItemId=current.planItemId||null,saved=repository.update(id,normalize({...current,...changes}));syncQuestion(saved);if(oldPlanItemId&&oldPlanItemId!==saved.planItemId)syncPlan(oldPlanItemId);syncPlan(saved.planItemId);return saved},
    remove:id=>{const session=repository.remove(id);if(!session)return null;questionsRepository.all().filter(item=>item.studySessionId===id).forEach(item=>questionsRepository.remove(item.id));historyRepository?.all?.().filter(item=>item.type==='study_session'&&item.metadata?.sessionId===id).forEach(item=>historyRepository.remove(item.id));syncPlan(session.planItemId);return session},
    syncPlanItem:syncPlan
  });
}
