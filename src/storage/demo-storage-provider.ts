import { assertStorageProvider, type StorageProvider } from './storage-provider.ts';

export interface DemoStorageProviderOptions {
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  stateKey?: string;
  demoKey?: string;
  generate?: () => any;
}

export function createDemoStorageProvider({
  storage,
  stateKey = '',
  demoKey = '',
  generate,
}: DemoStorageProviderOptions = {}): StorageProvider {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function')
    throw new TypeError('O provider demo requer um armazenamento de sessão.');
  if (typeof generate !== 'function')
    throw new TypeError('O provider demo requer um gerador de estado.');
  const keyFor = (key: string): string => (key === stateKey ? demoKey : `${demoKey}:${key}`);
  const ensureState = (): string => {
    let value = storage.getItem(demoKey);
    if (!value) {
      value = JSON.stringify(generate());
      storage.setItem(demoKey, value);
    }
    return value;
  };
  return assertStorageProvider({
    async get(key: string) {
      return key === stateKey ? ensureState() : storage.getItem(keyFor(key));
    },
    async set(key: string, value: string) {
      storage.setItem(keyFor(key), value);
      return true;
    },
    async remove(key: string) {
      storage.removeItem(keyFor(key));
      return true;
    },
    readLocal(key: string) {
      return key === stateKey ? ensureState() : storage.getItem(keyFor(key));
    },
    writeLocal(key: string, value: string) {
      storage.setItem(keyFor(key), value);
      return true;
    },
    mode: 'demo',
  });
}
