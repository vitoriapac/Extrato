import {parseLocalDate} from '../../core/date-utils.js';
import {classifyEvidenceScope} from '../../domain/exams/exam-evidence-scope.js';
import {buildStrategicExecution} from '../goals/build-strategic-execution.js';
import {buildAdherenceSummary} from './build-adherence-summary.js';
import {buildPriorityAdherence} from './build-priority-adherence.js';
import {buildSubjectAdherence} from './build-subject-adherence.js';

export function buildAdherenceModel({start,end,today=end,dailyPlans=[],sessions=[],subjects=[],activeExamTags=[]}={}){
  if(![start,end,today].every(date=>typeof date==='string'&&parseLocalDate(date))||start>end)return {state:'invalid_period',period:null,summary:null,priority:null,subjects:[],items:[]};
  const evaluatedEnd=end<today?end:today;
  // Archiving governs new actions, not the interpretation of past activity.
  const historicalSubjects=subjects.map(subject=>({...subject,archived:false,topics:(subject.topics||[]).map(topic=>({...topic,archived:false}))}));
  const included=record=>classifyEvidenceScope(record,historicalSubjects,activeExamTags).includedInExamMetrics;
  const scopedPlans=dailyPlans.filter(plan=>Array.isArray(plan.activeExamTags)?included({examScope:plan.activeExamTags}):true).map(plan=>{
    const items=(plan.items||[]).filter(item=>{
      const snapshot=item.executionSnapshot;
      return included(snapshot?.version===1?{...snapshot,examScope:snapshot.activeExamTags}:item);
    });
    // A filtered plan is not a legacy aggregate: never restore its original total.
    return {...plan,items,plannedMinutes:plan.items?.length&&!items.length?0:plan.plannedMinutes};
  });
  const execution=buildStrategicExecution({start,end:evaluatedEnd,today,dailyPlans:scopedPlans,sessions:sessions.filter(included),subjects});
  return {version:1,state:execution.reconciliation.plannedMinutes>0?'ready':'unplanned',activeExamTags:[...activeExamTags],
    period:{start,end,evaluatedEnd: evaluatedEnd<start?null:evaluatedEnd,complete:end<today},
    summary:buildAdherenceSummary(execution),priority:buildPriorityAdherence(execution.reconciliation),
    subjects:buildSubjectAdherence(execution),items:execution.reconciliation.items};
}
