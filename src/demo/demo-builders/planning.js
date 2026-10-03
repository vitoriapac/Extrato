import {addLocalDays} from '../../core/date-utils.js';
import {buildAdaptivePlanningAdvice} from '../../domain/planning/adaptive-planning.js';
import {freezePlanExecution} from '../../domain/planning/plan-execution-snapshot.js';
import {EXAM_TAGS} from '../../domain/exams/exam-constants.js';

const stamp=date=>`${date}T12:00:00.000Z`;
const subjectByName=(subjects,name)=>subjects.find(item=>item.name===name);

export function buildDemoPlanning(scenario,{today,subjects,examDate,sessions=[],candidates=[]}){
  const goals=scenario.goals;
  const sessionsByDate=new Map();
  for(const session of sessions){if(!sessionsByDate.has(session.date))sessionsByDate.set(session.date,session)}
  const metas={semanal:goals.weeklyHours,mensal:goals.monthlyHours,questoesSemanal:goals.weeklyQuestions,simuladosSemanal:goals.weeklySimulations,metaAprovacao:goals.targetScorePct,consistenciaSemanal:5,horasDiarias:goals.weeklyHours/7,horasPorDia:{'0':1,'1':2,'2':2,'3':2,'4':2,'5':2,'6':1}};
  const dailyPlans=goals.history.flatMap((week,index)=>{
    const weekStart=addLocalDays(today,-(goals.history.length-index+1)*7),dailyBase=Math.floor(week.plannedMinutes/6),remainder=week.plannedMinutes-dailyBase*6;
    return Array.from({length:6},(_,day)=>{
      const date=addLocalDays(weekStart,day),session=sessionsByDate.get(date),subject=subjects.find(item=>item.id===session?.subjectId)||subjects[(index*3+day)%subjects.length],topic=subject.topics.find(item=>item.id===session?.topicId)||subject.topics[(index+day)%subject.topics.length],plannedMinutes=dailyBase+(day===5?remainder:0);
      return {id:`demo-historic-plan-${index+1}-${day+1}`,date,availableMinutes:120,plannedMinutes,flexMinutes:Math.max(0,120-plannedMinutes),createdAt:stamp(date),updatedAt:stamp(date),items:[{id:`demo-historic-plan-item-${index+1}-${day+1}`,subjectId:subject.id,topicId:topic.id,type:session?.type||'study',plannedMinutes,executedSeconds:0,status:'planned',sessionIds:[],originalDate:date,currentDate:date,rescheduleCount:0,skippedReason:null,recommendationId:null,lastExecutedAt:null}]};
    });
  });
  for(let index=0;index<8;index++){
    const date=addLocalDays(today,index),first=subjects[(index*2)%subjects.length],second=subjects[(index*2+1)%subjects.length];
    const items=[first,second].map((subject,itemIndex)=>({id:`demo-plan-item-${index+1}-${itemIndex+1}`,subjectId:subject.id,topicId:subject.topics[0].id,type:itemIndex?'questions':'study',plannedMinutes:itemIndex?35:45,executedSeconds:0,status:'planned',originalDate:date,currentDate:date,rescheduleCount:0,skippedReason:null,recommendationId:null,lastExecutedAt:null}));
    dailyPlans.push({id:`demo-daily-plan-${index+1}`,date,availableMinutes:120,plannedMinutes:80,flexMinutes:40,createdAt:stamp(date),updatedAt:stamp(date),items});
  }
  // Scripted decisions captured at creation, not retrospective scores from today's evidence.
  for(const plan of dailyPlans)for(const [index,item] of plan.items.entries()){
    item.prioritySnapshot={priority:index===0,source:'demo-scripted',capturedAt:stamp(plan.date)};
    freezePlanExecution(item,{date:plan.date,capturedAt:stamp(plan.date),activeExamTags:[EXAM_TAGS.BB,EXAM_TAGS.CAIXA]});
  }
  const source=subjectByName(subjects,scenario.adaptivePlanning.example.from),target=subjectByName(subjects,scenario.adaptivePlanning.example.to);
  const example=scenario.adaptivePlanning.example,otherCount=subjects.length-2,otherBudget=scenario.adaptivePlanning.capacityMinutes-example.sourceBeforeMinutes-example.targetBeforeMinutes,otherBase=Math.floor(otherBudget/otherCount),otherExtra=otherBudget%otherCount;
  const strategicTopicId=role=>scenario.subjects.flatMap(subject=>subject.topics).find(topic=>topic.narrativeRole===role)?.id;
  let otherIndex=0;
  const planItems=subjects.map((subject,index)=>{const minutes=subject.id===source?.id?example.sourceBeforeMinutes:subject.id===target?.id?example.targetBeforeMinutes:otherBase+(otherIndex++<otherExtra?1:0),topic=subject.topics.find(item=>item.id===(subject.id===target?.id?strategicTopicId('priority_gap'):subject.id===source?.id?strategicTopicId('consolidated'):null))||subject.topics[0];return{id:`demo-study-plan-topic-${index+1}`,subjectId:subject.id,subjectName:subject.name,topicId:topic.id,topicName:topic.name,minutes,capacityMinutes:minutes+40,covered:topic.status==='Concluído',estimatedMinutes:topic.estimatedStudyMinutes,activityMix:{theory:Math.round(minutes*.5),questions:Math.round(minutes*.4),reviews:minutes-Math.round(minutes*.5)-Math.round(minutes*.4)}}});
  const planned=planItems.reduce((sum,item)=>sum+item.minutes,0);
  const studyPlans=[{id:'demo-study-plan-1',state:'ready',confirmedAt:stamp(addLocalDays(today,-9)),examDate,weeklyAvailableMinutes:scenario.adaptivePlanning.capacityMinutes,weeklyPlannedMinutes:planned,weeksUntilExam:13,remainingMinutes:6200,missingEffort:[],items:planItems,subjects:planItems.map(item=>({subjectId:item.subjectId,subjectName:item.subjectName,minutes:item.minutes})),activityMix:{theory:360,questions:288,reviews:72},confidence:.84,confidenceLabel:'Alta',algorithmVersion:1}];
  const advice=buildAdaptivePlanningAdvice({plan:studyPlans[0],candidates,history:[],today});
  const sourceItem=planItems.find(item=>item.subjectId===advice.from?.subjectId),targetItem=planItems.find(item=>item.subjectId===advice.to?.subjectId);
  const adaptivePlanningHistory=advice.state==='proposal'?[{id:'demo-adaptive-1',createdAt:stamp(today),decidedAt:null,status:'suggested',sourceSubjectId:advice.from.subjectId,targetSubjectId:advice.to.subjectId,sourceTopicId:sourceItem?.topicId||null,targetTopicId:targetItem?.topicId||null,sourceBefore:advice.from.beforeMinutes,sourceAfter:advice.from.afterMinutes,targetBefore:advice.to.beforeMinutes,targetAfter:advice.to.afterMinutes,minutes:advice.transferMinutes,reasons:[...advice.rationale],evidenceSnapshot:{source:candidates.filter(item=>item.subjectId===advice.from.subjectId).map(item=>({topicId:item.topicId,mastery:item.mastery,examImpact:item.examImpact,evidenceStrength:item.evidenceStrength})),target:candidates.filter(item=>item.subjectId===advice.to.subjectId).map(item=>({topicId:item.topicId,mastery:item.mastery,examImpact:item.examImpact,evidenceStrength:item.evidenceStrength})),weeklyBudgetMinutes:advice.weeklyBudgetMinutes},algorithmVersion:advice.algorithmVersion,planId:studyPlans[0].id}]:[];
  return {metas,dailyPlans,studyPlans,adaptivePlanningHistory};
}
