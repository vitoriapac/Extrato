import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPersistedState, unreadableStateKey } from '../../src/state/load-persisted-state.js';
import { createAppStateStore } from '../../src/state/app-state-store.js';

const KEY = 'main';
const INDEX = 'backup-index';

function fakeStorage(entries) {
  const data = new Map(Object.entries(entries));
  return {
    data,
    get: async key => data.get(key) ?? null,
    set: async (key, value) => (data.set(key, value), true),
  };
}

// Aceita só schemaVersion 1..2, como validateBackupData faria.
const normalize = raw => {
  const value = JSON.parse(raw);
  if (!Array.isArray(value.subjects) || value.schemaVersion > 2) throw new Error('inválido');
  return value;
};

const load = storage =>
  loadPersistedState({
    storage,
    storageKey: KEY,
    backupIndexKey: INDEX,
    currentSchemaVersion: 2,
    normalize,
    serialize: value => JSON.stringify(value),
    sha256: async () => null,
  });

const snapshotEntries = {
  [INDEX]: JSON.stringify({ snapshots: [{ key: 'slot-0', createdAt: '2026-10-01T00:00:00Z' }] }),
  'slot-0': JSON.stringify({ schemaVersion: 2, subjects: ['antigo'] }),
};

test('loadPersistedState — dados válidos são carregados sem bloqueio', async () => {
  const raw = JSON.stringify({ schemaVersion: 2, subjects: ['a'] });
  const result = await load(fakeStorage({ [KEY]: raw }));
  assert.deepEqual(result.state.subjects, ['a']);
  assert.equal(result.blocked, false);
  assert.equal(result.persisted, raw);
});

test('loadPersistedState — dados de versão mais nova não são trocados por snapshot antigo', async () => {
  const newer = JSON.stringify({ schemaVersion: 3, subjects: ['novo'] });
  const storage = fakeStorage({ [KEY]: newer, ...snapshotEntries });
  const result = await load(storage);
  assert.equal(result.state, null);
  assert.equal(result.blocked, true);
  assert.equal(storage.data.get(KEY), newer);
  assert.equal(storage.data.get(unreadableStateKey(KEY)), newer);
});

test('loadPersistedState — dado corrompido recupera o snapshot e preserva a cópia ilegível', async () => {
  const storage = fakeStorage({ [KEY]: '{corrompido', ...snapshotEntries });
  const result = await load(storage);
  assert.deepEqual(result.state.subjects, ['antigo']);
  assert.equal(result.blocked, false);
  assert.equal(storage.data.get(KEY), result.persisted);
  assert.equal(storage.data.get(unreadableStateKey(KEY)), '{corrompido');
});

test('loadPersistedState — sem snapshot válido bloqueia e não toca nos dados', async () => {
  const storage = fakeStorage({ [KEY]: '{corrompido' });
  const result = await load(storage);
  assert.equal(result.state, null);
  assert.equal(result.blocked, true);
  assert.equal(storage.data.get(KEY), '{corrompido');
});

test('createAppStateStore — com gravação bloqueada nada é escrito', async () => {
  const writes = [];
  const toasts = [];
  const store = createAppStateStore({
    getState: () => ({ subjects: [] }),
    pickPersistentState: s => s,
    writeLocalState: v => {
      writes.push(v);
    },
    readLocalState: () => null,
    STORAGE_KEY: KEY,
    nowISO: () => '2026-10-27T00:00:00Z',
    isDemoMode: () => false,
    isPersistenceBlocked: () => true,
    rotateAutomaticBackup: async () => true,
    writePersistentState: async v => (writes.push(v), true),
    showToast: msg => toasts.push(msg),
  });
  store.scheduleSave();
  await store.saveState();
  await store.flushSaves();
  assert.deepEqual(writes, []);
  assert.equal(toasts.length, 2);
});
