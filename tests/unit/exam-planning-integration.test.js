import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStudyCandidates} from '../../src/application/build-study-candidates.js';
import {buildStudyPlan} from '../../src/application/build-study-plan.js';
import {buildAdaptivePlanningAdvice,applyAdaptivePlanningAdvice} from '../../src/domain/planning/adaptive-planning.js';

test('prova histórica alimenta o mesmo planejamento sem redistribuição automática',()=>{
  const topics=[
    {id:'stable',subjectId:'s1',name:'Informática',status:'Em andamento',estimatedStudyMinutes:300,prerequisites:[],examImportanceEstimates:{bb:.4}},
    {id:'weak',subjectId:'s2',name:'Juros Compostos',status:'Em andamento',estimatedStudyMinutes:300,prerequisites:[],examImportanceEstimates:{bb:.45}}
  ];
  const priorities=topics.map((topic,index)=>({topicId:topic.id,subjectId:topic.subjectId,subjectName:topic.name,topicName:topic.name,tipo:'continuar',estimatedMinutes:30,diagnosis:{mastery:{score:index?48:90,confidence:.9},trend:{direction:'stable'}}}));
  const retentions={stable:{available:true,score:85,confidence:.9},weak:{available:true,score:48,confidence:.9}};
  const exams=[2018,2020,2022,2023,2025].map(year=>({id:`exam-${year}`,year,coverage:'complete',examTags:['bb']}));
  const examQuestions=exams.slice(0,4).map((exam,index)=>({id:`q-${index}`,examId:exam.id,topicId:'weak',classification:{confidence:1}}));
  const candidates=buildStudyCandidates({topics,priorities,retentions,exams,examQuestions,activeExamTags:['bb'],today:'2026-09-25'});
  const target=candidates.find(item=>item.topicId==='weak');
  assert.equal(target.examIntelligence.usedHistory,true);
  assert.ok(target.examImpact>45);
  const plan=buildStudyPlan({topics:candidates.map(item=>({...item,remainingMinutes:300,estimatedMinutes:300})),weeklyAvailableMinutes:240,weeksUntilExam:1});
  const advice=buildAdaptivePlanningAdvice({plan,candidates,today:'2026-09-25'});
  assert.equal(advice.state,'proposal',advice.reason);
  assert.match(advice.rationale.join(' '),/Juros Compostos.*4 de 5 provas/);
  assert.equal(plan.weeklyPlannedMinutes,240);
  assert.equal(advice.applied,false);
  const adjusted=applyAdaptivePlanningAdvice(plan,advice);
  assert.ok(adjusted);
  assert.equal(adjusted.weeklyPlannedMinutes,240);
});
