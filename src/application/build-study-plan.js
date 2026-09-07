import {calculatePriorityScore} from '../domain/analytics/priority-score.js';
import {describeScoreEvidence} from '../domain/analytics/score-evidence.js';
import {canStudy,needsMaintenance,sessionMinutes,resolveStudyEligibility} from '../domain/study-eligibility.js';

const positive=value=>Number.isFinite(Number(value))&&Number(value)>0?Math.round(Number(value)):0;

export function buildStudyPlan({topics=[],weeklyAvailableMinutes=0,weeksUntilExam=0,prerequisiteTopics}={}){
  const candidates=resolveStudyEligibility(topics,prerequisiteTopics);
  const active=candidates.filter(item=>item&&!item.archived&&(!item.completed||item.covered)&&(!item.covered||needsMaintenance(item)));
  const blockedTopics=active.filter(item=>item.blockedPrerequisites?.length).map(item=>({id:item.id,topicName:item.topicName,prerequisites:item.blockedPrerequisites}));
  const effort=item=>item.covered?sessionMinutes(item,60):positive(item.remainingMinutes??item.estimatedMinutes);
  const missingEffort=active.filter(item=>!item.covered&&(item.remainingMinutes??item.estimatedMinutes)==null).map(item=>item.id);
  const configured=active.filter(item=>effort(item)>0&&canStudy(item,{ignoreToday:true}));
  const availability=positive(weeklyAvailableMinutes),weeks=Math.max(0,Math.ceil(Number(weeksUntilExam)||0));
  const remainingMinutes=active.filter(item=>!item.covered).reduce((sum,item)=>sum+effort(item),0);
  const maintenanceMinutes=configured.filter(item=>item.covered).reduce((sum,item)=>sum+effort(item),0);
  const weeklyNeedMinutes=weeks>0?Math.ceil(remainingMinutes/weeks)+maintenanceMinutes:null;
  const weeklyBalanceMinutes=weeklyNeedMinutes===null?null:availability-weeklyNeedMinutes;
  const paceState=weeklyBalanceMinutes===null?'insufficient':weeklyBalanceMinutes<0?'deficit':weeklyBalanceMinutes>0?'surplus':'balanced';
  const base={weeklyAvailableMinutes:availability,weeksUntilExam:weeks,remainingMinutes,maintenanceMinutes,weeklyNeedMinutes,weeklyBalanceMinutes,paceState,missingEffort,blockedTopics};
  if(!configured.length||availability<=0||weeks<=0)return {...base,state:'insufficient',items:[],subjects:[],activityMix:{theory:0,questions:0,reviews:0},confidence:0};
  const weeklyBudget=Math.min(availability,weeklyNeedMinutes);
  const scored=configured.map(item=>({...item,...calculatePriorityScore(item),capacityMinutes:effort(item)})).sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id)));
  const totalScore=scored.reduce((sum,item)=>sum+Math.max(1,item.score),0);
  const allocations=new Map(scored.map(item=>[item.id,Math.min(item.capacityMinutes,Math.floor(weeklyBudget*Math.max(1,item.score)/totalScore))]));
  let unallocated=weeklyBudget-[...allocations.values()].reduce((sum,value)=>sum+value,0);
  for(const item of scored){
    if(unallocated<=0)break;
    const current=allocations.get(item.id),extra=Math.min(item.capacityMinutes-current,unallocated);
    allocations.set(item.id,current+extra);unallocated-=extra;
  }
  const items=scored.map(item=>{
    const minutes=allocations.get(item.id)||0;
    const retentionNeed=item.retentionRisk??item.retentionNeed;
    const reviewShare=item.covered?(retentionNeed>=40||item.reviewUrgency>=40?.6:.3):(retentionNeed>=60?.35:.20);
    const reviews=item.covered&&minutes>=30?Math.max(15,Math.min(minutes-15,Math.round(minutes*reviewShare))):Math.round(minutes*reviewShare);
    const questions=item.covered?minutes-reviews:Math.min(minutes-reviews,Math.round(minutes*(item.masteryGap>=60?.40:.30)));
    const activityMix={theory:minutes-reviews-questions,questions,reviews};
    // Avoid creating fragments that the daily distributor cannot schedule.
    const largest=Object.keys(activityMix).sort((a,b)=>activityMix[b]-activityMix[a])[0];
    for(const key of Object.keys(activityMix))if(key!==largest&&activityMix[key]>0&&activityMix[key]<15){activityMix[largest]+=activityMix[key];activityMix[key]=0;}
    return {...item,minutes,activityMix};
  }).filter(item=>item.minutes>0);
  const subjectMap=new Map();
  items.forEach(item=>{const current=subjectMap.get(item.subjectId)||{subjectId:item.subjectId,subjectName:item.subjectName,minutes:0};current.minutes+=item.minutes;subjectMap.set(item.subjectId,current)});
  const activityMix=items.reduce((sum,item)=>({theory:sum.theory+item.activityMix.theory,questions:sum.questions+item.activityMix.questions,reviews:sum.reviews+item.activityMix.reviews}),{theory:0,questions:0,reviews:0});
  const coverage=active.length?configured.length/active.length:0;
  const strategicCoverage=configured.filter(item=>item.examImpact!=null).length/configured.length;
  const confidence=Math.round((coverage*.65+strategicCoverage*.35)*100)/100;
  const measured=configured.filter(item=>item.evidenceStrength!=null);
  const evidence=describeScoreEvidence({completeness:confidence,evidenceStrength:measured.length?measured.reduce((sum,item)=>sum+item.evidenceStrength,0)/configured.length:null});
  return {...base,maintenanceMinutes:items.filter(item=>item.covered).reduce((sum,item)=>sum+item.minutes,0),state:confidence>=.75?'ready':'estimated',weeklyPlannedMinutes:items.reduce((sum,item)=>sum+item.minutes,0),items,subjects:[...subjectMap.values()].sort((a,b)=>b.minutes-a.minutes),activityMix,confidence,confidenceLabel:evidence.completenessLabel,evidence};
}
