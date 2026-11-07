import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureStateDefaultsWithDeps } from '../../src/state/ensure-state-defaults.js';

function normalizeSubjects(subjects) {
  /** @type {any} */
  let state = { subjects };
  ensureStateDefaultsWithDeps({
    getState: () => state,
    setState: (next) => { state = next; },
    nowISO: () => '2026-11-07T00:00:00.000Z',
    todayISO: () => '2026-11-07',
    normalizeHistoryEvent: () => {},
    normalizeErrorBreakdown: () => {},
    refreshAllTopicReviewStats: () => {},
  });
  return state.subjects;
}

test('disciplinas nascem fechadas e preservam o estado salvo', () => {
  const [ausente, aberta, fechada] = normalizeSubjects([
    { id: 'a', name: 'A', topics: [] },
    { id: 'b', name: 'B', topics: [], collapsed: false },
    { id: 'c', name: 'C', topics: [], collapsed: true },
  ]);
  assert.equal(ausente.collapsed, true);
  assert.equal(aberta.collapsed, false);
  assert.equal(fechada.collapsed, true);
});
