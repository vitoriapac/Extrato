import test from 'node:test';
import assert from 'node:assert/strict';
import { splitQuestionGoal } from '../../src/application/goals/split-question-goal.js';

const total = shares => [...shares.values()].reduce((a, b) => a + b, 0);

test('splitQuestionGoal fecha exatamente na meta global e mantém a proporção', () => {
  const goals = [
    { id: 'a', meta: 30 },
    { id: 'b', meta: 60 },
    { id: 'c', meta: 90 },
  ];
  const shares = splitQuestionGoal(goals, 60);
  assert.equal(total(shares), 60);
  assert.deepEqual(
    [...shares.entries()],
    [
      ['a', 10],
      ['b', 20],
      ['c', 30],
    ]
  );
});

test('splitQuestionGoal distribui o resto pelas maiores frações, com desempate pela maior meta', () => {
  const shares = splitQuestionGoal(
    [
      { id: 'a', meta: 1 },
      { id: 'b', meta: 1 },
      { id: 'c', meta: 2 },
    ],
    10
  );
  assert.equal(total(shares), 10);
  assert.equal(shares.get('c'), 5);
  assert.equal(shares.get('a') + shares.get('b'), 5);
});

test('splitQuestionGoal ao reduzir o total nenhuma meta sobe (caso 230 → 220 da demo)', () => {
  const metas = [50, 20, 14, 25, 12, 14, 10, 10, 10, 8, 8, 8, 8, 8, 8, 8, 9];
  const shares = splitQuestionGoal(
    metas.map((meta, index) => ({ id: `s${index}`, meta })),
    220
  );
  assert.equal(total(shares), 220);
  metas.forEach((meta, index) => assert.ok(shares.get(`s${index}`) <= meta));
});

test('splitQuestionGoal reproduz o caso da demo: 17 metas somando 1190 viram 220', () => {
  const goals = Array.from({ length: 17 }, (_, index) => ({
    id: `s${index}`,
    meta: 30 + index * 5,
  }));
  const shares = splitQuestionGoal(goals, 220);
  assert.equal(total(shares), 220);
  assert.ok([...shares.values()].every(value => value >= 1));
});

test('splitQuestionGoal deixa metas zeradas de fora e dá no mínimo 1 às pequenas', () => {
  const shares = splitQuestionGoal(
    [
      { id: 'a', meta: 0 },
      { id: 'b', meta: 1 },
      { id: 'c', meta: 1000 },
    ],
    220
  );
  assert.equal(shares.has('a'), false);
  assert.equal(shares.get('b'), 1);
  assert.equal(total(shares), 220);
});

test('splitQuestionGoal recusa o que não fecha', () => {
  const goals = [
    { id: 'a', meta: 5 },
    { id: 'b', meta: 5 },
  ];
  assert.equal(splitQuestionGoal([], 220), null);
  assert.equal(splitQuestionGoal(goals, 0), null);
  assert.equal(splitQuestionGoal(goals, 1), null);
  assert.equal(splitQuestionGoal([{ id: 'a', meta: 0 }], 220), null);
});
