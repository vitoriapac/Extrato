import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTopicSignals} from '../../src/domain/analytics/topic-signals.js';
import {buildStudyCandidates} from '../../src/application/build-study-candidates.js';
import {recommendStudy} from '../../src/application/recommend-study.js';
import {buildStudyPlan} from '../../src/application/build-study-plan.js';

test('sinais de tópico distinguem ausência de evidência de desempenho zero',()=>{
  const empty=buildTopicSignals({topic:{id:'t',subjectId:'s',status:'Não iniciado'},priority:{topicId:'t',subjectId:'s'}});
  assert.equal(empty.mastery,null);assert.equal(empty.masteryGap,null);
  assert.equal(empty.retentionRisk,null);assert.equal(empty.trendRisk,null);
  const failed=buildTopicSignals({topic:{id:'t'},mastery:0,retention:{available:true,score:0}});
  assert.equal(failed.masteryGap,100);assert.equal(failed.retentionRisk,100);
});

test('recomendação e planejamento preservam a mesma prioridade dos sinais',()=>{
  const topics=[{id:'a',subjectId:'s',name:'A',status:'Em andamento',estimatedStudyMinutes:90,prerequisites:[]}];
  const priorities=[{topicId:'a',subjectId:'s',tipo:'continuar',estimatedMinutes:30,diagnosis:{mastery:{score:40,confidence:.8},trend:{key:'down',state:'down',direction:'down',delta:-8},lastActivity:'2026-09-18'},diasSemEstudar:5}];
  const candidate=buildStudyCandidates({topics,priorities,today:'2026-09-23',retentions:{a:{available:true,score:60,confidence:.7}}})[0];
  const recommendation=recommendStudy([candidate],{availableMinutes:60})[0];
  const plan=buildStudyPlan({topics:[candidate],weeklyAvailableMinutes:120,weeksUntilExam:4});
  assert.equal(candidate.masteryGap,60);assert.equal(candidate.retentionRisk,40);
  assert.equal(recommendation.score,candidate.score);
  assert.equal(plan.items[0].score,candidate.score);
  assert.ok(candidate.reasons.includes('tendência recente em queda'));
});
