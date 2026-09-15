import test from 'node:test';
import assert from 'node:assert/strict';
import {addLocalDays,endOfLocalDay,formatLocalDate,localDateRange,parseLocalDate,startOfLocalDay} from '../../src/core/date-utils.js';

test('datas civis permanecem estáveis em qualquer fuso',()=>{
  assert.equal(formatLocalDate(parseLocalDate('2026-09-15')),'2026-09-15');
  assert.equal(addLocalDays('2026-09-15',-1),'2026-09-14');
  assert.deepEqual(localDateRange('2026-09-15','2026-09-17'),['2026-09-15','2026-09-16','2026-09-17']);
  assert.equal(startOfLocalDay('2026-09-15').getHours(),0);
  assert.equal(endOfLocalDay('2026-09-15').getHours(),23);
});

test('datas inválidas não são convertidas silenciosamente',()=>{
  assert.equal(parseLocalDate('2026-02-30'),null);
  assert.equal(addLocalDays('não é data',1),null);
});
