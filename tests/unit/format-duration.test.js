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
  assert.equal(formatPlanMinutes(0), '0min');
  assert.equal(formatPlanMinutes(30), '30min');
  assert.equal(formatPlanMinutes(59), '59min');
  assert.equal(formatPlanMinutes(60), '1h');
  assert.equal(formatPlanMinutes(75), '1h15');
  assert.equal(formatPlanMinutes(120), '2h');
  assert.equal(formatPlanMinutes(125), '2h05');
  assert.equal(formatPlanMinutes(null), '0min');
});
