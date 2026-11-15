import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRhythmGoalWarning, neededTopicsPerWeek } from '../../src/application/goals/rhythm-goal-warning.js';

test('tópicos necessários por semana saem do que falta e do prazo, e são nulos sem prazo válido', () => {
  assert.equal(neededTopicsPerWeek(70, 35), 14);
  assert.equal(neededTopicsPerWeek(70, 0), null);
  assert.equal(neededTopicsPerWeek(70, null), null);
  assert.equal(neededTopicsPerWeek(0, 35), null);
});

test('meta abaixo do necessário gera o aviso com os dois números (12 contra 15,1)', () => {
  const warning = buildRhythmGoalWarning({ goal: 12, remaining: 151, daysToExam: 70, comparativo: 'no-prazo' });
  assert.equal(warning.kind, 'goal-below');
  assert.equal(warning.goal, 12);
  assert.ok(Math.abs(warning.needed - 15.1) < 0.01);
});

test('meta suficiente e no prazo não avisa; atrasado sem meta abaixo avisa com o outro texto', () => {
  assert.equal(buildRhythmGoalWarning({ goal: 20, remaining: 151, daysToExam: 70, comparativo: 'no-prazo' }), null);
  assert.equal(buildRhythmGoalWarning({ goal: null, remaining: 10, daysToExam: null, comparativo: 'sem-prazo' }), null);
  const late = buildRhythmGoalWarning({ goal: 20, remaining: 151, daysToExam: 70, comparativo: 'atrasado' });
  assert.equal(late.kind, 'late');
});

test('meta abaixo do necessário tem prioridade sobre "atrasado" (é a que a pessoa pode mudar)', () => {
  assert.equal(buildRhythmGoalWarning({ goal: 5, remaining: 151, daysToExam: 70, comparativo: 'atrasado' }).kind, 'goal-below');
});
