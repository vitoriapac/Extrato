export interface AppStateStoreOptions {
  getState: () => any;
  pickPersistentState: (state: any) => any;
  writeLocalState: (value: string, key?: string) => boolean | void;
  readLocalState: (key?: string) => string | null;
  STORAGE_KEY: string;
  nowISO: () => string;
  isDemoMode: () => boolean;
  rotateAutomaticBackup: (previousRaw: string) => Promise<boolean>;
  appContext?: any;
  writePersistentState?: (serialized: string) => Promise<boolean>;
  notifyRemoteState?: (serialized: string) => void;
  onSaved?: () => void;
  onRenderActive?: () => void;
  showToast: (msg: string) => void;
}

export function createAppStateStore(opts: AppStateStoreOptions) {
  let saveTimeout: any = null;
  let saveQueue: Promise<any> = Promise.resolve();
  let pendingSave: { serialized: string; previousRaw: string | null } | null = null;
  let stateTransactionActive = false;
  let transactionDeferredSave = false;

  async function enqueueSave(serialized: string, previousRaw: string | null = null): Promise<any> {
    pendingSave = { serialized, previousRaw };
    saveQueue = saveQueue
      .then(async () => {
        while (pendingSave) {
          const job = pendingSave;
          pendingSave = null;
          await saveState(job.serialized, job.previousRaw);
        }
      })
      .catch(error => {
        console.error('Falha na fila de gravação', error);
        opts.showToast(
          'Não foi possível concluir a gravação. Exporte um backup para proteger seus dados.'
        );
      });
    return saveQueue;
  }

  function scheduleSave(): void {
    const state = opts.getState();
    if (stateTransactionActive) {
      state.updatedAt = opts.nowISO();
      transactionDeferredSave = true;
      return;
    }
    const previousRaw = opts.readLocalState(opts.STORAGE_KEY);
    state.updatedAt = opts.nowISO();
    const serialized = JSON.stringify(opts.pickPersistentState(state));
    opts.writeLocalState(serialized);
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => enqueueSave(serialized, previousRaw), 350);
  }

  function persistAndRender(): void {
    if (opts.onRenderActive) {
      opts.onRenderActive();
    }
    scheduleSave();
  }

  function enqueueStateTransaction<T>(task: () => Promise<T>): Promise<T> {
    clearTimeout(saveTimeout);
    saveTimeout = null;
    const state = opts.getState();
    const flush = enqueueSave(
      JSON.stringify(opts.pickPersistentState(state)),
      opts.readLocalState(opts.STORAGE_KEY)
    );
    const result = flush.then(async () => {
      stateTransactionActive = true;
      try {
        return await task();
      } finally {
        stateTransactionActive = false;
        if (transactionDeferredSave) {
          transactionDeferredSave = false;
          scheduleSave();
        }
      }
    });
    saveQueue = result.catch(() => {});
    return result;
  }

  async function saveState(
    serialized: string = JSON.stringify(opts.pickPersistentState(opts.getState())),
    previousRaw: string | null = null
  ): Promise<void> {
    const state = opts.getState();
    try {
      let backupWarning = false;
      const lastBackup = state.lastBackupAt ? Date.parse(state.lastBackupAt) : 0;
      if (!opts.isDemoMode() && previousRaw && Date.now() - lastBackup >= 24 * 60 * 60 * 1000) {
        const backupSuccess = await opts.rotateAutomaticBackup(previousRaw);
        if (backupSuccess) {
          state.lastBackupAt = opts.nowISO();
          const parsed = JSON.parse(serialized);
          parsed.lastBackupAt = state.lastBackupAt;
          parsed.updatedAt = state.updatedAt;
          serialized = JSON.stringify(parsed);
          opts.writeLocalState(serialized);
        } else {
          backupWarning = true;
        }
      }

      let success = true;
      if (typeof opts.writePersistentState === 'function') {
        success = await opts.writePersistentState(serialized);
      } else if (opts.appContext?.storage?.writePersistent) {
        await opts.appContext.storage.writePersistent(serialized);
        success = true;
      }

      if (success) {
        if (typeof opts.notifyRemoteState === 'function') {
          opts.notifyRemoteState(serialized);
        }
        if (typeof opts.onSaved === 'function') {
          opts.onSaved();
        }
        if (backupWarning) {
          opts.showToast(
            'Os dados atuais foram salvos, mas o backup automático não pôde ser atualizado. Exporte um backup manual.'
          );
        }
      } else {
        opts.showToast('Não foi possível salvar. Exporte um backup para proteger seus dados.');
      }
    } catch (error) {
      console.error('Erro ao salvar estado', error);
      opts.showToast('Não foi possível salvar. Exporte um backup para proteger seus dados.');
    }
  }

  function cancelPendingSave(): void {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    pendingSave = null;
  }

  async function settleSaves(): Promise<void> {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    await saveQueue;
  }

  async function flushSaves(): Promise<void> {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
      const state = opts.getState();
      const previousRaw = opts.readLocalState(opts.STORAGE_KEY);
      const serialized = JSON.stringify(opts.pickPersistentState(state));
      await enqueueSave(serialized, previousRaw);
    }
    await saveQueue;
  }

  return {
    scheduleSave,
    persistAndRender,
    enqueueStateTransaction,
    saveState,
    cancelPendingSave,
    settleSaves,
    flushSaves,
    isTransactionActive: () => stateTransactionActive,
    hasDeferredSave: () => transactionDeferredSave,
  };
}
