import test from 'node:test';import assert from 'node:assert/strict';
import {buildStudyPlan} from '../../src/application/build-study-plan.js';

test('distribui o orçamento semanal sem ultrapassar disponibilidade',()=>{
  const plan=buildStudyPlan({weeklyAvailableMinutes:600,weeksUntilExam:10,topics:[{id:'a',subjectId:'s1',subjectName:'A',estimatedMinutes:300,examImpact:90,masteryGap:70,retentionNeed:60},{id:'b',subjectId:'s2',subjectName:'B',estimatedMinutes:300,examImpact:40,masteryGap:40,retentionNeed:30}]});
  assert.equal(plan.weeklyPlannedMinutes,60);assert.ok(plan.subjects[0].minutes>plan.subjects[1].minutes);assert.equal(Object.values(plan.activityMix).reduce((sum,value)=>sum+value,0),60);
});

test('identifica esforço ausente sem inventar carga',()=>{
  const plan=buildStudyPlan({weeklyAvailableMinutes:600,weeksUntilExam:5,topics:[{id:'a',estimatedMinutes:null},{id:'b',estimatedMinutes:100}]});
  assert.deepEqual(plan.missingEffort,['a']);assert.equal(plan.remainingMinutes,100);assert.equal(plan.confidence,.33);
});

test('exige prova, disponibilidade e ao menos um esforço configurado',()=>{
  assert.equal(buildStudyPlan({topics:[],weeklyAvailableMinutes:0,weeksUntilExam:0}).state,'insufficient');
});

test('redistribui minutos quando um tópico atinge sua carga restante',()=>{
  const plan=buildStudyPlan({weeklyAvailableMinutes:100,weeksUntilExam:1,topics:[{id:'a',subjectId:'s1',subjectName:'A',estimatedMinutes:10,examImpact:100},{id:'b',subjectId:'s2',subjectName:'B',estimatedMinutes:90,examImpact:10}]});
  assert.equal(plan.weeklyPlannedMinutes,100);assert.equal(plan.items.find(item=>item.id==='a').minutes,10);
});

test('expõe capacidade, necessidade, saldo e ritmo semanal',()=>{
  const deficit=buildStudyPlan({weeklyAvailableMinutes:100,weeksUntilExam:2,topics:[{id:'a',subjectId:'s1',estimatedMinutes:300}]});
  assert.equal(deficit.weeklyNeedMinutes,150);assert.equal(deficit.weeklyBalanceMinutes,-50);assert.equal(deficit.paceState,'deficit');
  const surplus=buildStudyPlan({weeklyAvailableMinutes:300,weeksUntilExam:2,topics:[{id:'a',subjectId:'s1',estimatedMinutes:300}]});
  assert.equal(surplus.weeklyBalanceMinutes,150);assert.equal(surplus.paceState,'surplus');
});
