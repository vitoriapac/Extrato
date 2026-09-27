import {addLocalDays} from '../../core/date-utils.js';
import {measureRecommendationOutcome,captureRecommendationBaseline} from '../../application/recommendations/outcome-service.js';
import {buildWeeklyClose} from '../../domain/analytics/weekly-close.js';
import {buildWeeklyStrategicFocus} from '../../application/analytics/build-weekly-strategic-focus.js';
import {buildGapMap} from '../../domain/analytics/gap-map.js';
import {buildDecisionHistory} from '../../domain/recommendations/decision-history.js';
import {createWeeklyCloseSnapshot} from '../../application/analytics/weekly-close-snapshot.js';
import {EXAM_TAGS} from '../../domain/exams/exam-constants.js';
import {allocateErrors} from './study-history.js';

const stamp=date=>`${date}T12:00:00.000Z`;
const inRange=(item,start,end)=>item.date>=start&&item.date<=end;
const sum=(rows,key)=>rows.reduce((total,row)=>total+(Number(row[key])||0),0);

function alignExampleEvidence(scenario,{subjects,sessions,questions}){
  const questionRows=[...questions].sort((a,b)=>a.date.localeCompare(b.date));
  const bySession=new Map(sessions.map(session=>[session.id,session]));
  return scenario.recommendations.examples.map((example,index)=>{
    const subject=subjects.find(item=>item.topics.some(topic=>topic.name.toLocaleLowerCase('pt-BR')===example.topic.toLocaleLowerCase('pt-BR')));
    const topic=subject?.topics.find(item=>item.name.toLocaleLowerCase('pt-BR')===example.topic.toLocaleLowerCase('pt-BR'));
    const after=questionRows[Math.floor((index+2)*questionRows.length/5)],before=questionRows[Math.floor((index+2)*questionRows.length/5)-6];
    if(!subject||!topic||!after||!before)return null;
    for(const [row,score] of [[before,example.before],[after,example.after]]){
      if(score==null)continue;
      row.subjectId=subject.id;row.topicId=topic.id;row.correct=Math.round(row.resolved*score/100);
      row.errorBreakdown=allocateErrors(row.resolved-row.correct,scenario.questions.errorCategories,scenario.questions.profiles?.[subject.name]);
      const session=bySession.get(row.studySessionId);
      if(session){session.subjectId=subject.id;session.topicId=topic.id;session.correctAnswers=row.correct;session.questionsResolved=row.resolved}
    }
    return {subject,topic,before,after:example.after==null?null:after};
  });
}

export function buildDemoRecommendations(scenario,{today,subjects,sessions,questions}){
  const topics=subjects.flatMap(subject=>subject.topics.map(topic=>({subject,topic})));
  const examples=scenario.recommendations.examples,aligned=alignExampleEvidence(scenario,{subjects,sessions,questions});
  const feedback=[],history=[];
  for(let index=0;index<scenario.targets.recommendations;index++){
    const example=examples[index]||null,item=example?topics.find(row=>row.topic.name.toLocaleLowerCase('pt-BR')===example.topic.toLocaleLowerCase('pt-BR')):topics[(index*23+12)%topics.length];
    if(!item)continue;
    const date=aligned[index]?.after?addLocalDays(aligned[index].after.date,-2):aligned[index]?.before?addLocalDays(aligned[index].before.date,2):addLocalDays(today,-Math.max(6,110-index*5)),createdAt=stamp(date),id=`demo-recommendation-${index+1}`;
    const accepted=index%7!==6,completed=accepted&&index%6!==5,measurementDate=aligned[index]?.after?addLocalDays(aligned[index].after.date,1):addLocalDays(date,3),session=aligned[index]?.after?sessions.find(row=>row.id===aligned[index].after.studySessionId):sessions.find(row=>row.topicId===item.topic.id&&row.date>=date&&row.date<=measurementDate);
    const before=example?.before??Math.max(35,55+index%12),after=example?.after??before+(index%5===0?0:index%4===0?-5:7);
    const baseline=captureRecommendationBaseline({mastery:before,accuracy:before,questionVolume:aligned[index]?.before?.resolved||25,retentionScore:before-4,measuredAt:aligned[index]?.before?stamp(aligned[index].before.date):createdAt});
    const measured=completed&&example&&after!=null&&Boolean(aligned[index]?.after);
    const row={id:`demo-feedback-${index+1}`,recommendationId:id,date,subjectId:item.subject.id,topicId:item.topic.id,accepted,completed,useful:measured?after>before:null,reasonSkipped:accepted?null:'Preferiu outra disciplina',resultingSessionId:completed?session?.id||null:null,score:75,algorithmVersion:1,baseline,snapshot:{subjectId:item.subject.id,topicId:item.topic.id,priorityScore:75,recommendationType:'questions',recommendedMinutes:35,before:baseline,createdAt},outcome:null,shownAt:createdAt,createdAt,completedAt:completed?stamp(session?.date||addLocalDays(date,1)):null,ratedAt:null};
    if(measured)measureRecommendationOutcome(row,{masteryAfter:after,accuracyAfter:after,retentionAfter:after-4,questionVolumeAfter:aligned[index].after.resolved,measuredAt:stamp(measurementDate),daysElapsed:3,otherActivities:0});
    feedback.push(row);
    history.push({id,createdAt,localDate:date,candidateId:item.topic.id,signature:null,source:'generated',subjectId:item.subject.id,topicId:item.topic.id,activityType:'questions',suggestedMinutes:35,priority:75,reasons:['Lacuna observada no histórico demonstrativo.'],evidenceSnapshot:null,algorithmVersions:{priority:1,examIntelligence:1},status:accepted?'executed':'dismissed',executedAt:accepted?createdAt:null,dismissedAt:accepted?null:createdAt,expiredAt:null,sessionId:row.resultingSessionId,feedbackId:row.id});
  }
  return {recommendationFeedback:feedback,recommendationHistory:history};
}

