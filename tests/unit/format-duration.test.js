import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, formatPlanMinutes } from '../../src/core/format-duration.js';

test('formatDuration — formata durações em segundos corretamente', () => {
  assert.equal(formatDuration(0), '0min');
  assert.equal(formatDuration(45), '45 s');
  assert.equal(formatDuration(59), '59 s');
  assert.equal(formatDuration(60), '1min');
  assert.equal(formatDuration(90), '1min');
  assert.equal(formatDuration(3600), '1h');
  assert.equal(formatDuration(3660), '1h01');
  assert.equal(formatDuration(7200), '2h');
  assert.equal(formatDuration(7500), '2h05');
  assert.equal(formatDuration(null), '0min');
});

test('formatPlanMinutes — formata minutos de planejamento corretamente', () => {
  assert.equal(formatPlanMinutes(0), '0 min');
  assert.equal(formatPlanMinutes(30), '30 min');
  assert.equal(formatPlanMinutes(59), '59 min');
  assert.equal(formatPlanMinutes(60), '1 h');
  assert.equal(formatPlanMinutes(75), '1 h 15 min');
  assert.equal(formatPlanMinutes(120), '2 h');
  assert.equal(formatPlanMinutes(125), '2 h 5 min');
  assert.equal(formatPlanMinutes(null), '0 min');
});
