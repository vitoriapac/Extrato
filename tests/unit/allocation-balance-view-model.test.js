import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAllocationBalanceViewModel } from '../../src/application/analytics/build-allocation-balance-view-model.js';

test('buildAllocationBalanceViewModel calcula proporções de horas e pesos corretamente', () => {
  const subjects = [
    { id: 's1', name: 'Direito Constitucional', examWeightPercent: 30 },
    { id: 's2', name: 'Direito Administrativo', examWeightPercent: 20 },
    { id: 's3', name: 'Português', examWeightPercent: 50 },
  ];

  // 10h total: 6h em Constitucional (60%), 1h em Administrativo (10%), 3h em Português (30%)
  const sessions = [
    { subjectId: 's1', durationSeconds: 6 * 3600, date: '2026-10-15' },
    { subjectId: 's2', durationSeconds: 1 * 3600, date: '2026-10-16' },
    { subjectId: 's3', durationSeconds: 3 * 3600, date: '2026-10-17' },
  ];

  const model = buildAllocationBalanceViewModel({
    subjects,
    sessions,
    today: '2026-10-20',
  });

  assert.equal(model.totalHours, 10);
  assert.equal(model.hasBlueprint, true);

  // Administrativo tem 10% do tempo vs 20% do peso (diferença -10% => subalocado)
  const adm = model.rows.find(r => r.subjectId === 's2');
  assert.ok(adm);
  assert.equal(adm.status, 'suballocated');
  assert.equal(adm.statusLabel, 'Subalocada');
  assert.equal(adm.difference, -10);

  // Constitucional tem 60% do tempo vs 30% do peso (diferença +30% => superalocado)
  const consti = model.rows.find(r => r.subjectId === 's1');
  assert.ok(consti);
  assert.equal(consti.status, 'overallocated');
  assert.equal(consti.statusLabel, 'Superalocada');

  // Subalocadas aparecem no topo da ordenação, com maior déficit (-20%) em primeiro lugar
  assert.equal(model.rows[0].subjectId, 's3');
  assert.equal(model.rows[1].subjectId, 's2');
});

test('buildAllocationBalanceViewModel retorna modelo limpo quando não há sessões', () => {
  const subjects = [
    { id: 's1', name: 'Constitucional', examWeightPercent: 50 },
    { id: 's2', name: 'Administrativo', examWeightPercent: 50 },
  ];

  const model = buildAllocationBalanceViewModel({
    subjects,
    sessions: [],
    today: '2026-10-20',
  });

  assert.equal(model.totalHours, 0);
  assert.equal(model.rows.length, 2);
  assert.equal(model.rows[0].hoursSpent, 0);
});
