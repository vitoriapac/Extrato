import {assertStorageProvider} from './storage-provider.js';

export function createRealStorageProvider({manager,readLocal,writeLocal,removeLocal}={}){
  if(!manager||['get','set','remove'].some(method=>typeof manager[method]!=='function')) throw new TypeError('O provider real requer um gerenciador persistente.');
  if(typeof readLocal!=='function'||typeof writeLocal!=='function') throw new TypeError('O provider real requer acesso ao armazenamento local.');
  return assertStorageProvider({
    get:key=>manager.get(key),
    set:(key,value)=>manager.set(key,value),
    remove:async key=>{
      const removed=await manager.remove(key);
      if(typeof removeLocal==='function') removeLocal(key);
      return removed;
    },
    readLocal:key=>readLocal(key),
    writeLocal:(key,value)=>writeLocal(value,key),
    mode:'real'
  });
}
