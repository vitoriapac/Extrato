import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAdaptiveInterval } from '../../src/domain/reviews.js';

test('encurta o intervalo quando o desempenho e critico', () => {
  const result = calculateAdaptiveInterval({baseDays: 10, accuracy: 40, volume: 20, target: 70});
  assert.equal(result.days, 7);
  assert.match(result.reason, /abaixo de 50%/);
});

test('alonga o intervalo com desempenho e historico consistentes', () => {
  const result = calculateAdaptiveInterval({baseDays: 10, accuracy: 90, volume: 30, target: 70, trendKey: 'up', reviews: 4});
  assert.ok(result.days > 10 && result.days <= 15);
});

test('limita intervalos adaptativos', () => {
  assert.equal(calculateAdaptiveInterval({baseDays: 200, accuracy: 100, volume: 100, reviews: 10}).days, 60);
  assert.equal(calculateAdaptiveInterval({baseDays: 2, accuracy: 0, volume: 100, trendKey: 'down'}).days, 1);
});
