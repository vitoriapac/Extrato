import test from 'node:test';
import assert from 'node:assert/strict';
import {
  confirmDestructiveReset,
  exportAutomaticBackupHelper,
  createBackupModalController,
} from '../../src/ui/controllers/backup-modal-controller.js';

function createMockElement() {
  const listeners = {};
  return {
    files: [],
    value: '',
    addEventListener: (event, handler) => {
      listeners[event] = handler;
    },
    removeEventListener: event => {
      delete listeners[event];
    },
    click: () => listeners.click?.(),
    trigger: (event, e) => listeners[event]?.(e),
    listeners,
  };
}

test('confirmDestructiveReset — exige confirmação dupla antes de executar', async () => {
  let confirmMessage = '';
  let promptMessage = '';
  let executed = false;

  const showConfirm = (msg, onOk) => {
    confirmMessage = msg;
    onOk();
  };

  const showPrompt = (msg, config, onOk) => {
    promptMessage = msg;
    assert.equal(config.validate('LIMPAR'), '');
    assert.equal(config.validate('ERRADO'), 'Digite LIMPAR exatamente como exibido.');
    onOk();
  };

  confirmDestructiveReset(showConfirm, showPrompt, async () => {
    executed = true;
  });

  assert.ok(confirmMessage.includes('Esta ação excluirá disciplinas'));
  assert.ok(promptMessage.includes('Digite LIMPAR para confirmar'));
  assert.equal(executed, true);
});

test('exportAutomaticBackupHelper — bloqueia em modo de demonstração', async () => {
  const notifications = [];
  const result = await exportAutomaticBackupHelper({
    storage: { get: async () => null },
    backupIndexKey: 'backup-index',
    sha256: async () => 'hash',
    validate: () => ({ valid: true }),
    download: () => {},
    notify: msg => notifications.push(msg),
    isDemoMode: () => true,
    todayISO: () => '2026-10-25',
  });

  assert.equal(result, false);
  assert.equal(notifications[0], 'A recuperação real fica indisponível durante a demonstração.');
});

test('exportAutomaticBackupHelper — valida checksum e faz download do snapshot mais recente', async () => {
  const downloads = [];
  const storageData = {
    'backup-index': JSON.stringify({
      snapshots: [
        { key: 'slot-1', createdAt: '2026-10-20T10:00:00Z', checksum: 'hash1' },
        { key: 'slot-2', createdAt: '2026-10-25T12:00:00Z', checksum: 'hash2' },
      ],
    }),
    'slot-2': '{"schemaVersion":28,"subjects":[]}',
  };

  const result = await exportAutomaticBackupHelper({
    storage: { get: async key => storageData[key] || null },
    backupIndexKey: 'backup-index',
    sha256: async () => 'hash2',
    validate: () => ({ valid: true }),
    download: (raw, name) => downloads.push({ raw, name }),
    notify: () => {},
    isDemoMode: () => false,
    todayISO: () => '2026-10-25',
  });

  assert.equal(result, true);
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].name, 'recuperacao-extrato-estudos-2026-10-25.json');
  assert.equal(downloads[0].raw, '{"schemaVersion":28,"subjects":[]}');
});

test('createBackupModalController — orquestra listeners, importação e limpeza de dados', async () => {
  const elements = {
    exportBackupBtn: createMockElement(),
    exportAutomaticBackupBtn: createMockElement(),
    importBackupBtn: createMockElement(),
    importBackupFile: createMockElement(),
    clearAllDataBtn: createMockElement(),
  };

  const removedKeys = [];
  const downloads = [];
  const appliedBackups = [];
  let resetCompleted = false;

  const mockWindow = {
    Blob: class {
      constructor(parts) {
        this.parts = parts;
      }
    },
    URL: {
      createObjectURL: () => 'blob:url',
      revokeObjectURL: () => {},
    },
    FileReader: class {
      readAsText() {
        this.result = '{"schemaVersion":28,"subjects":[]}';
        this.onload();
      }
    },
  };

  const mockDocument = {
    getElementById: id => elements[id],
    createElement: () => ({
      click: () => downloads.push('download-clicked'),
      remove: () => {},
    }),
    body: { appendChild: () => {} },
  };

  const controller = createBackupModalController({
    document: mockDocument,
    window: mockWindow,
    storage: {
      get: async () => null,
      remove: async key => removedKeys.push(key),
    },
    storageKeys: {
      storageKey: 'studytrack_state',
      backupKey: 'studytrack_backup',
      backupIndexKey: 'studytrack_backup_index',
      automaticSlots: 3,
    },
    sha256: async () => 'hash',
    validate: data => ({ valid: true, normalized: data, version: 28 }),
    serialize: state => JSON.stringify(state),
    fileName: date => `backup-${date}.json`,
    summary: () => 'Backup v28 com 0 disciplinas.',
    getState: () => ({ schemaVersion: 28 }),
    getDate: () => '2026-10-25',
    notify: () => {},
    showConfirm: (msg, onOk) => onOk(),
    showPrompt: (msg, cfg, onOk) => onOk(),
    isDemoMode: () => false,
    onApplyBackup: normalized => appliedBackups.push(normalized),
    onResetComplete: () => {
      resetCompleted = true;
    },
  });

  controller.mount();

  // Test export
  elements.exportBackupBtn.click();
  assert.equal(downloads.length, 1);

  // Test import file
  elements.importBackupFile.files = [{ size: 50 }];
  elements.importBackupFile.trigger('change');
  assert.equal(appliedBackups.length, 1);
  assert.equal(appliedBackups[0].schemaVersion, 28);

  // Test clear all data
  elements.clearAllDataBtn.click();
  // Aguarda promises da limpeza
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.equal(resetCompleted, true);
  assert.ok(removedKeys.includes('studytrack_state'));
  assert.ok(removedKeys.includes('studytrack_backup'));
  assert.ok(removedKeys.includes('studytrack_backup_index'));
  assert.ok(removedKeys.includes('studytrack_backup-0'));
  assert.ok(removedKeys.includes('studytrack_backup-1'));
  assert.ok(removedKeys.includes('studytrack_backup-2'));

  controller.unmount();
});
