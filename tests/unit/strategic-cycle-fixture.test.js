import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStrategicCycleFixture,STRATEGIC_CYCLE_TODAY} from '../fixtures/strategic-cycle.js';
import {buildExamMatrix} from '../../src/application/exam-intelligence/build-exam-matrix.js';
import {buildCalibratedScoreProjection} from '../../src/domain/forecasts/calibrated-score-projection.js';
import {buildWeeklyClose} from '../../src/domain/analytics/weekly-close.js';

test('fechamento recupera a duração congelada da recomendação para o próximo plano',()=>{
  const feedback={id:'decision',date:STRATEGIC_CYCLE_TODAY,accepted:true,topicId:'topic',snapshot:{recommendedMinutes:35}};
  const input={period:{start:STRATEGIC_CYCLE_TODAY,end:STRATEGIC_CYCLE_TODAY},current:{executedMinutes:30},recommendations:[feedback]};
  assert.equal(buildWeeklyClose(input).priorities[0].estimatedMinutes,35);
  assert.equal(buildWeeklyClose({...input,recommendations:[{...feedback,estimatedMinutes:20}]}).priorities[0].estimatedMinutes,20);
  assert.equal(buildWeeklyClose({...input,recommendations:[{...feedback,estimatedMinutes:0}]}).priorities[0].estimatedMinutes,0);
});

test('fixture estratégica é determinística e contém oito semanas e quatro perfis',()=>{
  const state=buildStrategicCycleFixture(),topics=state.subjects.flatMap(subject=>subject.topics);
  assert.deepEqual(state,buildStrategicCycleFixture());assert.equal(state.subjects.length,4);assert.equal(topics.length,20);
  assert.equal(new Set(topics.map(topic=>topic.id)).size,20);assert.equal(state.studySessions.length,160);assert.equal(state.readinessSnapshots.length,8);assert.equal(state.simulados.length,4);
  assert.ok(state.examDate>STRATEGIC_CYCLE_TODAY);assert.ok(state.questoes.every(item=>item.resolved>=item.correct));assert.ok(state.dailyPlans.every(plan=>plan.plannedMinutes<=plan.availableMinutes));
  const model=buildExamMatrix({topics:topics.map(topic=>({...topic,subjectName:state.subjects.find(subject=>subject.id===topic.subjectId).name})),exams:state.exams,examQuestions:state.examQuestions,activeExamTags:['bb-escriturario']});
  assert.equal(model.rows.find(row=>row.topicId==='cycle-t0-0').presencePercent,100);assert.equal(model.rows.find(row=>row.topicId==='cycle-t0-1').presencePercent,100);assert.equal(model.rows.find(row=>row.topicId==='cycle-t0-2').presencePercent,25);
  const projection=buildCalibratedScoreProjection({simulations:state.simulados,today:STRATEGIC_CYCLE_TODAY});assert.equal(projection.available,true);assert.equal(projection.evidence.observationCount,4);
});
test('concurso Caixa reaproveita tópicos comuns sem duplicar identidade ou dados',()=>{
  const state=buildStrategicCycleFixture(),topics=state.subjects.flatMap(subject=>subject.topics);
  const bb=buildExamMatrix({topics,exams:state.exams,examQuestions:state.examQuestions,activeExamTags:['bb-escriturario']});
  const caixa=buildExamMatrix({topics,exams:state.exams,examQuestions:state.examQuestions,activeExamTags:['caixa-tbn']});
  assert.ok(bb.rows.some(row=>row.topicId==='cycle-t0-4'));assert.ok(caixa.rows.some(row=>row.topicId==='cycle-t0-4'));assert.equal(caixa.exams.length,1);assert.equal(caixa.rows.some(row=>row.topicId==='cycle-t0-0'),false);assert.equal(topics.length,20);
});
