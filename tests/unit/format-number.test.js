import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDecimal, formatDelta } from '../../src/core/format-number.js';

test('números usam vírgula decimal e ponto de milhar em pt-BR', () => {
  assert.equal(formatDecimal(69.4), '69,4');
  assert.equal(formatDecimal(1750), '1.750');
  assert.equal(formatDecimal(-174.66), '-174,7');
  assert.equal(formatDecimal(80), '80');
  assert.equal(formatDecimal(2.345, 2), '2,35');
});

test('formatDelta formata deltas com sinal explícito e U+2212 para negativos', () => {
  assert.equal(formatDelta(8.5), '+8,5');
  assert.equal(formatDelta(-1), '−1');
  assert.equal(formatDelta(-0.5), '−0,5');
  assert.equal(formatDelta(0), '0');
  assert.equal(formatDelta(null), '—');
});

test('valores não numéricos passam sem alteração', () => {
  assert.equal(formatDecimal(null), '');
  assert.equal(formatDecimal('—'), '—');
  assert.equal(formatDecimal(Number.NaN), 'NaN');
});
