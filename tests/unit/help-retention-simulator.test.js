import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEbbinghausRetention,
  SCHEDULED_REVIEW_DAYS,
} from '../../src/domain/help/retention-simulator.js';

test('calculateEbbinghausRetention — dia 0 inicia em 100%', () => {
  const resultWithout = calculateEbbinghausRetention(0, false);
  assert.equal(resultWithout.retentionPct, 100);
  assert.equal(resultWithout.decayStage, 'consolidated');

  const resultWith = calculateEbbinghausRetention(0, true);
  assert.equal(resultWith.retentionPct, 100);
  assert.equal(resultWith.decayStage, 'consolidated');
});

test('calculateEbbinghausRetention — sem revisão sofre queda exponencial acentuada', () => {
  const day1 = calculateEbbinghausRetention(1, false);
  const day7 = calculateEbbinghausRetention(7, false);
  const day30 = calculateEbbinghausRetention(30, false);

  assert.ok(day1.retentionPct < 90, `Esperado < 90%, obtido ${day1.retentionPct}%`);
  assert.ok(day7.retentionPct < 50, `Esperado < 50%, obtido ${day7.retentionPct}%`);
  assert.equal(day7.decayStage, 'critical');
  assert.ok(day30.retentionPct <= 25, `Esperado <= 25%, obtido ${day30.retentionPct}%`);
});

test('calculateEbbinghausRetention — com revisões mantém retenção sustentada acima de 80%', () => {
  const day5 = calculateEbbinghausRetention(5, true);
  const day15 = calculateEbbinghausRetention(15, true);
  const day30 = calculateEbbinghausRetention(30, true);

  assert.ok(day5.retentionPct >= 85, `Esperado >= 85%, obtido ${day5.retentionPct}%`);
  assert.ok(day15.retentionPct >= 85, `Esperado >= 85%, obtido ${day15.retentionPct}%`);
  assert.ok(day30.retentionPct >= 85, `Esperado >= 85%, obtido ${day30.retentionPct}%`);
  assert.equal(day30.decayStage, 'consolidated');
});

test('calculateEbbinghausRetention — limita dias entre 0 e 30', () => {
  const negative = calculateEbbinghausRetention(-5, false);
  assert.equal(negative.days, 0);

  const overflow = calculateEbbinghausRetention(100, false);
  assert.equal(overflow.days, 30);
});

test('SCHEDULED_REVIEW_DAYS contém os marcos recomendados', () => {
  assert.deepEqual(SCHEDULED_REVIEW_DAYS, [1, 7, 21]);
});
