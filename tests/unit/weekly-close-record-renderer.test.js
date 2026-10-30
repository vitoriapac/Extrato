import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWeeklyCloseRecord } from '../../src/ui/renderers/weekly-close-record-renderer.js';
import {
  createWeeklyCloseSnapshot,
  planWeeklyCloseRevision,
} from '../../src/application/analytics/weekly-close-snapshot.js';

const formatMinutes = minutes => `${minutes} min`;
const escapeHtml = value => String(value ?? '');
const model = executedMinutes => ({
  period: { start: '2026-10-19', end: '2026-10-25' },
  activeExamTags: [],
  weeklyClose: {
    state: 'available',
    investment: { plannedMinutes: 120, executedMinutes, adherence: 50 },
    questions: { resolved: 10, accuracy: 70 },
    priorities: [],
  },
  gapMap: {},
  decisionHistory: {},
});
const view = (snapshots, candidate, extra = {}) =>
  renderWeeklyCloseRecord({
    close: candidate?.weeklyClose || { state: 'insufficient' },
    candidate,
    plan: candidate ? planWeeklyCloseRevision(snapshots, candidate) : null,
    previewOpen: false,
    savedNow: false,
    formatMinutes,
    escapeHtml,
    ...extra,
  });

test('retrato sem evidência mostra o que falta e atalhos, sem botão de salvar', () => {
  const html = view([], null);
  assert.match(html, /ainda não pode ser salvo/);
  assert.match(html, /navigateKpi\('questoes'\)/);
  assert.doesNotMatch(html, /saveWeeklyCloseSnapshot/);
});

test('retrato só salva depois da prévia, que mostra exatamente o período e os números', () => {
  const candidate = createWeeklyCloseSnapshot(model(60), { id: 'preview', savedAt: null });
  const closed = view([], candidate);
  assert.match(closed, /openWeeklyCloseRecord\(\)/);
  assert.doesNotMatch(closed, /saveWeeklyCloseSnapshot/);

  const open = view([], candidate, { previewOpen: true });
  assert.match(open, /Será registrado assim/);
  assert.match(open, /19\/10\/2026 a 25\/10\/2026/);
  assert.match(open, /Realizado<\/dt><dd>60 min/);
  assert.match(open, /saveWeeklyCloseSnapshot\(\)/);
});

test('nova revisão mostra o que mudou e que a anterior continua guardada', () => {
  const saved = {
    ...createWeeklyCloseSnapshot(model(60), { id: 'r1', savedAt: '2026-10-25T20:00:00Z' }),
    revision: 1,
  };
  const candidate = createWeeklyCloseSnapshot(model(95), { id: 'preview', savedAt: null });
  const html = view([saved], candidate, { previewOpen: true });
  assert.match(html, /revisão 2/);
  assert.match(html, /Realizado: 60 min → 95 min/);
  assert.match(html, /revisão anterior continua guardada/);
});

test('retrato sem mudanças informa que já está salvo e não oferece salvar de novo', () => {
  const saved = {
    ...createWeeklyCloseSnapshot(model(60), { id: 'r1', savedAt: '2026-10-25T20:00:00Z' }),
    revision: 1,
  };
  const candidate = createWeeklyCloseSnapshot(model(60), { id: 'preview', savedAt: null });
  const html = view([saved], candidate);
  assert.match(html, /Retrato salvo em 25\/10\/2026 · revisão 1/);
  assert.doesNotMatch(html, /saveWeeklyCloseSnapshot|openWeeklyCloseRecord/);
});
