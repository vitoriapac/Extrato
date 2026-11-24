import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBanca,
  normalizeQuestionMinutes,
  parseDurationMinutes,
} from '../../src/domain/questions/bancas.js';

test('normalizeBanca padroniza grafias conhecidas e mantém as desconhecidas', () => {
  assert.equal(normalizeBanca('CESPE'), 'Cebraspe');
  assert.equal(normalizeBanca(' cesgranrio '), 'Cesgranrio');
  assert.equal(normalizeBanca('Fundação Getúlio Vargas'), 'FGV');
  assert.equal(normalizeBanca('Banca Própria  do TJ'), 'Banca Própria do TJ');
  assert.equal(normalizeBanca(''), null);
  assert.equal(normalizeBanca(null), null);
});

test('tempo aceita minutos, decimal com vírgula, mm:ss e hh:mm:ss', () => {
  assert.equal(parseDurationMinutes('25'), 25);
  assert.equal(parseDurationMinutes('2,5'), 2.5);
  assert.equal(parseDurationMinutes('1:30'), 1.5);
  assert.equal(parseDurationMinutes('01:00:00'), 60);
  assert.equal(parseDurationMinutes('abc'), null);
  assert.equal(parseDurationMinutes('1:-2'), null);
  assert.equal(normalizeQuestionMinutes('0:20'), null);
  assert.equal(normalizeQuestionMinutes(''), null);
  assert.equal(normalizeQuestionMinutes(12.4), 12);
});

test('configuração da prova guarda banca padronizada e duração válida', async () => {
  const { normalizeExamBlueprint } = await import('../../src/state/strategic.js');
  const kept = normalizeExamBlueprint({ banca: 'cespe', durationMinutes: '270' });
  assert.equal(kept.banca, 'Cebraspe');
  assert.equal(kept.durationMinutes, 270);
  const dropped = normalizeExamBlueprint({ banca: '  ', durationMinutes: 'x' });
  assert.equal('banca' in dropped, false);
  assert.equal('durationMinutes' in dropped, false);
});
