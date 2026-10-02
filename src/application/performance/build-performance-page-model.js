import {buildQuestionEvolution} from '../questions/build-question-evolution.js';
import {buildPerformanceAnalysis} from '../questions/build-performance-analysis.js';
import {buildPerformanceOverview} from './build-performance-overview.js';
import {buildPerformanceComparison} from './build-performance-comparison.js';
import {buildPerformanceSimulations} from './build-performance-simulations.js';
import {buildPerformanceSubjectComparison} from './build-performance-subject-comparison.js';
import {buildPerformanceSubjects} from './build-performance-subjects.js';
import {buildPerformanceTopicDetail} from './build-performance-topic-detail.js';
import {buildPerformanceConsistency} from './build-performance-consistency.js';
import {buildReadinessChangeExplanation} from '../readiness/build-readiness-change-explanation.js';
import {buildStabilityMap} from './build-stability-map.js';

// The composition root supplies scoped records and stateful metric lookups; this builder owns section assembly.
export function buildPerformancePageModel({viewState,range,today,activeExamTags=[],scope,subjects=[],simulations=[],projectionSnapshots=[],achievementProjection=null,achievementHistory=[],achievementCapacityMinutes=0,recoveryPlan=null,readinessSnapshots=[],readiness=null,blueprint={},globalTarget=80,candidates=[],dailyPlans=[],subjectIdFor,simulationCountsFor,reviewCompletedDateFor,topicMetricsFor,topicProfileFor,topicHistoryFor}={}){
  const section=viewState.section;
  if(section==='overview'){
    const model=buildPerformanceOverview({range,today,activeExamTags,readinessSnapshots,readiness,questions:scope.questions.included,sessions:scope.sessions.included,dailyPlans,subjects});
    return {section,model,achievementProjection,achievementHistory,achievementCapacityMinutes,recoveryPlan,comparisonModel:buildPerformanceComparison(model,{comparePrevious:range.comparePrevious}),readinessChange:buildReadinessChangeExplanation(model.readinessPair)};
  }
  if(section==='questions'){
    const questions=scope.questions.included.map(item=>({...item,subjectId:subjectIdFor(item)}));
    const evolution=buildQuestionEvolution({questions,today,period:viewState.period});
    const analysis=buildPerformanceAnalysis({questions,simulations:[],candidates:scope.content.eligibleTopics.map(item=>({topicId:item.id,topicName:item.name})),today,period:viewState.period});
    const previousAccuracy=range.previous?buildQuestionEvolution({questions,today:range.previous.end,period:viewState.period}).accuracy:null;
    return {section,evolution,analysis,previousAccuracy};
  }
  if(section==='simulations'){
    const normalized=simulations.map(item=>({...item,...simulationCountsFor(item),breakdown:(item.breakdown||[]).map(row=>({...row,subjectId:subjectIdFor(row)}))}));
    return {section,model:buildPerformanceSimulations({simulations:normalized,subjects,projectionSnapshots,activeExamTags,range,today})};
  }
  if(section==='subjects'){
    const eligibleTopicIds=new Set(scope.content.eligibleTopics.map(item=>item.id));
    const eligibleSubjects=subjects.map(subject=>({...subject,topics:(subject.topics||[]).filter(topic=>eligibleTopicIds.has(topic.id))}));
    const questions=scope.questions.included.map(item=>({...item,subjectId:subjectIdFor(item)}));
    const comparison=buildPerformanceSubjectComparison({subjects:eligibleSubjects,questions,range,blueprint,globalTarget,candidates,sort:viewState.subjectSort});
    const selected=eligibleSubjects.find(item=>item.id===viewState.subjectId)||eligibleSubjects[0];
    const metricsByTopic=Object.fromEntries((selected?.topics||[]).map(topic=>[topic.id,topicMetricsFor(selected.id,topic.id)]));
    const model=buildPerformanceSubjects({subjects:eligibleSubjects,subjectId:selected?.id,range,today,period:viewState.period,questions,
      sessions:scope.sessions.included.map(item=>({...item,subjectId:subjectIdFor(item)})),
      reviews:scope.reviews.included.map(item=>({...item,subjectId:subjectIdFor(item),completedDate:reviewCompletedDateFor(item)})),
      simulations:simulations.map(item=>({...item,breakdown:(item.breakdown||[]).map(row=>({...row,subjectId:subjectIdFor(row)}))})),
      blueprint,globalTarget,metricsByTopic});
    const topicRow=model.topics.find(item=>item.id===viewState.topicId);
    const topic=selected?.topics.find(item=>item.id===topicRow?.id);
    const detail=topic?{...buildPerformanceTopicDetail({topicRow,questions:scope.questions.included,today,period:viewState.period,
      examProfile:topicProfileFor(topic,selected),history:topicHistoryFor(topic.id)}),subjectId:selected.id}:null;
    return {section,model,comparison,stabilityMap:buildStabilityMap(comparison),detail};
  }
  const sessions=scope.sessions.included.map(item=>({...item,subjectId:subjectIdFor(item)}));
  return {section:'consistency',model:buildPerformanceConsistency({range,today,sessions,questions:scope.questions.included,dailyPlans,subjects})};
}
