import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';
import {normalizeExamTags} from '../../domain/exams/exam-scope.js';
import {SUSTAINABILITY_POLICY as policy} from '../../domain/planning/sustainability-policy.js';

const scope=tags=>Array.isArray(tags)?JSON.stringify(normalizeExamTags(tags).sort()):null;
const finite=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
const percent=value=>finite(value)&&value<=100;
const completeWeek=(period,today)=>period&&parseLocalDate(period.start)?.getDay()===1&&addLocalDays(period.start,6)===period.end&&period.end<today;
export function selectComparableWeeks({today,historyWeeks=4,activeExamTags=[],weeklyAdherence=null,snapshots=[]}={}){
  const date=parseLocalDate(today);if(typeof today!=='string'||!date)return {state:'invalid_period',weeks:[],historyWeeks:4};
  const count=policy.historyWindows.includes(historyWeeks)?historyWeeks:policy.defaultHistoryWeeks;
  const currentMonday=addLocalDays(today,-((date.getDay()+6)%7)),candidates=new Map();
  for(const model of weeklyAdherence?.history||[]){
    if(completeWeek(model.period,today)&&scope(model.activeExamTags)===scope(activeExamTags))candidates.set(model.period.start,{model,assessment:model.assessment,source:'live',frameVersion:1});
  }
  const revisions=new Map();
  for(const snapshot of snapshots){
    if(!completeWeek(snapshot.period,today)||scope(snapshot.activeExamTags)!==scope(activeExamTags))continue;
    const previous=revisions.get(snapshot.period.start);
    const rank=row=>[Number(row.revision)||1,Date.parse(row.savedAt)||0,String(row.id||'')];
    const newer=previous?rank(snapshot):null,older=previous?rank(previous):null;
    if(!previous||newer[0]>older[0]||newer[0]===older[0]&&(newer[1]>older[1]||newer[1]===older[1]&&newer[2]>older[2]))revisions.set(snapshot.period.start,snapshot);
  }
  for(const [start,snapshot] of revisions){const frame=snapshot.weeklyClose?.adherence;
    candidates.set(start,{model:frame?.model,assessment:frame?.assessment,source:'snapshot',snapshotId:snapshot.id,revision:snapshot.revision||1,frameVersion:frame?.version});
  }
  const weeks=Array.from({length:count},(_,index)=>{
    const start=addLocalDays(currentMonday,-7*(count-index)),end=addLocalDays(start,6),candidate=candidates.get(start);
    if(!candidate)return {period:{start,end},comparable:false,reasonCodes:['missing_week'],model:null};
    const model=candidate.model,reasons=[],context=model?.planningContext;
    if(candidate.frameVersion!==1||model?.version!==1||candidate.assessment?.policyVersion!==policy.adherencePolicyVersion||model?.priority?.policyVersion!==policy.priorityPolicyVersion)reasons.push('incompatible_policy');
    if(model?.period?.start!==start||model?.period?.end!==end||model?.period?.evaluatedEnd!==end||model?.period?.complete!==true)reasons.push('incomplete_period');
    if(scope(model?.activeExamTags)!==scope(activeExamTags))reasons.push('scope_mismatch');
    if(!finite(model?.summary?.plannedMinutes)||model.summary.plannedMinutes<=0||!finite(model?.summary?.executedMinutes)||!finite(model?.summary?.matchedMinutes)||!percent(model?.summary?.temporalAdherence)||model?.summary?.matchedMinutes>model?.summary?.plannedMinutes)reasons.push('invalid_execution');
    if(!percent(model?.priority?.adherence)||!finite(model?.priority?.plannedMinutes)||model.priority.plannedMinutes<=0||!finite(model?.priority?.executedMinutes)||model?.priority?.executedMinutes>model?.priority?.plannedMinutes||!percent(model?.priority?.classifiedCoverage)||model.priority.classifiedCoverage<policy.minimumClassifiedCoverage)reasons.push('limited_priority_evidence');
    if(model?.ambiguousItemCount!==0)reasons.push('ambiguous_identity');
    if(context?.version!==1||context?.legacyItems!==0)reasons.push('historical_context_missing');
    if(context?.capacity?.state!=='recorded'||!finite(context.capacity.availableMinutes)||context.capacity.availableMinutes<=0)reasons.push('capacity_unknown');
    if(context?.capacity?.changedWithinPeriod)reasons.push('capacity_changed_within_week');
    return {period:{start,end},...candidate,model:model?structuredClone(model):null,comparable:reasons.length===0,reasonCodes:reasons};
  });
  // A new capacity starts a new comparison cohort; older configured loads remain visible.
  const reference=[...weeks].reverse().find(week=>week.comparable)?.model.planningContext.capacity.availableMinutes??null;
  for(const week of weeks)if(week.comparable&&Math.abs(week.model.planningContext.capacity.availableMinutes-reference)>policy.capacityToleranceMinutes){week.comparable=false;week.reasonCodes.push('different_capacity');}
  return {state:'available',historyWeeks:count,period:{start:weeks[0].period.start,end:weeks.at(-1).period.end},referenceCapacityMinutes:reference,weeks};
}
