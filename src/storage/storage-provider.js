export const STORAGE_PROVIDER_METHODS=Object.freeze(['get','set','remove','readLocal','writeLocal']);

/**
 * @typedef {Object} StorageProvider
 * @property {(key: string) => Promise<any>} get
 * @property {(key: string, value: any) => Promise<void>} set
 * @property {(key: string) => Promise<void>} remove
 * @property {(key: string) => any} readLocal
 * @property {(key: string, value: any) => void} writeLocal
 * @property {(key: string) => Promise<any>} [load]
 * @property {(key: string, value: any) => Promise<void>} [save]
 * @property {(key: string) => Promise<any>} [exportBackup]
 * @property {(key: string, value: any) => Promise<void>} [importBackup]
 */

/**
 * Valida se um objeto cumpre o contrato mínimo de provedor de armazenamento.
 * @param {any} provider
 * @returns {StorageProvider}
 */
export function assertStorageProvider(provider){
  if(!provider||STORAGE_PROVIDER_METHODS.some(method=>typeof provider[method]!=='function')) throw new TypeError('Provider de armazenamento incompleto.');
  provider.load=provider.load||provider.get.bind(provider);
  provider.save=provider.save||provider.set.bind(provider);
  provider.exportBackup=provider.exportBackup||provider.get.bind(provider);
  provider.importBackup=provider.importBackup||provider.set.bind(provider);
  return provider;
}
