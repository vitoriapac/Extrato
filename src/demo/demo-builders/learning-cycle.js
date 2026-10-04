import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';
import {buildWeeklyAdherence} from '../../application/adherence/build-weekly-adherence.js';
import {buildSustainabilityModel} from '../../application/planning-sustainability/build-sustainability-model.js';
import {measureRecommendationOutcome,captureRecommendationBaseline,captureRecommendationSnapshot} from '../../application/recommendations/outcome-service.js';
import {buildWeeklyClose} from '../../domain/analytics/weekly-close.js';
import {buildWeeklyStrategicFocus} from '../../application/analytics/build-weekly-strategic-focus.js';
import {buildGapMap} from '../../domain/analytics/gap-map.js';
import {buildDecisionHistory} from '../../domain/recommendations/decision-history.js';
import {createWeeklyCloseSnapshot} from '../../application/analytics/weekly-close-snapshot.js';
import {EXAM_TAGS} from '../../domain/exams/exam-constants.js';
import {resolveExamPhase} from '../../domain/planning/adaptive-planning.js';
import {buildWeeklyCloseAdherence} from '../../application/adherence/build-weekly-close-adherence.js';

const stamp=date=>`${date}T12:00:00.000Z`;
const inRange=(item,start,end)=>item.date>=start&&item.date<=end;
const sum=(rows,key)=>rows.reduce((total,row)=>total+(Number(row[key])||0),0);

export function buildDemoRecommendations(scenario,{today,subjects,sessions,questions}){
  const topics=subjects.flatMap(subject=>subject.topics.map(topic=>({subject,topic}))).filter(item=>questions.some(row=>row.topicId===item.topic.id));
  const examples=scenario.recommendations.examples;
  const feedback=[],history=[];
  for(let index=0;index<scenario.targets.recommendations;index++){
    const example=examples[index]||null,item=example?topics.find(row=>row.topic.name.toLocaleLowerCase('pt-BR')===example.topic.toLocaleLowerCase('pt-BR')):topics[(index*23+12)%topics.length];
    if(!item)continue;
    const records=questions.filter(row=>row.topicId===item.topic.id).sort((a,b)=>a.date.localeCompare(b.date));
    const before=records[0],after=records.length>1?records.at(-1):null;
    const date=addLocalDays(before.date,1),createdAt=stamp(date),id=`demo-recommendation-${index+1}`;
    const accepted=index%7!==6,session=after?sessions.find(row=>row.id===after.studySessionId):sessions.filter(row=>row.topicId===item.topic.id&&row.date>date).sort((a,b)=>a.date.localeCompare(b.date))[0],completed=accepted&&Boolean(session&&session.date>date);
    const beforeScore=Math.round(before.correct/before.resolved*100),afterScore=after?Math.round(after.correct/after.resolved*100):null;
    const score=Math.round(100*(item.topic.examImportance||0)*(1-beforeScore/100));
    const reasons=[`Prova: impacto configurado de ${Math.round((item.topic.examImportance||0)*100)}/100.`,`Você: ${before.correct} acertos em ${before.resolved} questões (${beforeScore}%) antes da recomendação.`];
    const baseline=captureRecommendationBaseline({mastery:beforeScore,accuracy:beforeScore,questionVolume:before.resolved,measuredAt:stamp(before.date)});
    const recommendation={recommendationId:id,subjectId:item.subject.id,topicId:item.topic.id,type:'questions',estimatedMinutes:35,score,reasons,algorithmVersion:1,examImpact:Math.round((item.topic.examImportance||0)*100),evidence:{questionIds:[before.id],resolved:before.resolved,correct:before.correct,activeExamTags:[EXAM_TAGS.BB,EXAM_TAGS.CAIXA]}};
    const snapshot=captureRecommendationSnapshot(recommendation,{baseline,createdAt});
    const measured=completed&&example?.after!==null&&after&&after.date>date;
    const row={id:`demo-feedback-${index+1}`,recommendationId:id,date,subjectId:item.subject.id,topicId:item.topic.id,accepted,completed,useful:measured?afterScore>beforeScore:null,reasonSkipped:accepted?null:'Preferiu outra disciplina',resultingSessionId:completed?session.id:null,score,algorithmVersion:1,baseline,snapshot,outcome:null,shownAt:createdAt,createdAt,completedAt:completed?stamp(session.date):null,ratedAt:null};
    if(measured)measureRecommendationOutcome(row,{masteryAfter:afterScore,accuracyAfter:afterScore,questionVolumeAfter:after.resolved,measuredAt:stamp(after.date),daysElapsed:Math.max(1,Math.round((Date.parse(stamp(after.date))-Date.parse(createdAt))/86400000)),otherActivities:0});
    feedback.push(row);
    history.push({id,createdAt,localDate:date,candidateId:item.topic.id,signature:null,source:'generated',subjectId:item.subject.id,topicId:item.topic.id,activityType:'questions',suggestedMinutes:35,priority:score,reasons,evidenceSnapshot:recommendation.evidence,algorithmVersions:{priority:1,examIntelligence:null},status:accepted?'executed':'dismissed',executedAt:accepted?createdAt:null,dismissedAt:accepted?null:createdAt,expiredAt:null,sessionId:row.resultingSessionId,feedbackId:row.id});
  }
  return {recommendationFeedback:feedback,recommendationHistory:history};
}

