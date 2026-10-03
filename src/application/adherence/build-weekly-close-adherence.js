import {buildAdherenceModel} from './build-adherence-model.js';
import {buildAdherenceTarget} from './adherence-target.js';
import {adherenceStatus,ADHERENCE_STATUS_POLICY} from './adherence-status.js';
import {buildRecurringPriorities,savedAdherencePeriods} from './build-recurring-priorities.js';

export function buildWeeklyCloseAdherence({snapshots=[],...input}={}){
  const model=buildAdherenceModel(input),frame={version:1,model,assessment:adherenceStatus(model),policy:{...ADHERENCE_STATUS_POLICY},personalTarget:buildAdherenceTarget(model,input.adherenceTarget)};
  return {...frame,recurring:buildRecurringPriorities({current:frame,snapshots,subjects:input.subjects||[],activeExamTags:input.activeExamTags||[]})};
}
export function buildAdherenceCloseHistory(input){
  return savedAdherencePeriods(input).map(snapshot=>({id:snapshot.id,revision:snapshot.revision||1,period:{...snapshot.period},adherence:structuredClone(snapshot.weeklyClose.adherence)}));
}
