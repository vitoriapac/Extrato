import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  calculateSha256,
  rotateAutomaticBackup,
  createBackupRestoreCoordinator,
} from '../../src/storage/backup-restore-controller.js';

class MockStorage {
  constructor() {
    this.store = new Map();
  }
  async get(key) {
    return this.store.get(key) || null;
  }
  async set(key, value) {
    this.store.set(key, value);
    return true;
  }
}

test('Backup & Restore Controller — calculateSha256 calcula checksum hexadecimal', async () => {
  const text = 'StudyTrack Unit Test SHA-256';
  const expected = crypto.createHash('sha256').update(text).digest('hex');

  const actual = await calculateSha256(text, crypto.webcrypto.subtle);
  assert.equal(actual, expected);
});

test('Backup & Restore Controller — rotateAutomaticBackup gerencia slots rotativos e índice', async () => {
  const storage = new MockStorage();
  const backupKey = 'test-backup';
  const indexKey = 'test-backup-index';

  // 1. Inválido (sem subjects): retorna false
  const invalid = await rotateAutomaticBackup(JSON.stringify({ foo: 'bar' }), {
    backupKey,
    indexKey,
    storage,
    slotCount: 3,
  });
  assert.equal(invalid, false);

  // 2. Três rotações válidas com slotCount 2
  const snapshot1 = {
    subjects: [{ id: 's1', name: 'Direito' }],
    updatedAt: '2026-10-29T10:00:00.000Z',
  };
  const ok1 = await rotateAutomaticBackup(JSON.stringify(snapshot1), {
    backupKey,
    indexKey,
    storage,
    slotCount: 2,
    nowISO: () => '2026-10-29T10:00:00.000Z',
  });
  assert.equal(ok1, true);

  const snapshot2 = {
    subjects: [{ id: 's2', name: 'Processo' }],
    updatedAt: '2026-10-29T11:00:00.000Z',
  };
  const ok2 = await rotateAutomaticBackup(JSON.stringify(snapshot2), {
    backupKey,
    indexKey,
    storage,
    slotCount: 2,
    nowISO: () => '2026-10-29T11:00:00.000Z',
  });
  assert.equal(ok2, true);

  // SlotCount é 2, ao inserir snapshot 3, sobrescreve o slot 0
  const snapshot3 = {
    subjects: [{ id: 's3', name: 'Constitucional' }],
    updatedAt: '2026-10-29T12:00:00.000Z',
  };
  const ok3 = await rotateAutomaticBackup(JSON.stringify(snapshot3), {
    backupKey,
    indexKey,
    storage,
    slotCount: 2,
    nowISO: () => '2026-10-29T12:00:00.000Z',
  });
  assert.equal(ok3, true);

  const rawIndex = await storage.get(indexKey);
  assert.ok(rawIndex);
  const index = JSON.parse(rawIndex);
  assert.equal(index.snapshots.length, 2);
  assert.equal(index.snapshots[0].slot, 0); // O mais recente (snapshot3)
});

test('Backup & Restore Controller — applyImportedBackup realiza rollback em caso de exceção', () => {
  let currentState = { id: 'original-state' };
  let persistenceBlocked = false;
  let renderCalled = false;
  let persistAndRenderCalled = false;
  let toastMessage = '';

  const coordinator = createBackupRestoreCoordinator({
    getState: () => currentState,
    setState: s => {
      currentState = s;
    },
    ensureStateDefaults: () => {
      if (currentState.shouldFail) {
        throw new Error('Falha simulada na conversão de defaults');
      }
    },
    restoreTimerFromState: () => {},
    setPersistenceBlocked: b => {
      persistenceBlocked = b;
    },
    isPersistenceBlocked: () => persistenceBlocked,
    persistAndRender: () => {
      persistAndRenderCalled = true;
    },
    render: () => {
      renderCalled = true;
    },
    showToast: msg => {
      toastMessage = msg;
    },
  });

  // Teste de sucesso
  const success = coordinator.applyImportedBackup({ id: 'imported-valid' });
  assert.equal(success, true);
  assert.equal(currentState.id, 'imported-valid');
  assert.equal(persistAndRenderCalled, true);
  assert.equal(toastMessage, 'Backup importado com sucesso.');

  // Teste de falha com rollback
  const failure = coordinator.applyImportedBackup({ id: 'corrupt', shouldFail: true });
  assert.equal(failure, false);
  assert.equal(currentState.id, 'imported-valid'); // Voltou para o estado anterior
  assert.equal(renderCalled, true);
  assert.ok(toastMessage.includes('preservados'));
});
