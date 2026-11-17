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
  assert.match(html, /Detalhamento do estudo ligado a tarefas indisponível/);
  assert.match(html, /4,2× o tempo com tarefa marcada/);
  assert.match(html, /03\/11 a 09\/11/);
  assert.doesNotMatch(html, /Infinity|NaN/);
});

import { assessWeekRecoverability, buildWeekReconciliationFromExecution } from '../../src/ui/tabs/goals/week-reconciliation.js';

test('assessWeekRecoverability diferencia em dia, recuperável e exige replanejamento', () => {
  assert.equal(
    assessWeekRecoverability({
      capacityMin: 720,
      plannedMin: 18 * 60,
      studiedMin: 14 * 60,
      linkedMin: 14 * 60,
      remainingCapacityMin: 6 * 60,
    }).recoverability,
    'recoverable'
  );
  assert.equal(
    assessWeekRecoverability({
      capacityMin: 720,
      plannedMin: 18 * 60,
      studiedMin: 12 * 60,
      linkedMin: 12 * 60,
      remainingCapacityMin: 4 * 60,
    }).recoverability,
    'needs_replan'
  );
  assert.equal(
    assessWeekRecoverability({
      capacityMin: 720,
      plannedMin: 300,
      studiedMin: 300,
      linkedMin: 300,
      remainingCapacityMin: 120,
    }).recoverability,
    'on_track'
  );
  assert.equal(
    assessWeekRecoverability({
      capacityMin: 0,
      plannedMin: 300,
      studiedMin: 0,
      linkedMin: 0,
      remainingCapacityMin: 0,
    }).recoverability,
    null
  );
});

test('buildWeekReconciliationFromExecution calcula capacidade restante com hoje + dias futuros', () => {
  const model = {
    capacityMinutes: 600,
    capacityInformed: true,
    plannedMinutes: 420,
    studiedMinutes: 180,
    days: [
      { date: '2026-11-09', capacityMinutes: 120, studiedMinutes: 120, future: false },
      { date: '2026-11-10', capacityMinutes: 120, studiedMinutes: 60, future: false }, // hoje: 60 min restantes
      { date: '2026-11-11', capacityMinutes: 180, studiedMinutes: 0, future: true },
      { date: '2026-11-12', capacityMinutes: 180, studiedMinutes: 0, future: true },
    ],
    strategic: {
      reconciliation: {
        studiedMinutes: 180,
        linkedMinutes: 180,
        additionalMinutes: 0,
        incompatibleMinutes: 0,
        otherPeriodMinutes: 0,
      },
    },
  };
  const rec = buildWeekReconciliationFromExecution(model, iso => iso.split('-').reverse().join('/'));
  assert.equal(rec.remainingCapacityMin, 420); // 60 hoje + 180 + 180 futuros
  assert.equal(rec.pendingPlannedMin, 240);
  assert.equal(rec.recoverability, 'recoverable');
});
