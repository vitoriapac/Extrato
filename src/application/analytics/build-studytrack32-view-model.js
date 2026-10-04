import {buildWeeklyCloseAdherence} from '../adherence/build-weekly-close-adherence.js';
import {buildWeeklyAdherence} from '../adherence/build-weekly-adherence.js';
import {buildSustainabilityModel} from '../planning-sustainability/build-sustainability-model.js';
import {buildTopicGapInputs} from './build-topic-gap-inputs.js';
import {buildSubjectAccuracy} from './build-subject-accuracy.js';
import {resolveSubjectAccuracyTarget} from '../../domain/analytics/subject-accuracy-target.js';
import {buildWeeklyDecisionCycle} from './build-weekly-decision-cycle.js';
import {captureTopicPriorityProfile} from '../../domain/recommendations/topic-priority-profile.js';
const sum=(items,selector)=>items.reduce((total,item)=>total+(Number(selector(item))||0),0);
import {buildWeeklyStrategicFocus} from './build-weekly-strategic-focus.js';
const inRange=(item,start,end)=>Boolean(item?.date&&item.date>=start&&item.date<=end);

export function selectWeeklyPlans(dailyPlans=[],start,end){
  const plans=(Array.isArray(dailyPlans)?dailyPlans:[]).filter(plan=>inRange(plan,start,end));
  const items=plans.flatMap(plan=>(plan.items||[]).map(item=>({...item,date:plan.date})));
  const eligible=items.filter(item=>!['skipped','replaced','discarded'].includes(item.status));
  return {plans:eligible,plannedMinutes:sum(eligible,item=>item.plannedMinutes)};
}

export function buildStudyTrack32ViewModel({today,sessions=[],questions=[],dailyPlans=[],weeklyCloseSnapshots=[],executionSource=null,planAdjustments=[],recommendations=[],simulations=[],subjects=[],activeExamTags=[],weeklyCapacityMinutes=0,targetAccuracy=80,blueprint={},readinessSnapshots=[],readiness=null,algorithmServices={},nameResolvers={}}={}){
  const {addDays,buildWeeklyClose,buildGapMap,buildDecisionHistory,buildPostSimulationReplan,buildCandidates}=algorithmServices;
  const start=addDays(today,-6),previousEnd=addDays(start,-1),previousStart=addDays(start,-7),currentSessions=sessions.filter(item=>inRange(item,start,today)),currentQuestions=questions.filter(item=>inRange(item,start,today)),previousSessions=sessions.filter(item=>inRange(item,previousStart,previousEnd)),previousQuestions=questions.filter(item=>inRange(item,previousStart,previousEnd)),currentPlan=selectWeeklyPlans(dailyPlans,start,today),previousPlan=selectWeeklyPlans(dailyPlans,previousStart,previousEnd);
  const questionTotals=list=>({resolved:sum(list,item=>item.resolved),correct:sum(list,item=>item.correct)}),previousTotals=questionTotals(previousQuestions),hasPrevious=previousSessions.length+previousQuestions.length+previousPlan.plans.length>0,executedMinutes=Math.round(sum(currentSessions,item=>item.durationSeconds)/60),previousExecutedMinutes=Math.round(sum(previousSessions,item=>item.durationSeconds)/60);
  const weeklyClose=buildWeeklyClose({period:{start,end:today},current:{plannedMinutes:currentPlan.plannedMinutes,executedMinutes},previous:hasPrevious?{plannedMinutes:previousPlan.plannedMinutes,executedMinutes:previousExecutedMinutes,resolved:previousTotals.resolved,accuracy:previousTotals.resolved?Math.round(previousTotals.correct/previousTotals.resolved*100):null}:{},plans:currentPlan.plans,sessions:currentSessions,questions:currentQuestions,recommendations,targetAccuracy});
  weeklyClose.adherence=buildWeeklyCloseAdherence({...(executionSource||{dailyPlans,sessions,subjects}),start,end:today,today,activeExamTags,snapshots:weeklyCloseSnapshots});
  weeklyClose.adherence.sustainability=buildSustainabilityModel({today,activeExamTags,snapshots:weeklyCloseSnapshots,
    weeklyAdherence:buildWeeklyAdherence({...(executionSource||{dailyPlans,sessions,subjects}),today,activeExamTags,historyWeeks:4})});
  const adherenceAssessment=weeklyClose.adherence.assessment;
  if(weeklyClose.state==='insufficient'&&(weeklyClose.adherence.model.summary?.plannedMinutes||weeklyClose.adherence.model.summary?.executedMinutes))weeklyClose.state='available';
  if(['time_gap','priority_gap','mixed'].includes(adherenceAssessment.status)){
    weeklyClose.assessment='attention';
    weeklyClose.mainRisk=weeklyClose.mainRisk||{type:'adherence_gap',message:adherenceAssessment.label+'. Confira o crédito das atividades e as prioridades pendentes.'};
    if(weeklyClose.mainRisk.type==='adherence_gap')weeklyClose.recommendedAction='Revisar os blocos pendentes e confirmar uma prévia antes de alterar o planejamento.';
  }
  weeklyClose.subjectAccuracy=buildSubjectAccuracy({subjects,questions:currentQuestions,simulations:simulations.filter(item=>inRange(item,start,today)),blueprint,globalTarget:targetAccuracy});
  const subjectRisk=weeklyClose.subjectAccuracy.find(row=>row.personal.state==='below_target'||row.simulation.state==='below_target');
  if(subjectRisk){weeklyClose.assessment='attention';weeklyClose.mainRisk=weeklyClose.mainRisk||{type:'subject_accuracy_below_target',message:`${subjectRisk.name} está abaixo da meta de acerto de ${subjectRisk.target}%.`};weeklyClose.recommendedAction='Revisar erros e lacunas nas disciplinas abaixo de suas metas de acerto.';}
  const candidates=buildCandidates(),gapRows=buildTopicGapInputs(candidates,{resolveAccuracyTarget:id=>resolveSubjectAccuracyTarget(id,blueprint,targetAccuracy),topicName:nameResolvers.topic,subjectName:nameResolvers.subject}),gapMap=buildGapMap(gapRows,{limit:Number.MAX_SAFE_INTEGER}),decisionHistory=buildDecisionHistory(recommendations,{limit:Number.MAX_SAFE_INTEGER,resolveSubjectName:nameResolvers.subject,resolveTopicName:nameResolvers.topic});
  weeklyClose.strategicFocus=buildWeeklyStrategicFocus({sessions:currentSessions,candidates,recommendations,start,end:today});
  weeklyClose.decisionCycle=buildWeeklyDecisionCycle({close:weeklyClose,start,end:today,previousStart,previousEnd,sessions,dailyPlans,recommendations,simulations,subjects,snapshots:readinessSnapshots,activeExamTags,readiness});
  const latestSimulation=[...simulations].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0],plannedOpen=sum(dailyPlans.flatMap(plan=>plan.items||[]).filter(item=>!['completed','skipped','replaced','discarded'].includes(item.status)),item=>item.plannedMinutes),availableMinutes=Math.max(0,weeklyCapacityMinutes-plannedOpen),postSimulation=buildPostSimulationReplan({simulation:latestSimulation,subjects,availableMinutes,existingSimulationIds:planAdjustments.map(item=>item.simulationId).filter(Boolean)});
  return {period:{start,end:today,previousStart,previousEnd},activeExamTags:[...activeExamTags],topicPriorities:candidates.map(item=>captureTopicPriorityProfile(item,{capturedAt:today,activeExamTags})),weeklyClose,gapMap,decisionHistory,postSimulation:{...postSimulation,availableMinutes}};
}
