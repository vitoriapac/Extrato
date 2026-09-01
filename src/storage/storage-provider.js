export const STORAGE_PROVIDER_METHODS=Object.freeze(['get','set','remove','readLocal','writeLocal']);

export function assertStorageProvider(provider){
  if(!provider||STORAGE_PROVIDER_METHODS.some(method=>typeof provider[method]!=='function')) throw new TypeError('Provider de armazenamento incompleto.');
  return provider;
}
