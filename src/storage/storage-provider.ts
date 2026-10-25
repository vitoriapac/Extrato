export const STORAGE_PROVIDER_METHODS = Object.freeze([
  'get',
  'set',
  'remove',
  'readLocal',
  'writeLocal',
] as const);

export interface StorageProvider {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<any>;
  setDurable?: (key: string, value: any) => Promise<any>;
  remove: (key: string) => Promise<any>;
  readLocal: (key: string) => any;
  writeLocal: (key: string, value: any) => any;
  load?: (key: string) => Promise<any>;
  save?: (key: string, value: any) => Promise<any>;
  exportBackup?: (key: string) => Promise<any>;
  importBackup?: (key: string, value: any) => Promise<any>;
  mode?: 'real' | 'demo' | string;
}

/**
 * Valida se um objeto cumpre o contrato mínimo de provedor de armazenamento.
 */
export function assertStorageProvider(provider: any): StorageProvider {
  if (!provider || STORAGE_PROVIDER_METHODS.some(method => typeof provider[method] !== 'function'))
    throw new TypeError('Provider de armazenamento incompleto.');
  provider.load = provider.load || provider.get.bind(provider);
  provider.save = provider.save || provider.set.bind(provider);
  provider.exportBackup = provider.exportBackup || provider.get.bind(provider);
  provider.importBackup = provider.importBackup || provider.set.bind(provider);
  return provider as StorageProvider;
}
