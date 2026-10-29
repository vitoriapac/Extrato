import type { AppState } from '../core/types.js';
import { structuredCloneSafe } from '../core/utils.js';
import { createAppStateStore } from './app-state-store.js';
import { loadPersistedState } from './load-persisted-state.js';
import { pickPersistentState } from './state-boundaries.js';

export interface StateSyncCoordinatorOptions {
  instanceId: string;
  isDemoMode: boolean;
  storageKey: string;
  backupIndexKey: string;
  modeFlashKey: string;
  currentSchemaVersion: number;
  storageManager: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: string) => Promise<any>;
  };
  readLocalState: (key?: string) => string | null;
  writeLocalState: (value: any, key?: string) => boolean;
  validateBackupData: (raw: any) => any;
  sha256: (value: any) => Promise<string | null>;
  rotateAutomaticBackup: (previousRaw: string | null, options?: any) => any;
  nowISO: () => string;
  getState: () => AppState;
  setState: (next: AppState) => void;
  ensureStateDefaults: () => void;
  observePlanningCapacity: () => void;
  restoreTimerFromState: () => void;
  render: () => void;
  flashSaved: () => void;
  showToast: (message: string) => void;
  sessionStorage?: Storage;
}

export function createStateSyncCoordinator(options: StateSyncCoordinatorOptions) {
  const {
    instanceId,
    isDemoMode,
    storageKey,
    backupIndexKey,
    modeFlashKey,
    currentSchemaVersion,
    storageManager,
    readLocalState,
    writeLocalState,
    validateBackupData,
    sha256,
    rotateAutomaticBackup,
    nowISO,
    getState,
    setState,
    ensureStateDefaults,
    observePlanningCapacity,
    restoreTimerFromState,
    render,
    flashSaved,
    showToast,
    sessionStorage: sessionStore = typeof sessionStorage !== 'undefined'
      ? sessionStorage
      : undefined,
  } = options;

  const stateChannel =
    !isDemoMode && typeof BroadcastChannel === 'function'
      ? new BroadcastChannel('extrato-estudos-state')
      : null;

  let applyingRemoteState = false;
  let persistenceBlocked = false;

  function isPersistenceBlocked() {
    return persistenceBlocked;
  }

  function setPersistenceBlocked(blocked: boolean) {
    persistenceBlocked = blocked;
  }

  function normalizeAndValidateState(raw: any) {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : structuredCloneSafe(raw);
    const validation = validateBackupData(parsed);
    if (!validation.valid) throw new Error((validation as { message: string }).message);
    return validation.normalized;
  }

  function notifyRemoteState(serialized: string, updatedAt?: string | null) {
    if (!applyingRemoteState) {
      stateChannel?.postMessage({
        source: instanceId,
        serialized,
        updatedAt: updatedAt !== undefined ? updatedAt : JSON.parse(serialized).updatedAt || null,
      });
    }
  }

  const appStateStore = createAppStateStore({
    getState,
    pickPersistentState,
    writeLocalState,
    readLocalState,
    STORAGE_KEY: storageKey,
    nowISO,
    isDemoMode: () => isDemoMode,
    isPersistenceBlocked: () => persistenceBlocked,
    rotateAutomaticBackup,
    writePersistentState: serialized => storageManager.set(storageKey, serialized),
    notifyRemoteState: serialized => notifyRemoteState(serialized),
    onSaved: () => flashSaved(),
    showToast,
  });

  stateChannel?.addEventListener('message', event => {
    const message = event.data;
    if (!message || message.source === instanceId || typeof message.serialized !== 'string') return;
    const remoteTime = Date.parse(message.updatedAt || 0) || 0;
    const localTime = Date.parse(String(getState().updatedAt || 0)) || 0;
    if (remoteTime <= localTime) return;
    try {
      applyingRemoteState = true;
      setState(normalizeAndValidateState(message.serialized));
      writeLocalState(message.serialized);
      appStateStore.markPersisted(message.serialized);
      persistenceBlocked = false;
      render();
      showToast('Dados atualizados por outra aba.');
    } catch (error) {
      console.warn('Atualizacao de outra aba ignorada', error);
    } finally {
      applyingRemoteState = false;
    }
  });

  async function loadState() {
    let loadWarning = '';
    try {
      const result = await loadPersistedState({
        storage: storageManager as any,
        storageKey,
        backupIndexKey,
        currentSchemaVersion,
        normalize: normalizeAndValidateState,
        serialize: value => JSON.stringify(pickPersistentState(value)),
        sha256,
      });
      appStateStore.markPersisted(result.persisted);
      if (result.state) setState(result.state);
      persistenceBlocked = result.blocked;
      loadWarning = result.warning;
    } catch (e) {
      console.error('Erro ao carregar estado salvo', e);
      loadWarning =
        'Não foi possível carregar os dados salvos. O aplicativo iniciou com os dados padrão; importe um backup se necessário.';
    }
    ensureStateDefaults();
    observePlanningCapacity();
    restoreTimerFromState();
    render();
    let modeMessage = '';
    try {
      modeMessage = sessionStore?.getItem(modeFlashKey) || '';
      sessionStore?.removeItem(modeFlashKey);
    } catch (error) {}
    if (loadWarning) showToast(loadWarning);
    else if (modeMessage) showToast(modeMessage);
  }

  return {
    appStateStore,
    scheduleSave: () => appStateStore.scheduleSave(),
    enqueueStateTransaction: (task: () => any) => appStateStore.enqueueStateTransaction(task),
    isPersistenceBlocked,
    setPersistenceBlocked,
    normalizeAndValidateState,
    notifyRemoteState,
    loadState,
  };
}
