import test from 'node:test';
import assert from 'node:assert/strict';
import {createClock} from '../../src/core/clock.js';
import {createAppContext} from '../../src/application/create-app-context.js';
import {createRealStorageProvider} from '../../src/storage/real-storage-provider.js';
import {bootstrapApplication} from '../../src/bootstrap.js';

function memoryManager(){
  const values=new Map();
  return {values,get:async key=>values.get(key)||null,set:async(key,value)=>{values.set(key,value);return true},remove:async key=>values.delete(key)};
}

test('relógio injetável preserva data local e instante ISO',()=>{
  const clock=createClock({now:()=>new Date(2026,7,31,23,30,0)});
  assert.equal(clock.today(),'2026-08-31');
  assert.match(clock.nowISO(),/^2026-09-01T02:30:00\.000Z$|^2026-08-31T/);
});

test('provider real delega persistência sem alterar chaves',async()=>{
  const manager=memoryManager(),local=new Map();
  const provider=createRealStorageProvider({manager,readLocal:key=>local.get(key)||null,writeLocal:(value,key)=>{local.set(key,value);return true},removeLocal:key=>local.delete(key)});
  await provider.set('real-key','conteúdo');
  provider.writeLocal('real-key','conteúdo local');
  assert.equal(await provider.get('real-key'),'conteúdo');
  assert.equal(provider.readLocal('real-key'),'conteúdo local');
  await provider.remove('real-key');
  assert.equal(provider.readLocal('real-key'),null);
});

test('contexto valida e preserva dependências injetadas',()=>{
  const manager=memoryManager(),storage=createRealStorageProvider({manager,readLocal:()=>null,writeLocal:()=>true});
  const clock=createClock({now:()=>new Date('2026-08-31T12:00:00Z')}),idGenerator=()=> 'id-1';
  const context=createAppContext({storage,clock,idGenerator,repositories:{subjects:{}}});
  assert.equal(context.clock.today(),'2026-08-31');
  assert.equal(context.idGenerator(),'id-1');
  assert.equal(Object.isFrozen(context),true);
});

test('bootstrap entrega o contexto e contém falhas de inicialização',async()=>{
  const context={name:'test'},received=[];
  const success=await bootstrapApplication({context,start:value=>received.push(value)});
  assert.equal(success.ok,true);assert.equal(received[0],context);
  const failure=await bootstrapApplication({context,start:()=>{throw new Error('falha controlada')},onError:error=>received.push(error.message)});
  assert.equal(failure.ok,false);assert.equal(received.at(-1),'falha controlada');
});
