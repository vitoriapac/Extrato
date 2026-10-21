import test from 'node:test';
import assert from 'node:assert/strict';
import {formatDecimal} from '../../src/core/format-number.js';

test('números usam vírgula decimal e ponto de milhar em pt-BR',()=>{
  assert.equal(formatDecimal(69.4),'69,4');
  assert.equal(formatDecimal(1750),'1.750');
  assert.equal(formatDecimal(-174.66),'-174,7');
  assert.equal(formatDecimal(80),'80');
  assert.equal(formatDecimal(2.345,2),'2,35');
});

test('valores não numéricos passam sem alteração',()=>{
  assert.equal(formatDecimal(null),'');
  assert.equal(formatDecimal('—'),'—');
  assert.equal(formatDecimal(Number.NaN),'NaN');
});
