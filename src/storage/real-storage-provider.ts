import { assertStorageProvider, type StorageProvider } from './storage-provider.ts';

export interface RealStorageProviderOptions {
  manager?: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<any>;
    setDurable?: (key: string, value: any) => Promise<any>;
    remove: (key: string) => Promise<any>;
  };
  readLocal?: (key: string) => any;
  writeLocal?: (value: any, key: string) => any;
  removeLocal?: (key: string) => void;
}

export function createRealStorageProvider({
  manager,
  readLocal,
  writeLocal,
  removeLocal,
}: RealStorageProviderOptions = {}): StorageProvider {
  if (
    !manager ||
    (['get', 'set', 'remove'] as const).some(method => typeof manager[method] !== 'function')
  )
    throw new TypeError('O provider real requer um gerenciador persistente.');
  if (typeof readLocal !== 'function' || typeof writeLocal !== 'function')
    throw new TypeError('O provider real requer acesso ao armazenamento local.');
  return assertStorageProvider({
    get: (key: string) => manager.get(key),
    set: (key: string, value: any) => manager.set(key, value),
    setDurable: (key: string, value: any) =>
      manager.setDurable ? manager.setDurable(key, value) : manager.set(key, value),
    remove: async (key: string) => {
      const removed = await manager.remove(key);
      if (typeof removeLocal === 'function') removeLocal(key);
      return removed;
    },
    readLocal: (key: string) => readLocal(key),
    writeLocal: (key: string, value: any) => writeLocal(value, key),
    mode: 'real',
  });
}
