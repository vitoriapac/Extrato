function openDatabase({dbName,dbVersion,storeName}){
  return new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(new Error('IndexedDB indisponível'));return}
    const request=indexedDB.open(dbName,dbVersion);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(storeName))db.createObjectStore(storeName);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

export function repositoryReadLocalState(key){
  try{return localStorage.getItem(key)}catch(error){return null}
}

export function repositoryWriteLocalState(value,key){
  try{localStorage.setItem(key,value);return true}catch(error){return false}
}

function serializedTimestamp(value){
  try{return Date.parse(JSON.parse(value)?.updatedAt||0)||0}catch(error){return 0}
}

export function createStorageManager(config){
  const {storeName}=config;
  async function indexedDbGet(key){
    const db=await openDatabase(config);
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(storeName,'readonly'),request=tx.objectStore(storeName).get(key);
      request.onsuccess=()=>resolve(request.result||null);
      request.onerror=()=>reject(request.error);
      tx.oncomplete=()=>db.close();
    });
  }
  async function indexedDbSet(key,value){
    const db=await openDatabase(config);
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).put(value,key);
      tx.oncomplete=()=>{db.close();resolve(true)};
      tx.onerror=()=>{db.close();reject(tx.error)};
    });
  }
  async function indexedDbDelete(key){
    const db=await openDatabase(config);
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).delete(key);
      tx.oncomplete=()=>{db.close();resolve(true)};
      tx.onerror=()=>{db.close();reject(tx.error)};
    });
  }
  return {
    async get(key){
      const values=[];
      try{const value=await indexedDbGet(key);if(value)values.push(value)}catch(error){console.warn('IndexedDB indisponível',error)}
      if(globalThis.storage&&typeof globalThis.storage.get==='function'){
        try{const result=await globalThis.storage.get(key,false);if(result?.value)values.push(result.value)}catch(error){console.warn('window.storage indisponível',error)}
      }
      const localValue=repositoryReadLocalState(key);if(localValue)values.push(localValue);
      return values.sort((a,b)=>serializedTimestamp(b)-serializedTimestamp(a))[0]||null;
    },
    async set(key,value){
      let success=false;
      try{await indexedDbSet(key,value);success=true}catch(error){console.warn('Falha no IndexedDB',error)}
      if(globalThis.storage&&typeof globalThis.storage.set==='function'){
        try{await globalThis.storage.set(key,value,false);success=true}catch(error){console.warn('Falha no window.storage',error)}
      }
      if(repositoryWriteLocalState(value,key))success=true;
      return success;
    },
    async remove(key){
      let success=false;
      try{await indexedDbDelete(key);success=true}catch(error){console.warn('Falha ao remover do IndexedDB',error)}
      if(globalThis.storage&&typeof globalThis.storage.delete==='function'){
        try{await globalThis.storage.delete(key,false);success=true}catch(error){console.warn('Falha ao remover do window.storage',error)}
      }
      try{localStorage.removeItem(key);success=true}catch(error){}
      return success;
    }
  };
}
