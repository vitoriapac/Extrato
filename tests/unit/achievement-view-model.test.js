import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAchievementViewModel} from '../../src/application/achievements/build-achievement-view-model.js';

test('agrupa conquistas desbloqueadas e futuras sem alterar a fonte',()=>{
  const source=[{id:'first',name:'Primeiros passos',unlocked:true},{id:'next',name:'Dez tópicos',unlocked:false}];
  const model=buildAchievementViewModel(source);
  assert.equal(model.total,2);assert.equal(model.unlockedCount,1);assert.equal(model.remainingCount,1);
  assert.deepEqual(model.unlocked.map(item=>item.id),['first']);assert.deepEqual(model.locked.map(item=>item.id),['next']);
  assert.equal(source[0].unlocked,true);
});

test('aceita catálogo vazio sem inventar conquistas',()=>{
  assert.deepEqual(buildAchievementViewModel([]),{total:0,unlockedCount:0,remainingCount:0,unlocked:[],locked:[]});
});
