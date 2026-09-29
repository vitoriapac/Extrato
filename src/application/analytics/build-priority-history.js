import {captureTopicPriorityProfile,classifyTopicPriority,compareTopicPriority} from '../../domain/recommendations/topic-priority-profile.js';
import {strategicRecordInScope} from './build-strategic-timeline.js';
import {localDateFromTimestamp} from '../../domain/sessions/study-session.js';
const number=value=>value!=null&&Number.isFinite(Number(value))?Number(value):null;
export function buildPriorityHistory({topics=[],candidates=[],recommendationHistory=[],recommendations=[],studyPlans=[],weeklyCloseSnapshots=[],activeExamTags=[],today,subjectId=''}={}){
  const points=[];
  const add=(topicId,profile,time,source,current=false)=>{
    const date=/^\d{4}-\d{2}-\d{2}$/.test(time||'')?time:localDateFromTimestamp(time);
    if(!topicId||!date||date>today||!strategicRecordInScope({...profile,topicId},activeExamTags,topics))return;
    points.push({topicId,profile,date,time:time||date,source,current,sequence:points.length});
  };
  recommendationHistory.forEach(item=>{const profile=item.prioritySnapshot||{version:0,algorithmVersion:item.algorithmVersions?.priority??null,score:number(item.priority),confidence:number(item.evidenceSnapshot?.evidenceStrength),mastery:null,retention:null,examImpact:null,incidence:null,reasons:item.reasons||[],activeExamTags:item.activeExamTags??null};add(item.topicId,profile,profile.capturedAt||item.createdAt,'Recomendação apresentada')});
  recommendations.forEach(item=>{const snapshot=item.snapshot||{},evidence=snapshot.explanationSnapshot?.evidenceSnapshot||{},profile={version:0,algorithmVersion:snapshot.algorithmVersion??null,score:number(snapshot.priorityScore),mastery:number(snapshot.masteryBefore),retention:number(snapshot.retentionBefore),examImpact:number(snapshot.examImpact),incidence:number(evidence.examIntelligence?.presencePercent),confidence:number(snapshot.evidenceBefore?.evidenceStrength??evidence.confidence?.evidenceStrength),reasons:snapshot.reasons||[],activeExamTags:item.activeExamTags??null};add(item.topicId,profile,item.createdAt||item.date,'Decisão registrada')});
  studyPlans.forEach(plan=>(plan.items||[]).forEach(item=>{const snapshot=item.prioritySnapshot;if(!snapshot)return;const profile=snapshot.topicProfile||{version:0,algorithmVersion:snapshot.algorithmVersion??null,score:number(snapshot.score),mastery:number(snapshot.mastery),retention:number(snapshot.retention),examImpact:number(snapshot.examImpact),incidence:null,confidence:number(snapshot.evidence?.evidenceStrength),reasons:snapshot.reasons||[]};add(item.topicId,{...profile,activeExamTags:plan.activeExamTags??profile.activeExamTags??null},snapshot.capturedAt||plan.confirmedAt,'Plano confirmado')}));
  candidates.forEach(item=>add(item.topicId,captureTopicPriorityProfile(item,{capturedAt:today,activeExamTags}),today,'Diagnóstico atual',true));
  weeklyCloseSnapshots.forEach(snapshot=>(snapshot.topicPriorities||[]).forEach(profile=>add(profile.topicId,{...profile,activeExamTags:snapshot.activeExamTags},snapshot.period?.end||snapshot.savedAt,'Fechamento salvo')));
  const rows=[];
  for(const topicId of [...new Set(points.map(item=>item.topicId))]){
    const topic=topics.find(item=>item.id===topicId),selected=points.filter(item=>item.topicId===topicId).sort((a,b)=>a.date.localeCompare(b.date)||Number(a.current)-Number(b.current)||String(a.time).localeCompare(String(b.time))||a.sequence-b.sequence);
    const byDate=new Map();selected.forEach(item=>byDate.set(item.date,item));const observations=[...byDate.values()];
    if(subjectId&&(topic?.subjectId||candidates.find(item=>item.topicId===topicId)?.subjectId)!==subjectId)continue;
    const history=observations.map((item,index)=>({...item,classification:classifyTopicPriority(item.profile),change:compareTopicPriority(observations[index-1]?.profile,item.profile)}));
    const latest=history.at(-1);
    rows.push({topicId,subjectId:topic?.subjectId||null,topicName:topic?.name||latest.profile.topicName||'Tópico removido',subjectName:topic?.subjectName||latest.profile.subjectName||'Disciplina removida',history,state:history.length>1?latest.change.label:'Primeiro registro',score:latest.profile.score});
  }
  rows.sort((a,b)=>(b.score??-1)-(a.score??-1)||a.topicName.localeCompare(b.topicName));
  return {rows,subjectId,subjects:[...new Map(topics.filter(item=>item.subjectId).map(item=>[item.subjectId,{id:item.subjectId,name:item.subjectName||'Disciplina'}])).values()]};
}
