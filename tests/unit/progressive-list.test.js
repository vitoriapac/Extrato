import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProgressiveList,
  DEFAULT_LIST_VISIBLE_ITEMS,
  PAGINATION_THRESHOLD,
} from '../../src/ui/progressive-list.js';

for (const count of [0, 1, 4, 5, 6, 10, 17, 50])
  test(`lista progressiva com ${count} registros`, () => {
    const items = Array.from({ length: count }, (_, index) => index);
    const list = createProgressiveList({ items });
    assert.equal(DEFAULT_LIST_VISIBLE_ITEMS, 5);
    assert.equal(list.visibleItems.length, Math.min(count, 5));
    assert.equal(list.hiddenItems, Math.max(0, count - 5));
    list.expand();
    assert.deepEqual(list.visibleItems, items);
    list.collapse();
    assert.equal(list.visibleItems.length, Math.min(count, 5));
    list.toggle();
    list.reset();
    assert.equal(list.expanded, false);
  });
test('ordena cópia completa antes de limitar e preserva ordem na expansão', () => {
  const items = [1, 7, 3, 6, 2, 5, 4];
  const list = createProgressiveList({ items, sort: (a, b) => b - a });
  assert.deepEqual(list.visibleItems, [7, 6, 5, 4, 3]);
  list.expand();
  assert.deepEqual(list.visibleItems, [7, 6, 5, 4, 3, 2, 1]);
  assert.deepEqual(items, [1, 7, 3, 6, 2, 5, 4]);
});

for (const [count, pages] of [
  [0, 1],
  [1, 1],
  [10, 1],
  [11, 2],
  [20, 2],
  [63, 7],
])
  test(`modo pages com ${count} registros tem ${pages} página(s)`, () => {
    const items = Array.from({ length: count }, (_, index) => index);
    const list = createProgressiveList({ items, mode: 'pages' });
    assert.equal(list.pageCount, pages);
    assert.equal(list.page, 1);
    assert.deepEqual(list.visibleItems, items.slice(0, 10));
    list.goTo(pages);
    assert.deepEqual(list.visibleItems, items.slice((pages - 1) * 10, pages * 10));
    list.next();
    assert.equal(list.page, pages);
    list.goTo(1);
    list.prev();
    assert.equal(list.page, 1);
  });
test('modo pages limita a página inicial e volta à 1 no reset', () => {
  const items = Array.from({ length: 25 }, (_, index) => index);
  const list = createProgressiveList({ items, mode: 'pages', page: 99 });
  assert.equal(list.page, 3);
  assert.deepEqual(list.visibleItems, [20, 21, 22, 23, 24]);
  assert.equal(list.hiddenItems, 20);
  list.goTo(-4);
  assert.equal(list.page, 1);
  list.goTo(2);
  list.reset();
  assert.equal(list.page, 1);
});
test('limiar de paginação é 20', () => {
  assert.equal(PAGINATION_THRESHOLD, 20);
});
