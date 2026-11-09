/**
 * Provedor de Armazenamento e Sincronização em Nuvem SaaS (src/storage/cloud-saas-provider.ts)
 *
 * Conector modular para sincronização automática Local-Nuvem:
 * 1. Push com Debounce de 3s e Fila Offline (navigator.onLine + evento 'online').
 * 2. Pull e Reconciliação em visibilitychange e boot com backup rotativo pré-aplicação.
 * 3. Suporte opcional à criptografia ponta a ponta (Zero-Knowledge via Web Crypto AES-GCM-256).
 * 4. Observabilidade do estado de sincronização ('synced', 'syncing', 'pending', 'offline', 'error').
 */

import {
  decryptPayload,
  encryptPayload,
} from '../core/crypto-utils.js';
import type { AppState } from '../core/types.js';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending' | 'offline' | 'error';

export interface SyncStatusEvent {
  status: SyncStatus;
  lastSyncedAt?: string | null;
  pendingCount?: number;
  error?: string | null;
}

export interface CloudSaaSConfig {
  apiUrl: string;
  authToken?: string;
  deviceId?: string;
  timeoutMs?: number;
  debounceMs?: number;
  encryptionPassphrase?: string;
  storage?: Storage;
  isOnline?: () => boolean;
}

export interface CloudPushResult {
  success: boolean;
  serverUpdatedAt?: string;
  checksum?: string;
  error?: string;
}

export interface CloudPullResult {
  success: boolean;
  state?: AppState | null;
  serverUpdatedAt?: string;
  checksum?: string;
  error?: string;
}

export interface CloudVersionResult {
  hasUpdate: boolean;
  serverUpdatedAt?: string;
  checksum?: string;
  error?: string;
}

export interface ReconcileOptions {
  localState: AppState | any;
  onRemoteStateApplied: (remoteState: AppState) => Promise<void> | void;
  onBackupBeforeApply?: (localState: AppState) => Promise<void> | void;
  migrateState?: (state: any) => AppState;
}

export interface CloudSaaSProvider {
  pushState: (
    state: (Partial<AppState> & { schemaVersion: number }) | any
  ) => Promise<CloudPushResult>;
  pullState: () => Promise<CloudPullResult>;
  checkRemoteVersion: (localUpdatedAt?: string | null) => Promise<CloudVersionResult>;
  healthCheck: () => Promise<boolean>;
  getConfig: () => CloudSaaSConfig;

  // Recursos Avançados da Fase 3
  schedulePush: (state: AppState | any, customDebounceMs?: number) => void;
  flushPendingSync: (currentState: AppState | any) => Promise<CloudPushResult | null>;
  cancelScheduledPush: () => void;
  reconcileWithRemote: (options: ReconcileOptions) => Promise<boolean>;
  hasPendingSync: () => boolean;
  getSyncStatus: () => SyncStatus;
  getLastSyncedAt: () => string | null;
  getLastError: () => string | null;
  onSyncStatusChanged: (listener: (event: SyncStatusEvent) => void) => () => void;
  bindWindowEvents: (options: {
    getCurrentState: () => AppState | any;
    onRemoteStateApplied: (remoteState: AppState) => Promise<void> | void;
    onBackupBeforeApply?: (localState: AppState) => Promise<void> | void;
    migrateState?: (state: any) => AppState;
  }) => () => void;
}

export const PENDING_SYNC_KEY = 'extrato_pending_cloud_sync_v1';
export const LAST_SYNCED_KEY = 'extrato_last_cloud_synced_at_v1';

