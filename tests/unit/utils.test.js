import test from 'node:test';
import assert from 'node:assert/strict';
import { isISODate, isPlainObject, isSafeId, structuredCloneSafe } from '../../src/core/utils.js';

test('valida datas reais no formato ISO local', () => {
  assert.equal(isISODate('2024-02-29'), true);
  assert.equal(isISODate('2023-02-29'), false);
  assert.equal(isISODate('2024-13-01'), false);
});

test('rejeita identificadores inseguros', () => {
  assert.equal(isSafeId('topic-safe_1:value'), true);
  assert.equal(isSafeId("x');alert(1)//"), false);
});

test('clona dados serializaveis sem compartilhar referencias', () => {
  const source = {nested: {value: 1}, list: [1, 2]};
  const copy = structuredCloneSafe(source);
  copy.nested.value = 2;
  assert.equal(source.nested.value, 1);
  assert.equal(isPlainObject(copy), true);
});