function candidatesAt(end,{subjects,questions}){
  const byTopic=new Map();
  for(const question of questions){if(question.date>end)continue;const row=byTopic.get(question.topicId)||{resolved:0,correct:0};row.resolved+=question.resolved;row.correct+=question.correct;byTopic.set(question.topicId,row)}
  return subjects.flatMap(subject=>subject.topics.map(topic=>{
    const performance=byTopic.get(topic.id);
    return {topicId:topic.id,subjectId:subject.id,topicName:topic.name,subjectName:subject.name,examImpact:Math.round((topic.examImportance||0)*100),mastery:performance?.resolved>=20?Math.round(performance.correct/performance.resolved*100):null,evidenceStrength:Math.min(1,(performance?.resolved||0)/40),retention:null,coverage:topic.firstCompletedAt?.slice(0,10)<=end?100:0,trendRisk:null};
  }));
}

export function buildDemoWeeklyCloses(scenario,{today,examDate,subjects,sessions,questions,dailyPlans,recommendations,capacityHistory=[]}){
  const weeks=scenario.targets.weeklyCloses,bySubject=new Map(subjects.map(item=>[item.id,item.name])),byTopic=new Map(subjects.flatMap(subject=>subject.topics.map(topic=>[topic.id,topic.name])));
  const snapshots=[];
  for(let index=0;index<weeks;index++){
    const monday=addLocalDays(today,-((parseLocalDate(today).getDay()+6)%7)),start=addLocalDays(monday,-(weeks-index)*7),end=addLocalDays(start,6),previousStart=addLocalDays(start,-7),previousEnd=addLocalDays(start,-1);
    const currentSessions=sessions.filter(row=>inRange(row,start,end)),currentQuestions=questions.filter(row=>inRange(row,start,end));
    const previousSessions=sessions.filter(row=>inRange(row,previousStart,previousEnd)),previousQuestions=questions.filter(row=>inRange(row,previousStart,previousEnd));
    const plans=dailyPlans.filter(plan=>plan.date>=start&&plan.date<=end).flatMap(plan=>plan.items||[]);
    const feedback=recommendations.filter(item=>item.date<=end).map(item=>item.outcome?.measuredAt?.slice(0,10)>end?{...item,outcome:null}:item),candidates=candidatesAt(end,{subjects,questions});
    const previousResolved=sum(previousQuestions,'resolved');
    const weeklyClose=buildWeeklyClose({period:{start,end},current:{plannedMinutes:sum(plans,'plannedMinutes'),executedMinutes:Math.round(sum(currentSessions,'durationSeconds')/60)},previous:{executedMinutes:Math.round(sum(previousSessions,'durationSeconds')/60),resolved:previousResolved,...previousResolved?{accuracy:Math.round(sum(previousQuestions,'correct')/previousResolved*100)}:{}},plans,sessions:currentSessions,questions:currentQuestions,recommendations:feedback,targetAccuracy:scenario.goals.targetScorePct});
    weeklyClose.strategicFocus=buildWeeklyStrategicFocus({sessions:currentSessions,candidates,recommendations:feedback,start,end});
    weeklyClose.adherence=buildWeeklyCloseAdherence({start,end,today:addLocalDays(end,1),dailyPlans,sessions:currentSessions,subjects,capacityHistory,
      activeExamTags:[EXAM_TAGS.BB,EXAM_TAGS.CAIXA],snapshots});
    const cutoff=addLocalDays(end,1),activeExamTags=[EXAM_TAGS.BB,EXAM_TAGS.CAIXA];
    weeklyClose.adherence.sustainability=buildSustainabilityModel({today:cutoff,activeExamTags,snapshots,
      weeklyAdherence:buildWeeklyAdherence({today:cutoff,dailyPlans,sessions,subjects,capacityHistory,activeExamTags,historyWeeks:4})});
    const model={period:{start,end},activeExamTags:[EXAM_TAGS.BB,EXAM_TAGS.CAIXA],weeklyClose,gapMap:buildGapMap(candidates),decisionHistory:buildDecisionHistory(feedback,{limit:5,resolveSubjectName:id=>bySubject.get(id),resolveTopicName:id=>byTopic.get(id)})};
    const daysToExam=examDate?Math.round((Date.parse(`${examDate}T12:00:00Z`)-Date.parse(`${end}T12:00:00Z`))/86400000):null;
    const snapshot=createWeeklyCloseSnapshot(model,{id:`demo-weekly-close-${index+1}`,savedAt:stamp(end),examPhase:resolveExamPhase(daysToExam)});
    if(snapshot)snapshots.push(snapshot);
  }
  return snapshots;
}
