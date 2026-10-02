import {dailyActivityType,dailyItemEligible} from './reconcile-daily-execution.js';

// Preserve the confirmed plan order; only contextualize the existing next best action.
export function buildDailyPriority({items=[],nextBestAction=null,todaySessions=[],subjects=[],activeExamTags=[]}={}){
  const proposed=nextBestAction?.action;
  const action=proposed&&dailyItemEligible({...proposed,type:proposed.activityType},subjects,activeExamTags)?structuredClone(proposed):null;
  const matches=(record)=>action&&record.subjectId===action.subjectId&&record.topicId===action.topicId&&dailyActivityType(record.type)===dailyActivityType(action.activityType);
  const pending=items.filter(item=>item.remainingSeconds>0),planned=action?pending.find(matches):null;
  const linkedSessions=action?todaySessions.filter(session=>matches(session)&&action.recommendationId&&session.recommendationId===action.recommendationId):[];
  const minutes=linkedSessions.reduce((sum,session)=>sum+Math.max(0,Number(session.durationSeconds)||0)/60,0);
  const completedItem=action?items.find(item=>matches(item)&&item.remainingSeconds===0&&item.executedSeconds>0):null;
  const threshold=Number(action?.suggestedMinutes);
  const executed=Boolean(action&&(completedItem||linkedSessions.length&&minutes>0&&(!Number.isFinite(threshold)||threshold<=0||minutes>=threshold)));
  return {action,executed,executedMinutes:minutes,planned:Boolean(planned||completedItem),
    nextItem:planned||pending[0]||null,following:pending.filter(item=>item.id!==(planned||pending[0])?.id),
    unplannedAction:action&&!planned&&!completedItem&&!executed?action:null,
    reasons:[...(nextBestAction?.reasons||action?.reasons||[])].slice(0,3)};
}
