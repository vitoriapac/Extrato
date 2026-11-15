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

test('Planejamento tem 4 sub-abas e o link antigo de Metas abre "Prova e metas"', async () => {
  const { PLANNING_SUBTABS } = await import('../../src/ui/planning-subtabs.js');
  const { PLANNING_SUBTAB_DEFS } = await import('../../src/ui/components/PlanningSubtabsNav.js');
  assert.deepEqual([...PLANNING_SUBTABS], ['semana', 'prova', 'fechamento', 'historico']);
  assert.deepEqual(PLANNING_SUBTAB_DEFS.map(item => item.id), ['semana', 'prova', 'fechamento', 'historico']);
  assert.equal(PLANNING_SUBTAB_DEFS.find(item => item.id === 'prova').label, 'Prova e metas');
  assert.equal(subtabFromHash('#planejamento/metas'), 'prova');
  assert.equal(subtabFromHash('#metas/metas'), 'prova');
  assert.equal(isPlanningSubtab('metas'), false);
});
