/**
 * Provedor de Armazenamento em Nuvem SaaS (src/storage/cloud-saas-provider.ts)
 *
 * Conector modular para sincronização assíncrona com backend REST / Supabase,
 * garantindo isolamento da camada de armazenamento para transição SaaS multi-dispositivo.
 */

import type { AppState } from '../core/types.js';

export interface CloudSaaSConfig {
  apiUrl: string;
  authToken?: string;
  deviceId?: string;
  timeoutMs?: number;
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

export interface CloudSaaSProvider {
  pushState: (
    state: (Partial<AppState> & { schemaVersion: number }) | any
  ) => Promise<CloudPushResult>;
  pullState: () => Promise<CloudPullResult>;
  checkRemoteVersion: (localUpdatedAt?: string | null) => Promise<CloudVersionResult>;
  healthCheck: () => Promise<boolean>;
  getConfig: () => CloudSaaSConfig;
}

export function createCloudSaaSProvider({
  config,
  fetch = globalThis.fetch,
}: {
  config: CloudSaaSConfig;
  fetch?: any;
}): CloudSaaSProvider {
  const timeoutMs = config.timeoutMs || 8000;

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

  async function pushState(state: AppState): Promise<CloudPushResult> {
    if (!config.apiUrl) {
      return { success: false, error: 'URL da API SaaS não configurada.' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${config.apiUrl.replace(/\/+$/, '')}/v1/state/push`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          schemaVersion: state.schemaVersion,
          stateJson: state,
          clientUpdatedAt: state.updatedAt || new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        serverUpdatedAt: data.serverUpdatedAt || new Date().toISOString(),
        checksum: data.checksum,
      };
    } catch (err: any) {
      return {
        success: false,
        error:
          err.name === 'AbortError' ? 'Tempo limite esgotado.' : err.message || 'Falha de rede.',
      };
    }
  }

  async function pullState(): Promise<CloudPullResult> {
    if (!config.apiUrl) {
      return { success: false, error: 'URL da API SaaS não configurada.' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${config.apiUrl.replace(/\/+$/, '')}/v1/state/pull`, {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        state: data.stateJson || data.state || null,
        serverUpdatedAt: data.serverUpdatedAt,
        checksum: data.checksum,
      };
    } catch (err: any) {
      return {
        success: false,
        error:
          err.name === 'AbortError' ? 'Tempo limite esgotado.' : err.message || 'Falha de rede.',
      };
    }
  }

  async function checkRemoteVersion(localUpdatedAt?: string | null): Promise<CloudVersionResult> {
    if (!config.apiUrl) {
      return { hasUpdate: false, error: 'URL da API SaaS não configurada.' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${config.apiUrl.replace(/\/+$/, '')}/v1/state/version`, {
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
      const response = await fetch(`${config.apiUrl.replace(/\/+$/, '')}/health`, {
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

  return Object.freeze({
    pushState,
    pullState,
    checkRemoteVersion,
    healthCheck,
    getConfig: () => ({ ...config }),
  });
}
