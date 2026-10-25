import { createIndexedDbProvider, type IndexedDbProviderConfig } from './indexed-db-provider.ts';
import { createLocalStorageProvider } from './local-storage-provider.ts';

const localProvider = createLocalStorageProvider();

export function repositoryReadLocalState(key: string): string | null {
  return localProvider.get(key);
}

export function repositoryWriteLocalState(value: string, key: string): boolean {
  return localProvider.set(key, value);
}

function serializedTimestamp(value: string): number {
  try {
    return Date.parse(JSON.parse(value)?.updatedAt || 0) || 0;
  } catch {
    return 0;
  }
}

export interface StorageManager {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
}

export interface StorageManagerProviders {
  indexedDb?: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<any>;
    remove: (key: string) => Promise<any>;
  };
  local?: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => boolean;
    remove: (key: string) => boolean;
  };
  windowStorage?: any;
}

// Providers are injectable so the "newest copy wins" rule can be tested without a browser.
export function createStorageManager(
  config?: IndexedDbProviderConfig,
  {
    indexedDb = createIndexedDbProvider(config),
    local = localProvider,
    windowStorage = (globalThis as Record<string, any>).storage,
  }: StorageManagerProviders = {}
): StorageManager {
  return {
    async get(key: string): Promise<string | null> {
      const values: string[] = [];
      try {
        const value = await indexedDb.get(key);
        if (value) values.push(value);
      } catch (error) {
        console.warn('IndexedDB indisponível', error);
      }
      if (windowStorage && typeof windowStorage.get === 'function') {
        try {
          const result = await windowStorage.get(key, false);
          if (result?.value) values.push(result.value);
        } catch (error) {
          console.warn('window.storage indisponível', error);
        }
      }
      const localValue = local.get(key);
      if (localValue) values.push(localValue);
      return values.sort((a, b) => serializedTimestamp(b) - serializedTimestamp(a))[0] || null;
    },
    async set(key: string, value: string): Promise<boolean> {
      let success = false;
      try {
        await indexedDb.set(key, value);
        success = true;
      } catch (error) {
        console.warn('Falha no IndexedDB', error);
      }
      if (windowStorage && typeof windowStorage.set === 'function') {
        try {
          await windowStorage.set(key, value, false);
          success = true;
        } catch (error) {
          console.warn('Falha no window.storage', error);
        }
      }
      if (local.set(key, value)) success = true;
      return success;
    },
    async remove(key: string): Promise<boolean> {
      let success = false;
      try {
        await indexedDb.remove(key);
        success = true;
      } catch (error) {
        console.warn('Falha ao remover do IndexedDB', error);
      }
      if (windowStorage && typeof windowStorage.delete === 'function') {
        try {
          await windowStorage.delete(key, false);
          success = true;
        } catch (error) {
          console.warn('Falha ao remover do window.storage', error);
        }
      }
      if (local.remove(key)) success = true;
      return success;
    },
  };
}
