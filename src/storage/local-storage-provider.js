export function createLocalStorageProvider(storage=globalThis.localStorage){
  return {
    get(key){try{return storage?.getItem(key)||null}catch(error){return null}},
    set(key,value){try{storage?.setItem(key,value);return true}catch(error){return false}},
    remove(key){try{storage?.removeItem(key);return true}catch(error){return false}}
  };
}
