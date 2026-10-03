import {strategicScopeKey} from './build-strategic-timeline.js';
export const WEEKLY_CLOSE_SNAPSHOT_VERSION=3;
export function createWeeklyCloseSnapshot(model,{savedAt,id,examPhase=null}={}){
  if(!model?.period||model.weeklyClose?.state==='insufficient')return null;
  return {id,period:{...model.period},activeExamTags:Array.isArray(model.activeExamTags)?[...model.activeExamTags]:null,savedAt,examPhase:examPhase?.state&&examPhase.state!=='undated'?{state:examPhase.state,label:examPhase.label}:null,version:WEEKLY_CLOSE_SNAPSHOT_VERSION,algorithmVersion:model.weeklyClose.algorithmVersion,weeklyClose:structuredClone(model.weeklyClose),gapMap:structuredClone(model.gapMap),decisionHistory:structuredClone(model.decisionHistory),comparisonMetrics:structuredClone(model.comparisonMetrics||null),topicPriorities:structuredClone(model.topicPriorities||[])};
}
const content=snapshot=>JSON.stringify([snapshot.period,strategicScopeKey(snapshot.activeExamTags),snapshot.weeklyClose,snapshot.gapMap,snapshot.decisionHistory,snapshot.comparisonMetrics??null,snapshot.topicPriorities??[],snapshot.priorityDecisions??null,Boolean(snapshot.appliedAt)]);
// Existing callers keep this name; changed content now appends a version.
export function upsertWeeklyCloseSnapshot(list,snapshot){
  if(!snapshot||list.some(item=>item.id===snapshot.id))return false;
  const same=list.filter(item=>item.period?.start===snapshot.period?.start&&item.period?.end===snapshot.period?.end&&strategicScopeKey(item.activeExamTags)===strategicScopeKey(snapshot.activeExamTags));
  const previous=same.at(-1);if(previous&&content(previous)===content(snapshot))return false;
  const revision=Math.max(0,...same.map(item=>Number(item.revision)||1))+1;
  list.push({...structuredClone(snapshot),revision,previousSnapshotId:previous?.id||null});return true;
}