function candidatesAt(end,{subjects,questions}){
  const byTopic=new Map();
  for(const question of questions){if(question.date>end)continue;const row=byTopic.get(question.topicId)||{resolved:0,correct:0};row.resolved+=question.resolved;row.correct+=question.correct;byTopic.set(question.topicId,row)}
  return subjects.flatMap(subject=>subject.topics.map(topic=>{
    const performance=byTopic.get(topic.id);
    return {topicId:topic.id,subjectId:subject.id,topicName:topic.name,subjectName:subject.name,examImpact:Math.round((topic.examImportance||0)*100),mastery:performance?.resolved>=20?Math.round(performance.correct/performance.resolved*100):null,retention:null,coverage:topic.firstCompletedAt?.slice(0,10)<=end?100:0,trendRisk:null};
  }));
}

export function buildDemoWeeklyCloses(scenario,{today,subjects,sessions,questions,dailyPlans,recommendations}){
  const weeks=scenario.targets.weeklyCloses,bySubject=new Map(subjects.map(item=>[item.id,item.name])),byTopic=new Map(subjects.flatMap(subject=>subject.topics.map(topic=>[topic.id,topic.name])));
  const snapshots=[];
  for(let index=0;index<weeks;index++){
    const start=addLocalDays(today,-(weeks-index+1)*7),end=addLocalDays(start,6),previousStart=addLocalDays(start,-7),previousEnd=addLocalDays(start,-1);
    const currentSessions=sessions.filter(row=>inRange(row,start,end)),currentQuestions=questions.filter(row=>inRange(row,start,end));
    const previousSessions=sessions.filter(row=>inRange(row,previousStart,previousEnd)),previousQuestions=questions.filter(row=>inRange(row,previousStart,previousEnd));
    const plans=dailyPlans.filter(plan=>plan.date>=start&&plan.date<=end).flatMap(plan=>plan.items||[]);
    const feedback=recommendations.filter(item=>item.date<=end).map(item=>item.outcome?.measuredAt?.slice(0,10)>end?{...item,outcome:null}:item),candidates=candidatesAt(end,{subjects,questions});
    const previousResolved=sum(previousQuestions,'resolved');
    const weeklyClose=buildWeeklyClose({period:{start,end},current:{plannedMinutes:sum(plans,'plannedMinutes'),executedMinutes:Math.round(sum(currentSessions,'durationSeconds')/60)},previous:{executedMinutes:Math.round(sum(previousSessions,'durationSeconds')/60),resolved:previousResolved,...previousResolved?{accuracy:Math.round(sum(previousQuestions,'correct')/previousResolved*100)}:{}},plans,sessions:currentSessions,questions:currentQuestions,recommendations:feedback,targetAccuracy:scenario.goals.targetScorePct});
    weeklyClose.strategicFocus=buildWeeklyStrategicFocus({sessions:currentSessions,candidates,recommendations:feedback,start,end});
    const model={period:{start,end},activeExamTags:[EXAM_TAGS.BB,EXAM_TAGS.CAIXA],weeklyClose,gapMap:buildGapMap(candidates),decisionHistory:buildDecisionHistory(feedback,{limit:5,resolveSubjectName:id=>bySubject.get(id),resolveTopicName:id=>byTopic.get(id)})};
    const snapshot=createWeeklyCloseSnapshot(model,{id:`demo-weekly-close-${index+1}`,savedAt:stamp(end)});
    if(snapshot)snapshots.push(snapshot);
  }
  return snapshots;
}
