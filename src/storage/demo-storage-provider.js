import {assertStorageProvider} from './storage-provider.js';

export function createDemoStorageProvider({storage,stateKey,demoKey,generate}={}){
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function') throw new TypeError('O provider demo requer um armazenamento de sessão.');
  if(typeof generate!=='function') throw new TypeError('O provider demo requer um gerador de estado.');
  const keyFor=key=>key===stateKey?demoKey:`${demoKey}:${key}`;
  const ensureState=()=>{
    let value=storage.getItem(demoKey);
    if(!value){value=JSON.stringify(generate());storage.setItem(demoKey,value)}
    return value;
  };
  return assertStorageProvider({
    async get(key){return key===stateKey?ensureState():storage.getItem(keyFor(key))},
    async set(key,value){storage.setItem(keyFor(key),value);return true},
    async remove(key){storage.removeItem(keyFor(key));return true},
    readLocal(key){return key===stateKey?ensureState():storage.getItem(keyFor(key))},
    writeLocal(key,value){storage.setItem(keyFor(key),value);return true},
    mode:'demo'
  });
}
