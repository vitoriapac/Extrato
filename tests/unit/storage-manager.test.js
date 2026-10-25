import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorageManager } from '../../src/storage/repository.js';

const copy = (updatedAt, marker) => JSON.stringify({ updatedAt, marker });
const fakeIndexedDb = (values = {}, { failing = false } = {}) => ({
  values,
  get: async key => {
    if (failing) throw new Error('IndexedDB indisponível');
    return values[key] ?? null;
  },
  set: async (key, value) => {
    if (failing) throw new Error('IndexedDB indisponível');
    values[key] = value;
    return true;
  },
  remove: async key => delete values[key],
});
const fakeLocal = (values = {}) => ({
  values,
  get: key => values[key] ?? null,
  set: (key, value) => ((values[key] = value), true),
  remove: key => delete values[key],
});
const quiet = async run => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return await run();
  } finally {
    console.warn = warn;
  }
};

test('ao carregar, a cópia com updatedAt mais novo vence, de qualquer lado', async () => {
  const newerInIdb = createStorageManager(undefined, {
    indexedDb: fakeIndexedDb({ state: copy('2026-10-02T10:00:00Z', 'idb') }),
    local: fakeLocal({ state: copy('2026-10-01T10:00:00Z', 'local') }),
    windowStorage: null,
  });
  assert.equal(JSON.parse(await newerInIdb.get('state')).marker, 'idb');
  const newerInLocal = createStorageManager(undefined, {
    indexedDb: fakeIndexedDb({ state: copy('2026-10-01T10:00:00Z', 'idb') }),
    local: fakeLocal({ state: copy('2026-10-02T10:00:00Z', 'local') }),
    windowStorage: null,
  });
  assert.equal(JSON.parse(await newerInLocal.get('state')).marker, 'local');
});

test('cópia ilegível ou sem updatedAt perde para uma cópia válida', async () => {
  const manager = createStorageManager(undefined, {
    indexedDb: fakeIndexedDb({ state: '{corrompido' }),
    local: fakeLocal({ state: copy('2026-10-01T10:00:00Z', 'local') }),
    windowStorage: null,
  });
  assert.equal(JSON.parse(await manager.get('state')).marker, 'local');
});

test('sem IndexedDB, lê e grava pelo localStorage', async () => {
  const local = fakeLocal({ state: copy('2026-10-01T10:00:00Z', 'local') });
  const manager = createStorageManager(undefined, {
    indexedDb: fakeIndexedDb({}, { failing: true }),
    local,
    windowStorage: null,
  });
  assert.equal(JSON.parse(await quiet(() => manager.get('state'))).marker, 'local');
  assert.equal(await quiet(() => manager.set('state', copy('2026-10-03T10:00:00Z', 'novo'))), true);
  assert.equal(JSON.parse(local.values.state).marker, 'novo');
  assert.equal(await quiet(() => manager.get('ausente')), null);
});

test('setDurable grava fora do localStorage e libera a cópia local da chave', async () => {
  const indexedDb = fakeIndexedDb(),
    local = fakeLocal({ backup: 'cópia antiga', other: 'mantém' });
  const manager = createStorageManager(undefined, { indexedDb, local, windowStorage: null });
  assert.equal(await manager.setDurable('backup', 'novo'), true);
  assert.equal(indexedDb.values.backup, 'novo');
  assert.equal(local.values.backup, undefined);
  assert.equal(local.values.other, 'mantém');
  const offline = createStorageManager(undefined, {
    indexedDb: fakeIndexedDb({}, { failing: true }),
    local: fakeLocal({ backup: 'cópia antiga' }),
    windowStorage: null,
  });
  assert.equal(await quiet(() => offline.setDurable('backup', 'novo')), false);
});
