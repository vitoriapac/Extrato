export interface LocalStorageProvider {
  get: (key: string) => string | null;
  set: (key: string, value: string) => boolean;
  remove: (key: string) => boolean;
}

export function createLocalStorageProvider(
  storage: Storage | undefined = globalThis.localStorage
): LocalStorageProvider {
  return {
    get(key: string): string | null {
      try {
        return storage?.getItem(key) || null;
      } catch {
        return null;
      }
    },
    set(key: string, value: string): boolean {
      try {
        storage?.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key: string): boolean {
      try {
        storage?.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}