export function createCloudSaaSProvider({
  config,
  fetch = globalThis.fetch,
}: {
  config: CloudSaaSConfig;
  fetch?: any;
}): CloudSaaSProvider {
  const timeoutMs = config.timeoutMs || 8000;
  const defaultDebounceMs = config.debounceMs ?? 3000;
  const storage =
    config.storage ?? (typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined);

  const checkOnline =
    config.isOnline ??
    (() => (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true));

  let currentStatus: SyncStatus = 'idle';
  let lastSyncedAt: string | null = storage?.getItem(LAST_SYNCED_KEY) || null;
  let lastError: string | null = null;
  let debounceTimer: any = null;
  let pendingStateSnapshot: any = null;

  const listeners: Set<(event: SyncStatusEvent) => void> = new Set();

  function notifyStatus(status: SyncStatus, error: string | null = null) {
    currentStatus = status;
    lastError = error;
    const event: SyncStatusEvent = {
      status,
      lastSyncedAt,
      pendingCount: hasPendingSync() ? 1 : 0,
      error,
    };
    listeners.forEach(fn => {
      try {
        fn(event);
      } catch {
        // Ignora erros em listeners
      }
    });
  }

  function hasPendingSync(): boolean {
    try {
      return Boolean(storage?.getItem(PENDING_SYNC_KEY) === 'true' || pendingStateSnapshot);
    } catch {
      return Boolean(pendingStateSnapshot);
    }
  }

  function markPendingSync(isPending: boolean) {
    try {
      if (isPending) {
        storage?.setItem(PENDING_SYNC_KEY, 'true');
      } else {
        storage?.removeItem(PENDING_SYNC_KEY);
      }
    } catch {
      // Ignora erro em localStorage
    }
  }

  function markLastSynced(dateIso: string) {
    lastSyncedAt = dateIso;
    try {
      storage?.setItem(LAST_SYNCED_KEY, dateIso);
    } catch {
      // Ignora erro
    }
  }

  function buildEndpoint(path: 'push' | 'pull' | 'version' | 'health'): string {
    const rawUrl = String(config.apiUrl || '').replace(/\/+$/, '');
    if (path === 'health') {
      return `${rawUrl}/health`;
    }
    // Se a URL já aponta diretamente para a Edge Function de state-sync
    if (rawUrl.endsWith('/state-sync') || rawUrl.includes('/functions/v1/state-sync')) {
      return `${rawUrl}/${path}`;
    }
    // Formato padrão da API SaaS REST
    return `${rawUrl}/v1/state/${path}`;
  }

  function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }
    if (config.deviceId) {
      headers['X-Device-Id'] = config.deviceId;
    }
    return headers;
  }

  async function pushState(state: AppState | any): Promise<CloudPushResult> {
    if (!config.apiUrl) {
      notifyStatus('error', 'URL da API SaaS não configurada.');
      return { success: false, error: 'URL da API SaaS não configurada.' };
    }

    if (!checkOnline()) {
      pendingStateSnapshot = state;
      markPendingSync(true);
      notifyStatus('offline', 'Dispositivo desconectado da internet.');
      return { success: false, error: 'Sem conexão com a internet.' };
    }

    notifyStatus('syncing');

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let payloadJson = state;
      if (config.encryptionPassphrase) {
        const envelope = await encryptPayload(
          JSON.stringify(state),
          config.encryptionPassphrase
        );
        payloadJson = {
          schemaVersion: state.schemaVersion || 1,
          encrypted: true,
          envelope,
        };
      }

      const response = await fetch(buildEndpoint('push'), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          schemaVersion: state.schemaVersion,
          stateJson: payloadJson,
          clientUpdatedAt: state.updatedAt || new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = `Erro HTTP ${response.status}: ${response.statusText}`;
        markPendingSync(true);
        notifyStatus('error', errText);
        return { success: false, error: errText };
      }

      const data = await response.json();
      const confirmedServerTime = data.serverUpdatedAt || new Date().toISOString();

      pendingStateSnapshot = null;
      markPendingSync(false);
      markLastSynced(confirmedServerTime);
      notifyStatus('synced');

      return {
        success: true,
        serverUpdatedAt: confirmedServerTime,
        checksum: data.checksum,
      };
    } catch (err: any) {
      const message =
        err.name === 'AbortError' ? 'Tempo limite esgotado.' : err.message || 'Falha de rede.';
      markPendingSync(true);
      notifyStatus(checkOnline() ? 'error' : 'offline', message);
      return { success: false, error: message };
    }
  }

  async function pullState(): Promise<CloudPullResult> {
    if (!config.apiUrl) {
      notifyStatus('error', 'URL da API SaaS não configurada.');
      return { success: false, error: 'URL da API SaaS não configurada.' };
    }

    notifyStatus('syncing');

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(buildEndpoint('pull'), {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = `Erro HTTP ${response.status}: ${response.statusText}`;
        notifyStatus('error', errText);
        return { success: false, error: errText };
      }

      const data = await response.json();
      let stateData = data.stateJson || data.state || null;

      // Descriptografia E2EE se aplicável
      if (
        stateData &&
        typeof stateData === 'object' &&
        stateData.encrypted &&
        stateData.envelope
      ) {
        if (!config.encryptionPassphrase) {
          throw new Error('Estado remoto está criptografado, mas a senha E2EE não foi informada.');
        }
        const plainJson = await decryptPayload(
          stateData.envelope,
          config.encryptionPassphrase
        );
        stateData = JSON.parse(plainJson);
      }

      notifyStatus('synced');
      return {
        success: true,
        state: stateData,
        serverUpdatedAt: data.serverUpdatedAt,
        checksum: data.checksum,
      };
    } catch (err: any) {
      const message =
        err.name === 'AbortError' ? 'Tempo limite esgotado.' : err.message || 'Falha de rede.';
      notifyStatus('error', message);
      return { success: false, error: message };
    }
  }

  async function checkRemoteVersion(localUpdatedAt?: string | null): Promise<CloudVersionResult> {
    if (!config.apiUrl) {
      return { hasUpdate: false, error: 'URL da API SaaS não configurada.' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(buildEndpoint('version'), {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return { hasUpdate: false, error: `Erro HTTP ${response.status}` };
      }

      const data = await response.json();
      const serverTime = data.serverUpdatedAt ? Date.parse(data.serverUpdatedAt) : 0;
      const localTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;

      return {
        hasUpdate: serverTime > localTime,
        serverUpdatedAt: data.serverUpdatedAt,
        checksum: data.checksum,
      };
    } catch (err: any) {
      return { hasUpdate: false, error: err.message || 'Falha de conexão.' };
    }
  }

  async function healthCheck(): Promise<boolean> {
    if (!config.apiUrl) return false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(3000, timeoutMs));
      const response = await fetch(buildEndpoint('health'), {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response.ok;
    } catch {
      return false;
    }
  }

  function schedulePush(state: AppState | any, customDebounceMs?: number) {
    pendingStateSnapshot = state;
    markPendingSync(true);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (!checkOnline()) {
      notifyStatus('offline', 'Modo offline: envio agendado para quando a conexão voltar.');
      return;
    }

    notifyStatus('pending');
    const delay = customDebounceMs ?? defaultDebounceMs;
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      if (pendingStateSnapshot) {
        await pushState(pendingStateSnapshot);
      }
    }, delay);
  }

  async function flushPendingSync(currentState: AppState | any): Promise<CloudPushResult | null> {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    const stateToSend = currentState || pendingStateSnapshot;
    if (!stateToSend) return null;
    return await pushState(stateToSend);
  }

  function cancelScheduledPush() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  async function reconcileWithRemote(options: ReconcileOptions): Promise<boolean> {
    const { localState, onRemoteStateApplied, onBackupBeforeApply, migrateState } = options;
    const localUpdatedAt = localState?.updatedAt || null;

    const versionCheck = await checkRemoteVersion(localUpdatedAt);
    if (!versionCheck.hasUpdate) {
      return false;
    }

    const pullResult = await pullState();
    if (!pullResult.success || !pullResult.state) {
      return false;
    }

    let nextState = pullResult.state;
    if (typeof migrateState === 'function') {
      try {
        nextState = migrateState(nextState);
      } catch (err) {
        notifyStatus('error', 'Falha ao migrar versão do estado recebido da nuvem.');
        return false;
      }
    }

    // Salva backup de segurança do estado local antes de aplicar os dados da nuvem
    if (typeof onBackupBeforeApply === 'function' && localState) {
      try {
        await onBackupBeforeApply(localState);
      } catch {
        // Ignora erro de backup para não travar a aplicação
      }
    }

    if (typeof onRemoteStateApplied === 'function') {
      await onRemoteStateApplied(nextState);
    }

    if (pullResult.serverUpdatedAt) {
      markLastSynced(pullResult.serverUpdatedAt);
    }
    notifyStatus('synced');
    return true;
  }

  function bindWindowEvents(options: {
    getCurrentState: () => AppState | any;
    onRemoteStateApplied: (remoteState: AppState) => Promise<void> | void;
    onBackupBeforeApply?: (localState: AppState) => Promise<void> | void;
    migrateState?: (state: any) => AppState;
  }): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleOnline = () => {
      if (hasPendingSync()) {
        const state = options.getCurrentState();
        flushPendingSync(state);
      } else {
        notifyStatus('idle');
      }
    };

    const handleOffline = () => {
      notifyStatus('offline', 'Conexão perdida.');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && checkOnline()) {
        const state = options.getCurrentState();
        reconcileWithRemote({
          localState: state,
          onRemoteStateApplied: options.onRemoteStateApplied,
          onBackupBeforeApply: options.onBackupBeforeApply,
          migrateState: options.migrateState,
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  return Object.freeze({
    pushState,
    pullState,
    checkRemoteVersion,
    healthCheck,
    getConfig: () => ({ ...config }),
    schedulePush,
    flushPendingSync,
    cancelScheduledPush,
    reconcileWithRemote,
    hasPendingSync,
    getSyncStatus: () => currentStatus,
    getLastSyncedAt: () => lastSyncedAt,
    getLastError: () => lastError,
    onSyncStatusChanged: (listener: (event: SyncStatusEvent) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    bindWindowEvents,
  });
}
