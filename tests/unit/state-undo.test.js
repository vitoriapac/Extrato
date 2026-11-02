import test from 'node:test';
import assert from 'node:assert/strict';
import { captureUndo } from '../../src/application/undo/state-undo.js';

const baseState = () => ({
  schemaVersion: 29,
  updatedAt: '2026-11-02T10:00:00.000Z',
  lastBackupAt: '2026-11-01T10:00:00.000Z',
  activeTimer: { running: false },
  subjects: [{ id: 's1', topics: [{ id: 't1', name: 'Crase' }] }],
  questoes: [
    { id: 'q1', subjectId: 's1', resolved: 10, correct: 7 },
    { id: 'q2', subjectId: 's1', resolved: 5, correct: 5 },
  ],
  uiOnly: { open: true },
});

test('desfazer devolve os dados exatamente como eram, mesmo após salvamento e rotação de backup', () => {
  const state = baseState();
  const original = structuredClone(state);
  const undo = captureUndo(state, () => {
    state.questoes = state.questoes.filter(q => q.id !== 'q1');
  });
  // Autosave and the daily backup rotation touch only bookkeeping fields.
  state.updatedAt = '2026-11-02T10:00:01.000Z';
  state.lastBackupAt = '2026-11-02T10:00:01.000Z';
  assert.equal(undo(state), true);
  assert.deepEqual(state.questoes, original.questoes);
  assert.deepEqual(state.subjects, original.subjects);
  // The save bookkeeping stays current instead of rewinding.
  assert.equal(state.lastBackupAt, '2026-11-02T10:00:01.000Z');
  assert.deepEqual(state.uiOnly, { open: true });
});

test('desfazer recusa quando outros dados mudaram depois da exclusão', () => {
  const state = baseState();
  const undo = captureUndo(state, () => {
    state.questoes.splice(0, 1);
  });
  state.questoes.push({ id: 'q3', subjectId: 's1', resolved: 1, correct: 1 });
  assert.equal(undo(state), false);
  assert.deepEqual(
    state.questoes.map(q => q.id),
    ['q2', 'q3']
  );
});

test('desfazer remove coleções criadas pela ação e não depende do cronômetro ativo', () => {
  const state = baseState();
  delete state.questoes;
  const undo = captureUndo(state, () => {
    state.questoes = [{ id: 'novo', subjectId: 's1', resolved: 1, correct: 1 }];
  });
  state.activeTimer = { running: true, startedAt: 'x' };
  assert.equal(undo(state), true);
  assert.equal('questoes' in state, false);
  assert.deepEqual(state.activeTimer, { running: true, startedAt: 'x' });
});
