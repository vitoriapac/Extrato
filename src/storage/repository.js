import {createIndexedDbProvider} from './indexed-db-provider.js';
import {createLocalStorageProvider} from './local-storage-provider.js';

const localProvider=createLocalStorageProvider();

export function repositoryReadLocalState(key){
  return localProvider.get(key);
}

export function repositoryWriteLocalState(value,key){
  return localProvider.set(key,value);
}

function serializedTimestamp(value){
  try{return Date.parse(JSON.parse(value)?.updatedAt||0)||0}catch(error){return 0}
}

export function createStorageManager(config){
  const indexedDb=createIndexedDbProvider(config);
  return {
    async get(key){
      const values=[];
      try{const value=await indexedDb.get(key);if(value)values.push(value)}catch(error){console.warn('IndexedDB indisponível',error)}
      if(globalThis.storage&&typeof globalThis.storage.get==='function'){
        try{const result=await globalThis.storage.get(key,false);if(result?.value)values.push(result.value)}catch(error){console.warn('window.storage indisponível',error)}
      }
      const localValue=repositoryReadLocalState(key);if(localValue)values.push(localValue);
      return values.sort((a,b)=>serializedTimestamp(b)-serializedTimestamp(a))[0]||null;
    },
    async set(key,value){
      let success=false;
      try{await indexedDb.set(key,value);success=true}catch(error){console.warn('Falha no IndexedDB',error)}
      if(globalThis.storage&&typeof globalThis.storage.set==='function'){
        try{await globalThis.storage.set(key,value,false);success=true}catch(error){console.warn('Falha no window.storage',error)}
      }
      if(repositoryWriteLocalState(value,key))success=true;
      return success;
    },
    async remove(key){
      let success=false;
      try{await indexedDb.remove(key);success=true}catch(error){console.warn('Falha ao remover do IndexedDB',error)}
      if(globalThis.storage&&typeof globalThis.storage.delete==='function'){
        try{await globalThis.storage.delete(key,false);success=true}catch(error){console.warn('Falha ao remover do window.storage',error)}
      }
      if(localProvider.remove(key))success=true;
      return success;
    }
  };
}
