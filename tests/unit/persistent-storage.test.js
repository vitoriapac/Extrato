import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensurePersistentStorage,
  getPersistentStorageStatus,
  formatPersistentStorageSummary,
} from '../../src/storage/persistent-storage.js';

test('ensurePersistentStorage — retorna unsupported quando API não existe', async () => {
  const res = await ensurePersistentStorage(null);
  assert.deepEqual(res, { supported: false, persisted: null, requested: false });
});

test('ensurePersistentStorage — não solicita novamente se já está persistido', async () => {
  let persistCalled = false;
  const res = await ensurePersistentStorage({
    storage: {
      persisted: async () => true,
      persist: async () => {
        persistCalled = true;
        return true;
      },
    },
  });
  assert.deepEqual(res, { supported: true, persisted: true, requested: false });
  assert.equal(persistCalled, false);
});

test('ensurePersistentStorage — solicita persist() quando ainda temporário', async () => {
  const res = await ensurePersistentStorage({
    storage: {
      persisted: async () => false,
      persist: async () => true,
    },
  });
  assert.deepEqual(res, { supported: true, persisted: true, requested: true });
});

test('getPersistentStorageStatus e formatPersistentStorageSummary — retornam leitura clara', async () => {
  const status = await getPersistentStorageStatus({
    storage: {
      persisted: async () => true,
      estimate: async () => ({ usage: 2.5 * 1024 * 1024, quota: 500 * 1024 * 1024 }),
    },
  });
  assert.equal(status.supported, true);
  assert.equal(status.persisted, true);
  assert.equal(status.usageMb, 2.5);
  assert.equal(status.quotaMb, 500);
  assert.match(formatPersistentStorageSummary(status), /Armazenamento persistente ativo/);
  assert.match(
    formatPersistentStorageSummary({ supported: true, persisted: false, usageMb: null, quotaMb: null }),
    /Armazenamento temporário/
  );
});
