import {recommendationActionKind} from './recommendation-action.js';

export const RECOMMENDATION_HISTORY_STATUSES=Object.freeze(['pending','executed','dismissed','expired']);
const signature=item=>JSON.stringify([item.id,item.score,item.estimatedMinutes,item.factors||null,recommendationActionKind(item)]);
const localDate=timestamp=>{const date=new Date(timestamp);return Number.isNaN(date.getTime())?null:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`};
const recordDate=record=>record.localDate||localDate(record.createdAt);

export function migrateRecommendationHistory(feedback=[]){
  const seen=new Set();return feedback.filter(item=>{if(!item.recommendationId||seen.has(item.recommendationId))return false;seen.add(item.recommendationId);return true}).map(item=>({
    id:item.recommendationId,createdAt:item.shownAt||item.createdAt||new Date(`${item.date}T12:00:00Z`).toISOString(),localDate:item.date||localDate(item.shownAt||item.createdAt),
    candidateId:null,signature:null,source:item.presentationSource||'legacy',subjectId:item.subjectId||null,topicId:item.topicId||null,
    activityType:['study','review','questions','prerequisite'].includes(item.actionKind||item.snapshot?.recommendationType)?item.actionKind||item.snapshot?.recommendationType:'study',suggestedMinutes:item.snapshot?.recommendedMinutes??null,
    priority:item.score??null,reasons:[],evidenceSnapshot:item.snapshot?.evidenceBefore||null,algorithmVersions:{priority:Number(item.algorithmVersion)||1,examIntelligence:item.snapshot?.examIntelligenceVersion??null},
    status:item.accepted?'executed':'dismissed',executedAt:item.accepted?item.completedAt||item.createdAt||null:null,
    dismissedAt:item.accepted?null:item.createdAt||null,expiredAt:null,sessionId:item.resultingSessionId||null,feedbackId:item.id
  }));
}

export function reusableRecommendationRecord(history,item,date){
  const expected=signature(item);
  return [...history].reverse().find(record=>record.status==='pending'&&record.candidateId===item.id&&record.signature===expected&&recordDate(record)===date)||null;
}

export function ensureRecommendationRecord(history,item,{now,idGenerator}={}){
  const existing=history.find(record=>record.id===item.recommendationId);if(existing)return existing;
  const record={id:item.recommendationId||idGenerator('recommendation'),createdAt:item.shownAt||now,localDate:localDate(item.shownAt||now),candidateId:item.id,signature:signature(item),source:'generated',subjectId:item.subjectId||null,topicId:item.topicId||null,activityType:recommendationActionKind(item),suggestedMinutes:item.estimatedMinutes??null,priority:item.score??null,reasons:[...(item.reasons||[])],evidenceSnapshot:item.evidence?structuredClone(item.evidence):null,algorithmVersions:{priority:Number(item.algorithmVersion)||1,examIntelligence:item.examIntelligence?.algorithmVersion??null},status:'pending',executedAt:null,dismissedAt:null,expiredAt:null,sessionId:null,feedbackId:null};history.push(record);return record;
}

export function syncRecommendationHistory(history,recommendations,{now,today=localDate(now),idGenerator,visibleCount=3}={}){
  const visible=recommendations.slice(0,visibleCount),ids=new Set(visible.map(item=>item.recommendationId));let changed=false;
  for(const record of history){if(record.status==='pending'&&(!ids.has(record.id)||recordDate(record)!==today)){record.status='expired';record.expiredAt=now;changed=true}}
  for(const item of visible){if(history.some(record=>record.id===item.recommendationId))continue;ensureRecommendationRecord(history,item,{now,idGenerator});changed=true}
  return changed;
}

export function decideRecommendationRecord(history,recommendationId,{accepted,source,feedbackId,now}={}){
  const record=history.find(item=>item.id===recommendationId);if(!record)return null;
  record.status=accepted?'executed':'dismissed';record.source=source||record.source;
  record.executedAt=accepted?now:null;record.dismissedAt=accepted?null:now;record.feedbackId=feedbackId||record.feedbackId;
  return record;
}

export function attachRecommendationSession(history,recommendationId,sessionId){
  const record=history.find(item=>item.id===recommendationId);if(!record)return null;
  record.sessionId=sessionId;return record;
}

export function summarizeRecommendationHistory(history,{today,days=30}={}){
  const cutoff=new Date(`${today}T00:00:00Z`);cutoff.setUTCDate(cutoff.getUTCDate()-(days-1));
  const rows=history.filter(item=>Date.parse(item.createdAt)>=cutoff.getTime());
  const count=status=>rows.filter(item=>item.status===status).length,executed=count('executed');
  return {days,generated:rows.length,executed,dismissed:count('dismissed'),expired:count('expired'),pending:count('pending'),adherence:rows.length?Math.round(executed/rows.length*100):null};
}
