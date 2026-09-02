import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_SCENARIO,generateDemoData} from '../../src/demo/demo-generator.js';
import {createDemoStorageProvider} from '../../src/storage/demo-storage-provider.js';
import {enterDemoMode,exitDemoMode,readAppMode,resetDemoMode} from '../../src/application/demo/demo-mode.js';

function memoryStorage(){const values=new Map();return{values,getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}}

test('gera noventa dias determinísticos com referências e volumes demonstrativos',()=>{
  const first=generateDemoData({today:'2026-08-31'}),second=generateDemoData({today:'2026-08-31'});
  assert.deepEqual(first,second);assert.equal(first.progressHistory.length,90);assert.equal(first.studySessions.length,120);
  assert.ok(first.questoes.reduce((sum,item)=>sum+item.resolved,0)>=1500);assert.equal(first.simulados.length,9);assert.equal(first.subjects.length,6);
  const sessionIds=new Set(first.studySessions.map(item=>item.id)),topicIds=new Set(first.subjects.flatMap(subject=>subject.topics.map(topic=>topic.id)));
  assert.ok(first.questoes.every(item=>sessionIds.has(item.studySessionId)&&topicIds.has(item.topicId)));
  assert.ok(first.questoes.every(item=>Object.values(item.errorBreakdown).reduce((sum,value)=>sum+value,0)<=item.resolved-item.correct));
  assert.ok(new Set(first.studySessions.map(item=>item.date)).size<90);
  assert.deepEqual(DEMO_SCENARIO,{days:90,subjects:6,sessions:120,simulations:9,seed:'studytrack-demo-v2'});
  assert.ok(first.recommendationFeedback.some(item=>item.baseline&&item.outcome));
});

test('provider demo mantém dados em chave isolada da base real',async()=>{
  const storage=memoryStorage();storage.setItem('real-key','dados reais');
  const provider=createDemoStorageProvider({storage,stateKey:'real-key',demoKey:'demo-key',generate:()=>({demo:true})});
  assert.equal(JSON.parse(await provider.get('real-key')).demo,true);await provider.set('real-key','demo editada');
  assert.equal(storage.getItem('real-key'),'dados reais');assert.equal(storage.getItem('demo-key'),'demo editada');
});

test('entrada, reinício e saída controlam somente chaves demonstrativas',()=>{
  const storage=memoryStorage();storage.setItem('real-key','preservado');
  enterDemoMode(storage);assert.equal(readAppMode(storage),'demo');storage.setItem('demo-key','temporário');
  resetDemoMode(storage,'demo-key');assert.equal(storage.getItem('demo-key'),null);assert.equal(readAppMode(storage),'demo');
  storage.setItem('demo-key','temporário');exitDemoMode(storage,'demo-key');assert.equal(readAppMode(storage),'real');assert.equal(storage.getItem('real-key'),'preservado');
});
