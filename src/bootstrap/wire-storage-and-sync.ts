import {
  STORAGE_KEY,
  BACKUP_KEY,
  BACKUP_INDEX_KEY,
  AUTOMATIC_BACKUP_SLOTS,
  CURRENT_SCHEMA_VERSION,
  DEMO_STORAGE_KEY,
} from '../state/schema.js';
import { createDefaultState } from '../state/defaults.js';
import { pickPersistentState } from '../state/state-boundaries.js';
import { backupSummary } from '../storage/backup-validator.js';
import { serializeBackup, backupFileName } from '../storage/backup-service.js';
import {
  calculateSha256,
  rotateAutomaticBackup as rotateAutomaticBackupService,
  createBackupValidator,
  createBackupRestoreCoordinator,
} from '../storage/backup-restore-controller.js';
import { createStateSyncCoordinator } from '../state/state-sync-coordinator.js';
import { createBackupModalController } from '../ui/controllers/backup-modal-controller.js';
import { createRemoteSyncProvider } from '../storage/remote-sync-provider.js';
import { createRemoteSyncController } from '../ui/controllers/remote-sync-controller.js';
import { createDemoController } from '../ui/controllers/demo-controller.js';
import { enterDemoMode, exitDemoMode, resetDemoMode } from '../application/demo/demo-mode.js';

export interface WireStorageAndSyncDeps {
  document: Document;
  window: Window;
  instanceId: string;
  isDemoMode: boolean;
  modeFlashKey: string;
  storageManager: any;
  appContext: any;
  migrateState: (raw: any) => any;
  nowISO: () => string;
  todayISO: () => string;
  getState: () => any;
  setState: (next: any) => void;
  ensureStateDefaults: () => void;
  observePlanningCapacity: () => void;
  restoreTimerFromState: () => void;
  render: (scope?: string) => void;
  persistAndRender: () => void;
  activateTab: (tabName: string, updateHash?: boolean) => void;
  flashSaved: (durationMs?: number) => void;
  showToast: (message: string, durationMs?: number) => void;
  showConfirm: (
    message: string,
    onConfirm: (value?: any) => void,
    onCancel?: () => void,
    options?: any
  ) => void;
  showPrompt: (
    message: string,
    options: Record<string, any>,
    onConfirm: (value?: any) => void,
    onCancel?: () => void
  ) => void;
}

