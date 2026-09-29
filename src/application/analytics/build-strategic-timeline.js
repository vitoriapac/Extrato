import {normalizeExamTags,isTopicInExamScope,isSimulationInExamScope} from '../../domain/exams/exam-scope.js';
import {localDateFromTimestamp} from '../../domain/sessions/study-session.js';

export const strategicScopeKey=tags=>Array.isArray(tags)?JSON.stringify(normalizeExamTags(tags)):null;
export function strategicRecordInScope(record,activeExamTags,topics=[]){
  if(Array.isArray(record.activeExamTags))return strategicScopeKey(record.activeExamTags)===strategicScopeKey(activeExamTags);
  const topic=topics.find(item=>item.id===record.topicId);
  return topic?isTopicInExamScope(topic,activeExamTags):!activeExamTags.length;
}
export function buildStrategicTimeline({readinessSnapshots=[],weeklyCloseSnapshots=[],recommendations=[],recommendationHistory=[],studyPlans=[],adaptiveHistory=[],planAdjustments=[],simulations=[],topics=[],activeExamTags=[],filter='all',today=null}={}){
  const events=[],seen=new Set();
  const add=(source,id,time,category,title,description,record)=>{
    const date=/^\d{4}-\d{2}-\d{2}$/.test(time||'')?time:localDateFromTimestamp(time);
    const key=`${source}:${id}`;if(!id||!date||(today&&date>today)||seen.has(key))return;
    seen.add(key);events.push({id:key,sourceId:id,date,time:time||date,category,title,description,legacyScope:!Array.isArray(record.activeExamTags),sequence:events.length});
  };
  const exact=record=>strategicScopeKey(record.activeExamTags)===strategicScopeKey(activeExamTags);
  const scoped=record=>strategicRecordInScope(record,activeExamTags,topics);
  const readiness=readinessSnapshots.filter(exact).sort((a,b)=>a.date.localeCompare(b.date)||String(a.savedAt||'').localeCompare(String(b.savedAt||'')));
  readiness.forEach((item,index)=>{const previous=readiness[index-1],delta=previous?item.score-previous.score:null;add('readiness',item.id,item.savedAt||item.date,'readiness','Prontidão registrada',`${previous?previous.score+' → ':''}${item.score}/100${delta==null?'':` · ${delta>=0?'+':''}${delta}`} · ${item.reason||'Retrato da preparação'}`,item)});
  weeklyCloseSnapshots.filter(exact).forEach(item=>add('close',item.id,item.savedAt||item.period?.end,'decisions','Fechamento semanal',`${item.period?.start} a ${item.period?.end} · aderência estratégica ${item.weeklyClose?.decisionCycle?.execution?.strategicAdherence??'sem dados'}${item.weeklyClose?.decisionCycle?.execution?.strategicAdherence==null?'':'%'}`,item));
  const feedbackIds=new Set(recommendations.map(item=>item.recommendationId).filter(Boolean));
  recommendations.filter(scoped).forEach(item=>{if(typeof item.accepted!=='boolean')return;const name=item.snapshot?.explanationSnapshot?.topicName||topics.find(topic=>topic.id===item.topicId)?.name||'Tópico removido';add('recommendation',item.id||item.recommendationId,item.createdAt||item.date,'decisions',item.accepted?'Recomendação aceita':'Recomendação rejeitada',`${name} · ${item.snapshot?.recommendedMinutes??'sem duração registrada'} min`,item)});
  recommendationHistory.filter(item=>!feedbackIds.has(item.id)&&['executed','dismissed'].includes(item.status)&&scoped(item)).forEach(item=>add('recommendation-history',item.id,item.executedAt||item.dismissedAt||item.createdAt,'decisions',item.status==='executed'?'Recomendação aceita':'Recomendação rejeitada',topics.find(topic=>topic.id===item.topicId)?.name||'Tópico removido',item));
  studyPlans.filter(item=>Array.isArray(item.activeExamTags)?exact(item):!activeExamTags.length).forEach(item=>{const phase=item.phaseStrategy;add('plan',item.id,phase?.appliedAt||item.confirmedAt,'planning',phase?.status==='reverted'?'Estratégia por fase revertida':phase?'Estratégia por fase aplicada':'Plano semanal confirmado',`${phase?.phase?.label?phase.phase.label+' · ':''}${item.weeklyPlannedMinutes} min distribuídos`,item)});
  adaptiveHistory.filter(item=>['applied','reverted'].includes(item.status)&&scoped({...item,topicId:item.targetTopicId})).forEach(item=>{add('adaptive',item.id,item.decidedAt||item.createdAt,'planning','Redistribuição adaptativa',`${item.minutes??'—'} min transferidos`,item);if(item.revertedAt)add('adaptive-revert',item.id,item.revertedAt,'planning','Redistribuição revertida','Uma nova versão preservou o plano anterior.',item)});
  planAdjustments.filter(item=>scoped(item)).forEach(item=>add('adjustment',item.id,item.createdAt||item.date,'planning','Replanejamento registrado',item.reason||'Decisão de planejamento registrada.',item));
  simulations.filter(item=>isSimulationInExamScope(item,activeExamTags)).forEach(item=>add('simulation',item.id,item.date,'simulations','Simulado registrado',`${item.nome||'Simulado'} · ${Number(item.total)>0?Math.round(Number(item.correct)/Number(item.total)*100)+'% de acerto':'sem amostra'}`,{...item,activeExamTags:item.examTags}));
  const rows=events.sort((a,b)=>b.date.localeCompare(a.date)||String(b.time).localeCompare(String(a.time))||b.sequence-a.sequence).filter(item=>filter==='all'||item.category===filter);
  return {rows,total:rows.length,filter};
}
