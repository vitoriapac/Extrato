import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeekReconciliation } from '../../src/ui/tabs/goals/week-reconciliation.js';

const period = '03 a 09 nov';

test('números da auditoria: o múltiplo não inventa tempo sem vínculo', () => {
  const r = buildWeekReconciliation({
    capacityMin: 720,
    plannedMin: 160,
    studiedMin: 664,
    periodLabel: period,
  });
  assert.equal(r.unlinkedMin, null);
  assert.ok(Math.abs(r.multiple - 4.15) < 0.001);
  assert.equal(r.periodLabel, period);
});

test('plano zerado não gera múltiplo (sem Infinity/NaN)', () => {
  const r = buildWeekReconciliation({
    capacityMin: 720,
    plannedMin: 0,
    studiedMin: 90,
    periodLabel: period,
  });
  assert.equal(r.multiple, null);
  assert.equal(r.unlinkedMin, null);
});

test('estudado abaixo do planejado pode ter estudo sem vínculo', () => {
  const r = buildWeekReconciliation({
    capacityMin: 720,
    plannedMin: 160,
    studiedMin: 60,
    periodLabel: period,
    links: { studiedMinutes: 60, linkedMinutes: 0, additionalMinutes: 60, incompatibleMinutes: 0, otherPeriodMinutes: 0 },
  });
  assert.equal(r.unlinkedMin, 60);
  assert.ok(r.multiple < 1);
});

test('periodLabel é obrigatório', () => {
  assert.throws(() =>
    buildWeekReconciliation({ capacityMin: 1, plannedMin: 1, studiedMin: 1, periodLabel: '' })
  );
});

import { renderPlanExecution } from '../../src/ui/renderers/plan-execution-renderer.js';
test('card mostra múltiplo e informa quando vínculos não estão disponíveis', () => {
  const day = (date, planned) => ({
    date,
    capacityMinutes: 60,
    plannedMinutes: planned,
    studiedMinutes: 0,
    future: false,
  });
  const model = {
    capacityMinutes: 720,
    plannedMinutes: 160,
    studiedMinutes: 664,
    state: 'planned',
    days: [day('2026-11-03', 160), day('2026-11-09', null)],
    history: [],
    strategic: null,
  };
  const html = renderPlanExecution(model, {
    formatDate: iso => iso.split('-').reverse().join('/'),
  });
  assert.match(html, /Detalhamento dos vínculos indisponível/);
  assert.match(html, /4,2× o tempo com tarefa marcada/);
  assert.match(html, /03\/11 a 09\/11/);
  assert.doesNotMatch(html, /Infinity|NaN/);
});