export function wireStorageAndSync(deps: WireStorageAndSyncDeps) {
  let suppressBeforeUnloadSave = false;

  const sha256 = (value: any) => calculateSha256(value);
  const rotateAutomaticBackup = (previousRaw: string | null, options: any = {}) =>
    rotateAutomaticBackupService(previousRaw, options, deps.storageManager);

  const validateBackupData = createBackupValidator({
    ensureDefaults: candidate => {
      const previous = deps.getState();
      try {
        deps.setState(candidate);
        deps.ensureStateDefaults();
      } finally {
        deps.setState(previous);
      }
    },
    migrateState: deps.migrateState,
    currentSchemaVersion: CURRENT_SCHEMA_VERSION,
  });

  const stateSyncCoordinator = createStateSyncCoordinator({
    instanceId: deps.instanceId,
    isDemoMode: deps.isDemoMode,
    storageKey: STORAGE_KEY,
    backupIndexKey: BACKUP_INDEX_KEY,
    modeFlashKey: deps.modeFlashKey,
    currentSchemaVersion: CURRENT_SCHEMA_VERSION,
    storageManager: deps.storageManager,
    readLocalState: (key = STORAGE_KEY) => deps.appContext.storage.readLocal(key),
    writeLocalState: (value: any, key = STORAGE_KEY) =>
      deps.appContext.storage.writeLocal(key, value),
    validateBackupData,
    sha256,
    rotateAutomaticBackup,
    nowISO: deps.nowISO,
    getState: deps.getState,
    setState: deps.setState,
    ensureStateDefaults: deps.ensureStateDefaults,
    observePlanningCapacity: deps.observePlanningCapacity,
    restoreTimerFromState: deps.restoreTimerFromState,
    render: () => deps.render(),
    flashSaved: () => deps.flashSaved(),
    showToast: deps.showToast,
  });

  const backupRestoreCoordinator = createBackupRestoreCoordinator({
    getState: deps.getState,
    setState: deps.setState,
    ensureStateDefaults: deps.ensureStateDefaults,
    restoreTimerFromState: deps.restoreTimerFromState,
    setPersistenceBlocked: blocked => stateSyncCoordinator.setPersistenceBlocked(blocked),
    isPersistenceBlocked: () => stateSyncCoordinator.isPersistenceBlocked(),
    persistAndRender: deps.persistAndRender,
    render: () => deps.render(),
    showToast: deps.showToast,
  });

  createBackupModalController({
    document: deps.document,
    window: deps.window,
    storage: {
      get: key => deps.storageManager.get(key),
      remove: key => deps.appContext.storage.remove(key),
    },
    storageKeys: {
      storageKey: STORAGE_KEY,
      backupKey: BACKUP_KEY,
      backupIndexKey: BACKUP_INDEX_KEY,
      automaticSlots: AUTOMATIC_BACKUP_SLOTS,
    },
    sha256: sha256 as (text: string) => Promise<string>,
    validate: validateBackupData,
    serialize: serializeBackup,
    fileName: backupFileName,
    summary: backupSummary,
    getState: deps.getState,
    getDate: deps.todayISO,
    notify: deps.showToast,
    showConfirm: deps.showConfirm,
    showPrompt: deps.showPrompt,
    isDemoMode: () => deps.isDemoMode,
    onApplyBackup: backupRestoreCoordinator.applyImportedBackup,
    onResetComplete: () => {
      deps.setState(createDefaultState());
      deps.ensureStateDefaults();
      suppressBeforeUnloadSave = true;
      location.reload();
    },
  }).mount();

  const remoteSyncProvider = createRemoteSyncProvider({
    fetch: deps.window.fetch.bind(deps.window),
    origin: location.origin,
  });
  createRemoteSyncController({
    document: deps.document,
    window: deps.window,
    provider: remoteSyncProvider,
    getState: () => pickPersistentState(deps.getState()),
    validate: validateBackupData,
    describe: ({ normalized, version }: any) => backupSummary(normalized, version),
    confirm: deps.showConfirm,
    createSnapshot: () =>
      rotateAutomaticBackup(JSON.stringify(pickPersistentState(deps.getState()))),
    onImported: backupRestoreCoordinator.applyImportedBackup,
    notify: deps.showToast,
    isDisabled: () => deps.isDemoMode,
  }).mount();

  createDemoController({
    document: deps.document,
    storage: sessionStorage,
    demoKey: DEMO_STORAGE_KEY,
    flashKey: deps.modeFlashKey,
    isDemo: deps.isDemoMode,
    getState: deps.getState,
    enterMode: enterDemoMode,
    resetMode: resetDemoMode,
    exitMode: exitDemoMode,
    confirm: deps.showConfirm,
    reload: () => {
      suppressBeforeUnloadSave = true;
      stateSyncCoordinator.appStateStore.cancelPendingSave();
      location.reload();
    },
    activateTab: deps.activateTab,
  }).mount();

  return {
    sha256,
    rotateAutomaticBackup,
    validateBackupData,
    stateSyncCoordinator,
    backupRestoreCoordinator,
    appStateStore: stateSyncCoordinator.appStateStore,
    scheduleSave: stateSyncCoordinator.scheduleSave,
    enqueueStateTransaction: stateSyncCoordinator.enqueueStateTransaction,
    loadState: stateSyncCoordinator.loadState,
    canSaveBeforeUnload: () =>
      !suppressBeforeUnloadSave &&
      !stateSyncCoordinator.isPersistenceBlocked() &&
      !stateSyncCoordinator.appStateStore.isTransactionActive(),
  };
}
