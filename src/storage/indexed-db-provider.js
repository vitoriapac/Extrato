export function createIndexedDbProvider({dbName,dbVersion,storeName,indexedDB=globalThis.indexedDB}={}){
  const open=()=>new Promise((resolve,reject)=>{
    if(!indexedDB){reject(new Error('IndexedDB indisponível'));return}
    const request=indexedDB.open(dbName,dbVersion);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(storeName))request.result.createObjectStore(storeName)};
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  const transaction=async(mode,operation)=>{const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,mode),request=operation(tx.objectStore(storeName));request.onsuccess=()=>{if(mode==='readonly')resolve(request.result||null)};request.onerror=()=>reject(request.error);tx.oncomplete=()=>{db.close();if(mode!=='readonly')resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})};
  return {get:key=>transaction('readonly',store=>store.get(key)),set:(key,value)=>transaction('readwrite',store=>store.put(value,key)),remove:key=>transaction('readwrite',store=>store.delete(key))};
}
