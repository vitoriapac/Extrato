import {createDefaultState} from '../state/defaults.js';
import {addLocalDays} from '../core/date-utils.js';
import scenario from './demo-scenario.json' with {type:'json'};
import {assertDemoScenario} from './demo-scenario-validator.js';
import {buildDemoSubjects} from './demo-builders/subjects.js';
import {buildDemoStudyHistory} from './demo-builders/study-history.js';
import {EXAM_TAGS} from '../domain/exams/exam-constants.js';
import {buildDemoSimulations,addDemoEssays,buildDemoReviews} from './demo-builders/assessments.js';

export const DEMO_SCENARIO=Object.freeze({days:scenario.meta.historyDays,subjects:scenario.targets.subjects,topics:scenario.targets.topics,sessions:scenario.targets.studySessions,questions:scenario.targets.studyQuestions,simulations:scenario.targets.simulations,seed:scenario.meta.seed});

function hashSeed(value){let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return hash>>>0}
function randomFactory(seed){let value=hashSeed(seed)||1;return()=>{value+=0x6D2B79F5;let next=value;next=Math.imul(next^next>>>15,next|1);next^=next+Math.imul(next^next>>>7,next|61);return((next^next>>>14)>>>0)/4294967296}}
function shiftDate(iso,days){return addLocalDays(iso,days)}
function timestamp(date,hour=12){return `${date}T${String(hour).padStart(2,'0')}:00:00.000Z`}
export function generateDemoData({seed=DEMO_SCENARIO.seed,today,demoScenario=scenario}={}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(today||'')) throw new TypeError('A demonstração requer a data local atual.');
  assertDemoScenario(demoScenario);
  const oldestAge=demoScenario.meta.historyDays-1;
  const random=randomFactory(`${seed}:${today}`),state=createDefaultState(),createdAt=timestamp(shiftDate(today,-oldestAge));
  state.subjects=buildDemoSubjects(demoScenario,{createdAt,random});
  const activeTopics=state.subjects.flatMap(subject=>subject.topics.filter(topic=>!topic.archived).map(topic=>({subject,topic})));
  const history=buildDemoStudyHistory(demoScenario,{today,subjects:state.subjects,random});
  state.studySessions=history.studySessions;state.questoes=history.questoes;
  addDemoEssays(demoScenario,{today,subjects:state.subjects,sessions:state.studySessions});
  state.simulados=buildDemoSimulations(demoScenario,{today,subjects:state.subjects});
  state.reviewAgenda=buildDemoReviews(demoScenario,{today,subjects:state.subjects});
  state.calendar=Array.from({length:24},(_,index)=>{const entry=activeTopics[(index*3)%activeTopics.length],date=shiftDate(today,index-6);return{id:`demo-calendar-${index+1}`,date,week:'',subjectId:entry.subject.id,topicId:entry.topic.id,subject:entry.subject.name,topic:entry.topic.name,status:index<4?'Concluído':'Não iniciado',reviewType:index%2?'Questões':'Revisão rápida',createdAt:timestamp(shiftDate(date,-5))}});
  const completedDates=state.subjects.flatMap(subject=>subject.topics.map(topic=>topic.firstCompletedAt?.slice(0,10)).filter(Boolean));
  state.progressHistory=Array.from({length:DEMO_SCENARIO.days},(_,index)=>{const date=shiftDate(today,index-oldestAge);return {date,pct:Math.round(completedDates.filter(value=>value<=date).length/activeTopics.length*100)}});
  // O cenário demonstrativo precisa oferecer uma recomendação em qualquer dia
  // em que os testes ou a pessoa abram a aplicação, inclusive aos domingos.
  state.metas={semanal:12,mensal:48,questoesSemanal:220,simuladosSemanal:1,metaAprovacao:80,horasDiarias:2.2,horasPorDia:{'0':1,'1':2.5,'2':2.5,'3':2,'4':2.5,'5':2,'6':1}};
  state.examDate=shiftDate(today,90);state.examBlueprint={examDate:state.examDate,targetScore:80,activeExamTags:[EXAM_TAGS.BB,EXAM_TAGS.CAIXA],configuredAt:timestamp(today),subjects:state.subjects.map((subject,index)=>({subjectId:subject.id,expectedQuestions:index<4?18:14,questionWeight:index===2?1.5:1,priority:index<2?'high':index===5?'low':'normal'}))};
  state.metasPorDisciplina=state.subjects.map((subject,index)=>({id:`demo-subject-goal-${index+1}`,subjectId:subject.id,meta:30+index*5,createdAt}));
  state.dailyPlans=Array.from({length:14},(_,index)=>{const date=shiftDate(today,index-6),entryA=activeTopics[(index*2)%activeTopics.length],entryB=activeTopics[(index*2+1)%activeTopics.length],past=index<6;const items=[entryA,entryB].map((entry,itemIndex)=>({id:`demo-plan-item-${index+1}-${itemIndex+1}`,subjectId:entry.subject.id,topicId:entry.topic.id,type:itemIndex?'questions':'study',plannedMinutes:itemIndex?35:45,executedSeconds:past?(itemIndex?2100:1800):0,status:past?(itemIndex?'completed':'partial'):'planned',originalDate:date,currentDate:date,rescheduleCount:index===5&&itemIndex===0?1:0,skippedReason:null,recommendationId:null,lastExecutedAt:past?timestamp(date):null}));return{id:`demo-daily-plan-${index+1}`,date,availableMinutes:120,plannedMinutes:80,flexMinutes:40,createdAt:timestamp(date),updatedAt:timestamp(date),items}});
  const planItems=activeTopics.slice(0,12).map((entry,index)=>({id:`demo-study-plan-topic-${index+1}`,subjectId:entry.subject.id,subjectName:entry.subject.name,topicId:entry.topic.id,topicName:entry.topic.name,minutes:45+index%3*15,estimatedMinutes:entry.topic.estimatedStudyMinutes,activityMix:{theory:20,questions:20,reviews:5}}));
  state.studyPlans=[{id:'demo-study-plan-1',state:'ready',confirmedAt:timestamp(shiftDate(today,-9)),examDate:state.examDate,weeklyAvailableMinutes:900,weeklyPlannedMinutes:planItems.reduce((sum,item)=>sum+item.minutes,0),weeksUntilExam:13,remainingMinutes:6200,missingEffort:[],items:planItems,subjects:state.subjects.map(subject=>({subjectId:subject.id,subjectName:subject.name,minutes:120})),activityMix:{theory:300,questions:300,reviews:120},confidence:.84,confidenceLabel:'Alta',algorithmVersion:1}];
  state.planAdjustments=[{id:'demo-adjustment-1',periodStart:shiftDate(today,-7),periodEnd:shiftDate(today,7),plannedMinutes:480,executedMinutes:350,deficitMinutes:130,redistributedMinutes:100,discardedMinutes:30,allocations:[{date:shiftDate(today,1),minutes:50},{date:shiftDate(today,2),minutes:50}],confirmedAt:timestamp(shiftDate(today,-1)),status:'confirmed'}];
  state.recommendationFeedback=Array.from({length:6},(_,index)=>({id:`demo-feedback-${index+1}`,recommendationId:`demo-recommendation-${index+1}`,date:shiftDate(today,-index*5),subjectId:state.subjects[index%state.subjects.length].id,topicId:activeTopics[index].topic.id,accepted:index!==4,completed:index<3,useful:index<3?index!==2:null,reasonSkipped:index===4?'Preferiu outra disciplina':null,resultingSessionId:index<3?state.studySessions[index].id:null,baseline:{accuracy:52+index*3,questionVolume:24+index*4,retentionScore:45+index*2,daysSinceContact:8-index,measuredAt:timestamp(shiftDate(today,-index*5))},outcome:index<3?{accuracyAfter:64+index*3,questionVolumeAfter:22+index*12,nextReviewRating:index===0?'Bom':null,retentionAfter:54+index*3,measuredAt:timestamp(shiftDate(today,-index*5+2)),confidence:index===0?'Estimativa':'Mais confiável',attributionEligible:true,reasons:[]}:null,createdAt:timestamp(shiftDate(today,-index*5)),completedAt:index<3?timestamp(shiftDate(today,-index*5)):null}));
  state.topicHistory=activeTopics.flatMap((entry,index)=>[{id:`demo-history-start-${index+1}`,type:'topic_created',date:entry.topic.createdAt.slice(0,10),subjectId:entry.subject.id,topicId:entry.topic.id,createdAt:entry.topic.createdAt},...(entry.topic.firstCompletedAt?[{id:`demo-history-done-${index+1}`,type:'topic_completed',date:entry.topic.firstCompletedAt.slice(0,10),subjectId:entry.subject.id,topicId:entry.topic.id,createdAt:entry.topic.firstCompletedAt}]:[])]);
  state.alertStates=[];state.achievementsUnlocked={primeira_sessao:timestamp(shiftDate(today,-oldestAge+1)),cem_questoes:timestamp(shiftDate(today,-oldestAge+20))};state.lastBackupAt=timestamp(today);state.updatedAt=timestamp(today);
  return state;
}
