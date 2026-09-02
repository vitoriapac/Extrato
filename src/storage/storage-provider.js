export const STORAGE_PROVIDER_METHODS=Object.freeze(['get','set','remove','readLocal','writeLocal']);

export function assertStorageProvider(provider){
  if(!provider||STORAGE_PROVIDER_METHODS.some(method=>typeof provider[method]!=='function')) throw new TypeError('Provider de armazenamento incompleto.');
  provider.load=provider.load||provider.get.bind(provider);
  provider.save=provider.save||provider.set.bind(provider);
  provider.exportBackup=provider.exportBackup||provider.get.bind(provider);
  provider.importBackup=provider.importBackup||provider.set.bind(provider);
  return provider;
}
