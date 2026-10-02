import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAchievementProjection} from '../../src/application/projection/build-achievement-projection.js';
import {daysBetweenCalendarDates} from '../../src/application/projection/projection-status.js';

const today = '2026-10-01';
const dates = ['2026-08-06','2026-08-13','2026-08-20','2026-08-27','2026-09-03','2026-09-10','2026-09-17','2026-09-24'];
const simulations = scores => scores.map((score, index) => ({
  id: `sim-${index}`, date: dates[index], correct: score, total: 100,
  breakdown: [{subjectId:'math',total:100}], examTags:['exam-a']
}));
const input = (scores, overrides = {}) => ({today, examDate:'2026-12-15', targetScore:80,
  simulations:simulations(scores), coverage:75, adherence:85, openHighImpactPriorities:0,
  consistency:{days:5,target:5}, ...overrides});

test('contrato: iniciante tem dados insuficientes e nunca recebe probabilidade de aprovação', () => {
  const result = buildAchievementProjection(input([70], {coverage:20}));
  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.confidence.level, 'insufficient');
  assert.equal(result.projection.examDayScore, null);
  assert.equal(result.projection.approvalProbability, null);
});

test('contrato: evolução sustentada pode estar no caminho sem prometer nota da prova', () => {
  const result = buildAchievementProjection(input([60,64,68,71,74,77,79,81]));
  assert.equal(result.status, 'on_track');
  assert.equal(result.trajectory.direction, 'improving');
  assert.equal(result.confidence.level, 'moderate');
  assert.equal(result.projection.examDayScore, null);
});

test('contrato: platô abaixo da meta exige atenção', () => {
  const result = buildAchievementProjection(input([68,69,68,69,68,69,68,69]));
  assert.equal(result.status, 'attention');
  assert.ok(result.risks.some(item => item.includes('abaixo da meta')));
});

test('contrato: deterioração com execução baixa eleva risco', () => {
  const result = buildAchievementProjection(input([78,76,74,72,70,68,65,62], {adherence:45}));
  assert.equal(result.status, 'at_risk');
  assert.equal(result.trajectory.direction, 'deteriorating');
});

test('contrato: precisão alta com cobertura baixa não é no caminho', () => {
  const result = buildAchievementProjection(input([88,89,90,89,90,91,90,92], {coverage:25}));
  assert.equal(result.status, 'attention');
  assert.ok(result.risks.some(item => item.includes('Cobertura')));
});

test('contrato: prazo curto torna déficit medido mais grave; consistência isolada não compensa', () => {
  const scores = [69,70,71,71,72,72,72,72];
  assert.equal(buildAchievementProjection(input(scores)).status, 'attention');
  const near = buildAchievementProjection(input(scores, {examDate:'2026-10-11'}));
  assert.equal(near.status, 'at_risk');
  assert.equal(near.exam.phase, 'final_stretch');
  assert.equal(near.exam.daysRemaining, 10);
});

test('datas de calendário são independentes de fuso e inválidas não produzem prazo', () => {
  assert.equal(daysBetweenCalendarDates('2026-10-01','2026-10-11'), 10);
  assert.equal(daysBetweenCalendarDates('2026-02-30','2026-03-01'), null);
});
