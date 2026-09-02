import test from 'node:test';
import assert from 'node:assert/strict';
import {runStateMigrations,validateBackupEnvelope} from '../../src/storage/migration-service.js';
import {serializeBackup,parseBackupText,backupFileName} from '../../src/storage/backup-service.js';
import {createCollectionRepository} from '../../src/repositories/collection-repository.js';
import {createLocalStorageProvider} from '../../src/storage/local-storage-provider.js';

test('executa migrações sequenciais e detecta lacunas',()=>{
  const migrated=runStateMigrations({schemaVersion:1,value:0},{currentVersion:3,migrations:{1:data=>({...data,value:data.value+1}),2:data=>({...data,value:data.value+2})}});
  assert.deepEqual(migrated,{schemaVersion:3,value:3});
  assert.throws(()=>runStateMigrations({schemaVersion:1},{currentVersion:2,migrations:{}}),/Migração ausente/);
});

test('valida envelope e serializa backup com limite',()=>{
  const data={schemaVersion:2,subjects:[],calendar:[]};
  assert.equal(validateBackupEnvelope(data,{currentVersion:2,arrayFields:['calendar']}).valid,true);
  const raw=serializeBackup(data),parsed=parseBackupText(raw);
  assert.deepEqual(parsed.data,data);assert.equal(parseBackupText(raw,{maxBytes:2}).valid,false);assert.equal(backupFileName('2026-09-02'),'backup-extrato-estudos-2026-09-02.json');
});

test('repositório de coleção acompanha a troca do estado',()=>{
  let state={subjects:[{id:'one',name:'A'}]},repository=createCollectionRepository({getState:()=>state,field:'subjects'});
  assert.equal(repository.findById('one').name,'A');repository.update('one',{name:'B'});assert.equal(state.subjects[0].name,'B');
  state={subjects:[]};repository.add({id:'two'});assert.equal(repository.all()[0].id,'two');assert.equal(repository.remove('two').id,'two');
});

test('provider local contém falhas e mantém o contrato',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},provider=createLocalStorageProvider(storage);
  assert.equal(provider.set('key','value'),true);assert.equal(provider.get('key'),'value');assert.equal(provider.remove('key'),true);assert.equal(provider.get('key'),null);
  assert.equal(createLocalStorageProvider({getItem(){throw new Error('blocked')}}).get('x'),null);
});
