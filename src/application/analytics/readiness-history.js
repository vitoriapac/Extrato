import {calculateReadinessScore,READINESS_WEIGHTS} from '../../domain/analytics/readiness-score.js';
import {isTopicInExamScope,isSimulationInExamScope,normalizeExamTags} from '../../domain/exams/exam-scope.js';
import {addLocalDays} from '../../core/date-utils.js';

export const READINESS_SNAPSHOT_VERSION=2;
const clamp=value=>Math.max(0,Math.min(100,Math.round(value)));
const factor=(raw,confidence,available=true)=>({available,score:available?clamp(50+(raw-50)*confidence):50,confidence:available?Math.min(1,confidence):0});
const scopeKey=tags=>JSON.stringify(normalizeExamTags(tags));

export function createReadinessSnapshot({id,date,activeExamTags=[],metrics,savedAt,captureKind='weekly-close',eventKey=null,reason=null}={}){
  const result=calculateReadinessScore(metrics,READINESS_WEIGHTS);
  if(!date||result.value==null)return null;
  return {id,date,savedAt:savedAt||`${date}T23:59:59.000Z`,activeExamTags:normalizeExamTags(activeExamTags),score:result.value,confidence:result.confidence,confidenceLabel:result.confidenceLabel,factors:{...result.factors},weights:{...READINESS_WEIGHTS},algorithmVersion:result.algorithmVersion,version:READINESS_SNAPSHOT_VERSION,captureKind,eventKey,reason:reason||(captureKind==='weekly-close'?'Fechamento semanal':'Antes de alteração estratégica')};
}

export function upsertReadinessSnapshot(list,snapshot){
  if(!snapshot)return false;
  const weekly=!snapshot.captureKind||snapshot.captureKind==='weekly-close';
  const index=list.findIndex(item=>scopeKey(item.activeExamTags)===scopeKey(snapshot.activeExamTags)&&(weekly?item.date===snapshot.date&&(!item.captureKind||item.captureKind==='weekly-close'):snapshot.eventKey?item.eventKey===snapshot.eventKey:item.id===snapshot.id));
  if(index>=0)return false;
  list.push(structuredClone(snapshot));list.sort((a,b)=>a.date.localeCompare(b.date)||String(a.savedAt||'').localeCompare(String(b.savedAt||'')));return true;
}

export function readinessHistoryForScope(snapshots=[],activeExamTags=[],start=null,end=null){
  const key=scopeKey(activeExamTags);
  return snapshots.filter(item=>scopeKey(item.activeExamTags)===key&&(!start||item.date>=start)&&(!end||item.date<=end)).sort((a,b)=>a.date.localeCompare(b.date)||String(a.savedAt||'').localeCompare(String(b.savedAt||'')));
}

// Historical inputs are cut off at `date`; later activity cannot change an existing snapshot.
export function buildHistoricalReadinessMetrics({subjects=[],sessions=[],questions=[],reviews=[],simulations=[],dailyHours={},date,activeExamTags=[]}={}){
  const topics=subjects.flatMap(subject=>(subject.topics||[]).filter(topic=>!topic.archived&&isTopicInExamScope(topic,activeExamTags)).map(topic=>({...topic,subjectId:subject.id})));
  const topicIds=new Set(topics.map(topic=>topic.id));
  const eligibleQuestions=questions.filter(item=>item.date<=date&&topicIds.has(item.topicId));
  const eligibleSessions=sessions.filter(item=>item.date<=date&&topicIds.has(item.topicId));
  const eligibleReviews=reviews.filter(item=>item.date<=date&&topicIds.has(item.topicId));
  const eligibleSimulations=simulations.filter(item=>item.date<=date&&isSimulationInExamScope(item,activeExamTags)).sort((a,b)=>a.date.localeCompare(b.date)).slice(-5);
  const completed=topics.filter(item=>item.firstCompletedAt?.slice(0,10)<=date).length;
  const coverage=factor(topics.length?completed/topics.length*100:50,Math.min(1,topics.length/40*.55+subjects.length/5*.45),topics.length>0);
  const resolved=eligibleQuestions.reduce((sum,item)=>sum+(Number(item.resolved)||0),0),correct=eligibleQuestions.reduce((sum,item)=>sum+(Number(item.correct)||0),0);
  const mastery=factor(resolved?correct/resolved*100:50,Math.min(1,resolved/300),resolved>0);
  const due=eligibleReviews.length,reviewed=eligibleReviews.filter(item=>item.status==='Concluído'&&item.completedAt?.slice(0,10)<=date).length;
  const retention=factor(due?reviewed/due*100:50,Math.min(1,due/10),due>0);
  const start=addLocalDays(date,-27),recent=eligibleSessions.filter(item=>item.date>=start);
  const byDay=new Map();for(const item of recent)byDay.set(item.date,(byDay.get(item.date)||0)+(Number(item.durationSeconds)||0));
  let scheduled=0,achieved=0;for(let offset=0;offset<28;offset++){const day=addLocalDays(start,offset),weekday=new Date(`${day}T12:00:00Z`).getUTCDay(),target=(Number(dailyHours[String(weekday)])||0)*3600;if(target>0){scheduled++;if((byDay.get(day)||0)>=target)achieved++}}
  const consistency=factor(scheduled?achieved/scheduled*100:50,Math.min(1,byDay.size/14),scheduled>0&&byDay.size>0);
  const simulationTotal=eligibleSimulations.reduce((sum,item)=>sum+(Number(item.total)||0),0),simulationCorrect=eligibleSimulations.reduce((sum,item)=>sum+(Number(item.correct)||0),0);
  const simulationConfidence=Math.min(1,eligibleSimulations.length/4*.7+simulationTotal/300*.3);
  const simulationFactor=factor(simulationTotal?simulationCorrect/simulationTotal*100:50,simulationConfidence,simulationTotal>0);
  return {coverage,mastery,retention,consistency,simulations:simulationFactor};
}
