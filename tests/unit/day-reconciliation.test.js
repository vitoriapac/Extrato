import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDayReconciliation } from '../../src/ui/tabs/today/day-reconciliation.js';

test('plano maior que a disponibilidade vira excedente', () => {
  const r = buildDayReconciliation({ available: 60, planned: 80, executed: 0 });
  assert.equal(r.status, 'over');
  assert.equal(r.overrunMinutes, 20);
  assert.deepEqual(r.rows.map((x) => x.key), ['available', 'planned', 'executed', 'overrun']);
  const last = r.rows.at(-1);
  assert.equal(last.label, 'Excedente');
  assert.equal(last.minutes, 20);
});

test('plano dentro da disponibilidade mostra tempo livre', () => {
  const r = buildDayReconciliation({ available: 90, planned: 80, executed: 0 });
  assert.equal(r.status, 'within');
  assert.equal(r.overrunMinutes, 0);
  assert.deepEqual(r.rows.at(-1), { key: 'free', label: 'Livre', minutes: 10 });
});

test('sem disponibilidade não tem linha de excedente numérica', () => {
  const r = buildDayReconciliation({ available: 0, planned: 80, executed: 0 });
  assert.equal(r.status, 'no-availability');
  assert.equal(r.overrunMinutes, 0);
  assert.deepEqual(r.rows.map((x) => x.key), ['available', 'planned', 'executed']);
});

test('negativos e NaN valem 0', () => {
  const r = buildDayReconciliation({ available: -5, planned: Number.NaN, executed: -1 });
  assert.equal(r.status, 'no-availability');
  assert.deepEqual(r.rows.map((x) => x.minutes), [0, 0, 0]);
});

test('Livre desconta o restante do plano quando informado (igual ao gráfico)', () => {
  const r = buildDayReconciliation({ available: 120, planned: 60, executed: 45, remainingPlanned: 30 });
  assert.equal(r.rows.find(x => x.key === 'free').minutes, 45);
});
