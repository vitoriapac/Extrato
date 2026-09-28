import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressiveList,DEFAULT_LIST_VISIBLE_ITEMS} from '../../src/ui/progressive-list.js';

for(const count of [0,1,4,5,6,10,17,50])test(`lista progressiva com ${count} registros`,()=>{
  const items=Array.from({length:count},(_,index)=>index);
  const list=createProgressiveList({items});
  assert.equal(DEFAULT_LIST_VISIBLE_ITEMS,5);
  assert.equal(list.visibleItems.length,Math.min(count,5));
  assert.equal(list.hiddenItems,Math.max(0,count-5));
  list.expand();assert.deepEqual(list.visibleItems,items);
  list.collapse();assert.equal(list.visibleItems.length,Math.min(count,5));
  list.toggle();list.reset();assert.equal(list.expanded,false);
});
test('ordena cópia completa antes de limitar e preserva ordem na expansão',()=>{
  const items=[1,7,3,6,2,5,4];
  const list=createProgressiveList({items,sort:(a,b)=>b-a});
  assert.deepEqual(list.visibleItems,[7,6,5,4,3]);
  list.expand();assert.deepEqual(list.visibleItems,[7,6,5,4,3,2,1]);
  assert.deepEqual(items,[1,7,3,6,2,5,4]);
});
