import test from 'node:test';
import assert from 'node:assert/strict';
import { firstActivityDate } from '../../src/application/selectors/first-activity-date.js';

test('o histórico começa no registro mais antigo, de qualquer tipo', () => {
  assert.equal(
    firstActivityDate({
      studySessions: [{ date: '2026-10-28T10:00:00' }],
      questoes: [{ date: '2026-10-21' }],
      simulados: [],
      dailyPlans: [{ date: '2026-10-25' }],
    }),
    '2026-10-21'
  );
});

test('sem registros datados não há início', () => {
  assert.equal(firstActivityDate({ studySessions: [{ date: '' }], questoes: [] }), null);
  assert.equal(firstActivityDate(null), null);
});

test('o alerta de ritmo só cobra uma semana vivida inteira no app', async () => {
  const { weeklyGoalGapFor } =
    await import('../../src/application/recommendations/study-candidate-service.js');
  const behind = { expectedFrac: 4 / 7, actualFrac: 0, weekStart: '2026-10-26' };
  assert.equal(weeklyGoalGapFor({ ...behind, historyStart: null }), null);
  assert.equal(weeklyGoalGapFor({ ...behind, historyStart: '2026-10-29' }), null);
  assert.equal(weeklyGoalGapFor({ ...behind, historyStart: '2026-10-20' }), 57);
  assert.equal(weeklyGoalGapFor({ ...behind, historyStart: '2026-10-26' }), 57);
});
