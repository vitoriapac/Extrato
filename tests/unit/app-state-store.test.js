import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppStateStore } from '../../src/state/app-state-store.js';

test('createAppStateStore — agenda gravação com debounce e atualiza updatedAt', (t, done) => {
  let written = null;
  let renderCalled = false;
  const dummyState = { count: 0, updatedAt: '' };

  const store = createAppStateStore({
    getState: () => dummyState,
    pickPersistentState: s => ({ count: s.count, updatedAt: s.updatedAt }),
    writeLocalState: v => {
      written = v;
    },
    readLocalState: () => null,
    STORAGE_KEY: 'test-key',
    nowISO: () => '2026-03-16T12:00:00Z',
    isDemoMode: () => false,
    rotateAutomaticBackup: async () => true,
    appContext: { storage: { writePersistent: async () => {} } },
    onRenderActive: () => {
      renderCalled = true;
    },
    showToast: () => {},
  });

  store.persistAndRender();

  assert.equal(renderCalled, true);
  assert.equal(dummyState.updatedAt, '2026-03-16T12:00:00Z');
  assert.match(written, /"count":0/);
  done();
});

test('createAppStateStore — executa transação atômica e defere gravações concorrentes', async () => {
  let transactionDone = false;
  const dummyState = { count: 1, updatedAt: '' };

  const store = createAppStateStore({
    getState: () => dummyState,
    pickPersistentState: s => s,
    writeLocalState: () => {},
    readLocalState: () => null,
    STORAGE_KEY: 'test-key',
    nowISO: () => '2026-03-16T12:00:00Z',
    isDemoMode: () => false,
    rotateAutomaticBackup: async () => true,
    appContext: { storage: { writePersistent: async () => {} } },
    onRenderActive: () => {},
    showToast: () => {},
  });

  const txPromise = store.enqueueStateTransaction(async () => {
    assert.equal(store.isTransactionActive(), true);
    // Chamada concorrente durante a transação
    store.scheduleSave();
    assert.equal(store.hasDeferredSave(), true);
    transactionDone = true;
    return 'ok';
  });

  const res = await txPromise;
  assert.equal(res, 'ok');
  assert.equal(transactionDone, true);
  assert.equal(store.isTransactionActive(), false);
});
