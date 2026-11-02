import test from 'node:test';
import assert from 'node:assert/strict';
import { subtabFromHash, isPlanningSubtab } from '../../src/ui/planning-subtabs.js';

test('o hash do Planejamento aponta a sub-aba; o resto fica com a escolha atual', () => {
  assert.equal(subtabFromHash('#planejamento/fechamento'), 'fechamento');
  assert.equal(subtabFromHash('#metas/prova'), 'prova');
  assert.equal(subtabFromHash('#planejamento'), null);
  assert.equal(subtabFromHash('#planejamento/inexistente'), null);
  assert.equal(subtabFromHash('#hoje/semana'), null);
  assert.equal(isPlanningSubtab('historico'), true);
  assert.equal(isPlanningSubtab('Histórico'), false);
});
