import {adherencePercent} from './build-adherence-summary.js';

// Policy 1 reuses the frozen priority flag; it introduces no ranking or score.
export function buildPriorityAdherence({items=[],plannedMinutes=0,priorityPlannedMinutes=0,priorityCreditedMinutes=0,unknownPlannedMinutes=0}={}){
  const priorities=items.filter(item=>item.priority===true&&item.plannedMinutes>0);
  const equivalent=priorities.reduce((sum,item)=>sum+item.completion,0);
  return {policyVersion:1,policy:'frozen-priority-minutes',plannedMinutes:priorityPlannedMinutes,executedMinutes:priorityCreditedMinutes,
    adherence:adherencePercent(priorityCreditedMinutes,priorityPlannedMinutes),
    plannedActivities:priorities.length,completedActivities:priorities.filter(item=>item.completion===1).length,
    partiallyExecutedActivities:priorities.filter(item=>item.completion>0&&item.completion<1).length,
    equivalentExecutedActivities:equivalent,activityAdherence:adherencePercent(equivalent,priorities.length),
    classifiedCoverage:adherencePercent(plannedMinutes-unknownPlannedMinutes,plannedMinutes),unknownPlannedMinutes};
}
