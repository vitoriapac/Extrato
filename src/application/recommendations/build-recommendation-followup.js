import {localDateFromTimestamp} from '../../domain/sessions/study-session.js';
import {strategicRecordInScope} from '../analytics/build-strategic-timeline.js';
const numeric=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
const labels={accuracy:'Precisão',mastery:'Domínio',retention:'Retenção',reviewHealth:'Saúde das revisões',risk:'Risco'};
export function buildRecommendationFollowup({feedback=[],sessions=[],topics=[],activeExamTags=[],today}={}){
  const rows=feedback.filter(item=>item.accepted&&strategicRecordInScope(item,activeExamTags,topics)).map(item=>{
    const snapshot=item.snapshot||{},outcome=item.outcome||{},before=snapshot.before||item.baseline||outcome.before||{},after=outcome.after||{};
    const metrics=Object.entries(labels).map(([key,label])=>({key,label,before:numeric(before[key]),after:numeric(after[key]??outcome[key+'After'])}));
    const linked=sessions.filter(session=>{
      const recordedAt=Date.parse(session.endedAt||session.createdAt),measuredAt=Date.parse(outcome.measuredAt),baselineAt=Date.parse(before.measuredAt);
      const withinMeasurement=!Number.isFinite(recordedAt)||(!Number.isFinite(measuredAt)||recordedAt<=measuredAt)&&(!Number.isFinite(baselineAt)||recordedAt>=baselineAt);
      return withinMeasurement&&((item.recommendationId&&session.recommendationId===item.recommendationId)||(item.resultingSessionId&&session.id===item.resultingSessionId))&&(!item.topicId||session.topicId===item.topicId)&&(!item.subjectId||session.subjectId===item.subjectId)&&(!item.date||session.date>=item.date)&&(!today||session.date<=today)&&(!outcome.measuredAt||session.date<=localDateFromTimestamp(outcome.measuredAt));
    });
    const unique=[...new Map(linked.map(session=>[session.id,session])).values()],seconds=unique.reduce((sum,session)=>sum+Math.max(0,Number(session.durationSeconds)||0),0);
    const planned=numeric(snapshot.recommendedMinutes),executed=unique.length?Math.round(seconds/60*10)/10:null,credit=planned>0&&executed!=null?Math.min(planned,executed):null;
    const measured=Boolean(outcome.measuredAt)&&metrics.filter(metric=>metric.before!=null&&metric.after!=null).length>=2;
    const state=measured&&['positive','neutral','negative'].includes(outcome.state)?outcome.state:'insufficient';
    return {id:item.id,recommendationId:item.recommendationId,date:item.date||localDateFromTimestamp(item.createdAt),topicName:snapshot.evidenceSnapshot?.topicName||topics.find(topic=>topic.id===item.topicId)?.name||'Tópico removido',action:snapshot.suggestedAction?.label||snapshot.explanationSnapshot?.suggestedAction?.label||item.action||'Recomendação de estudo',completed:Boolean(item.completed),execution:{plannedMinutes:planned,executedMinutes:executed,adherence:credit==null?null:Math.round(credit/planned*100),excessMinutes:credit==null?null:Math.round((executed-credit)*10)/10,linkedSessions:unique.length},metrics,state,title:{positive:'Evidência de melhora',neutral:'Sem melhora observável · estável',negative:'Sem melhora observável · piora',insufficient:'Ainda sem evidência suficiente'}[state],questionVolume:numeric(outcome.questionVolumeAfter??outcome.questionVolume),measuredAt:outcome.measuredAt||null,measuredDate:localDateFromTimestamp(outcome.measuredAt),reasons:[...(outcome.reasons||[])],confidence:numeric(outcome.confidence),legacyScope:!Array.isArray(item.activeExamTags)};
  }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(a.id).localeCompare(String(b.id)));
  return {rows};
}
