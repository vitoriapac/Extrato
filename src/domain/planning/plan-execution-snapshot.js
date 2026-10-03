import {normalizeExamTags} from '../exams/exam-scope.js';

// Capture only at creation/confirmation. Legacy activities remain explicitly unknown.
export function capturePlanExecution(item,{date=null,activeExamTags=[],capturedAt=null,studyPlanId=item.studyPlanId||null,originItemId=null}={}){
  return {version:1,capturedAt,date,subjectId:item.subjectId||null,topicId:item.topicId||null,
    type:item.type||null,plannedMinutes:Math.max(0,Number(item.plannedMinutes)||0),
    activeExamTags:normalizeExamTags(activeExamTags),studyPlanId,
    originItemId:originItemId||item.id||null,prioritySnapshot:item.prioritySnapshot?structuredClone(item.prioritySnapshot):null};
}
export function freezePlanExecution(item,context){
  if(!item.executionSnapshot)item.executionSnapshot=capturePlanExecution(item,context);
  return item;
}
export function historicalExecutionItem(item){
  const snapshot=item.executionSnapshot;
  if(snapshot?.version!==1)return item;
  return {...item,subjectId:snapshot.subjectId,topicId:snapshot.topicId,type:snapshot.type,
    plannedMinutes:Math.max(0,snapshot.plannedMinutes-(Number(item.transferredMinutes)||0)),prioritySnapshot:snapshot.prioritySnapshot};
}
