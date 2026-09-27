import test from 'node:test';
import assert from 'node:assert/strict';
import scenario from '../../src/demo/demo-scenario.json' with {type:'json'};
import {validateDemoScenario} from '../../src/demo/demo-scenario-validator.js';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {EXAM_TAGS} from '../../src/domain/exams/exam-constants.js';
import {isTopicInExamScope} from '../../src/domain/exams/exam-scope.js';
import {buildExamDataQuality} from '../../src/application/exam-intelligence/build-exam-data-quality.js';

const today='2026-09-27';
const demo=generateDemoData({today});
const topics=demo.subjects.flatMap(subject=>subject.topics.map(topic=>({...topic,subjectId:subject.id})));

test('blueprint é válido e rejeita IDs repetidos',()=>{
  assert.deepEqual(validateDemoScenario(scenario),{valid:true,errors:[]});
  const invalid=structuredClone(scenario);invalid.subjects[0].topics[1].id=invalid.subjects[0].topics[0].id;
  const result=validateDemoScenario(invalid);assert.equal(result.valid,false);assert.ok(result.errors.some(error=>error.includes('duplicado')));
});

test('demo mantém catálogo e escopos BB/Caixa sem duplicar tópicos comuns',()=>{
  assert.equal(demo.subjects.length,17);assert.equal(topics.length,305);
  assert.equal(new Set([...demo.subjects.map(item=>item.id),...topics.map(item=>item.id)]).size,322);
  const common=topics.filter(topic=>topic.examTags.includes(EXAM_TAGS.BB)&&topic.examTags.includes(EXAM_TAGS.CAIXA));
  assert.ok(common.length>0);
  assert.ok(common.every(topic=>isTopicInExamScope(topic,[EXAM_TAGS.BB])&&isTopicInExamScope(topic,[EXAM_TAGS.CAIXA])));
  assert.ok(topics.some(topic=>isTopicInExamScope(topic,[EXAM_TAGS.BB])&&!isTopicInExamScope(topic,[EXAM_TAGS.CAIXA])));
  assert.ok(topics.some(topic=>isTopicInExamScope(topic,[EXAM_TAGS.CAIXA])&&!isTopicInExamScope(topic,[EXAM_TAGS.BB])));
});

test('histórico de estudo é determinístico e mantém referências e volumes',()=>{
  assert.deepEqual(generateDemoData({today}),demo);
  assert.equal(demo.progressHistory.length,140);assert.equal(demo.studySessions.length,200);
  assert.equal(demo.questoes.reduce((sum,row)=>sum+row.resolved,0),1750);
  assert.ok(new Set(demo.studySessions.map(item=>item.date)).size<140);
  const sessions=new Map(demo.studySessions.map(item=>[item.id,item]));
  for(const row of demo.questoes){const session=sessions.get(row.studySessionId);assert.ok(session);assert.equal(row.topicId,session.topicId);assert.equal(row.subjectId,session.subjectId);assert.equal(Object.values(row.errorBreakdown).reduce((sum,value)=>sum+value,0),row.resolved-row.correct)}
  assert.deepEqual(new Set(demo.questoes.flatMap(row=>Object.keys(row.errorBreakdown))),new Set(scenario.questions.errorCategories));
});

test('simulados, redações e revisões apresentam os estados planejados',()=>{
  assert.equal(demo.simulados.length,9);assert.equal(demo.reviewAgenda.length,50);
  assert.ok(demo.simulados.some((item,index)=>index>0&&item.correct/item.total<demo.simulados[index-1].correct/demo.simulados[index-1].total));
  assert.equal(demo.studySessions.filter(item=>item.notes.startsWith('Redação demonstrativa')).length,8);
  assert.equal(demo.reviewAgenda.filter(item=>item.status==='Concluído').length,18);
  assert.equal(demo.reviewAgenda.filter(item=>item.status!=='Concluído'&&item.date<today).length,7);
  assert.equal(demo.reviewAgenda.filter(item=>item.status!=='Concluído'&&item.date>today).length,25);
});

test('inteligência da prova e planejamento preservam escopo, dados e capacidade',()=>{
  assert.equal(demo.exams.length,16);assert.equal(demo.examQuestions.length,842);
  assert.equal(demo.exams.filter(item=>item.coverage==='complete').length,13);
  assert.equal(demo.exams.reduce((sum,item)=>sum+item.unresolvedQuestions.length,0),18);
  const quality=buildExamDataQuality({exams:demo.exams,examQuestions:demo.examQuestions,topics,blueprint:demo.examBlueprint});
  assert.equal(quality.coveragePercent,92);assert.equal(quality.confidence,'moderate');
  assert.equal(demo.studyPlans[0].weeklyAvailableMinutes,720);assert.equal(demo.studyPlans[0].weeklyPlannedMinutes,720);
  const transfer=demo.adaptivePlanningHistory[0];assert.equal(transfer.minutes,30);
  assert.equal(transfer.sourceBefore+transfer.targetBefore,transfer.sourceAfter+transfer.targetAfter);
  assert.ok(demo.examQuestions.every(item=>item.examId.startsWith('demo-exam-')&&!item.id.startsWith('demo-question-')));
});

test('recomendações e fechamentos mantêm resultado medido separado de meta narrativa',()=>{
  assert.equal(demo.recommendationFeedback.length,20);assert.equal(demo.recommendationHistory.length,20);
  assert.deepEqual(new Set(demo.recommendationFeedback.map(item=>item.outcome?.state).filter(Boolean)),new Set(['positive','neutral']));
  assert.ok(demo.recommendationFeedback.some(item=>item.completed&&!item.outcome));
  assert.ok(demo.recommendationFeedback.some(item=>!item.accepted));
  assert.equal(demo.weeklyCloseSnapshots.length,14);
  assert.ok(demo.weeklyCloseSnapshots.every(item=>item.weeklyClose.strategicFocus.state==='available'));
  assert.equal(demo.readinessHistory,undefined);
});
