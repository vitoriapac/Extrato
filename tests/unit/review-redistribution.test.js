import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyReviewMoves,
  buildReviewRedistribution,
  revertReviewMoves,
} from '../../src/application/reviews/redistribute-overdue-reviews.js';

// 2026-11-02 is a Monday. One hour = 3 reviews; Sunday has no study.
const hoursByDay = { 0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
const review = (id, date, status = 'Pendente') => ({ id, date, status });

test('redistribuição: atrasadas mais antigas primeiro, respeita capacidade e carga existente', () => {
  const reviews = [
    review('o3', '2026-10-30'),
    review('o1', '2026-10-20'),
    review('o2', '2026-10-25'),
    review('o4', '2026-10-31'),
    review('done', '2026-10-15', 'Concluído'),
    review('mon', '2026-11-02'),
    review('mon2', '2026-11-02'),
  ];
  const plan = buildReviewRedistribution({ reviews, today: '2026-11-02', hoursByDay });
  assert.equal(plan.overdue, 4);
  assert.deepEqual(
    plan.moves.map(move => `${move.id}→${move.to}`),
    ['o1→2026-11-02', 'o2→2026-11-03', 'o3→2026-11-03', 'o4→2026-11-03']
  );
  for (const day of plan.days) assert.ok(day.after <= day.capacity);
  assert.deepEqual(plan.unplaced, []);
});

test('redistribuição: dias sem estudo ficam de fora e o que não cabe é informado', () => {
  const reviews = Array.from({ length: 5 }, (_, i) => review(`o${i}`, '2026-10-01'));
  // Only Sunday 2026-11-08 would be free, but it has no study time; 1 day of capacity 3.
  const plan = buildReviewRedistribution({
    reviews,
    today: '2026-11-07',
    hoursByDay,
    horizonDays: 2,
  });
  assert.deepEqual(plan.moves.map(move => move.to), ['2026-11-07', '2026-11-07', '2026-11-07']);
  assert.deepEqual(plan.unplaced, ['o3', 'o4']);
  const none = buildReviewRedistribution({ reviews, today: '2026-11-07', hoursByDay: {} });
  assert.equal(none.hasCapacity, false);
  assert.equal(none.moves.length, 0);
  assert.equal(buildReviewRedistribution({ reviews: [], today: '2026-11-07', hoursByDay }).overdue, 0);
});

test('redistribuição: aplicar só depois da prévia, desfazer volta as datas e ignora o que mudou', () => {
  const reviews = [review('a', '2026-10-20'), review('b', '2026-10-21')];
  const plan = buildReviewRedistribution({ reviews, today: '2026-11-02', hoursByDay });
  // Building the plan does not touch the agenda.
  assert.deepEqual(reviews.map(item => item.date), ['2026-10-20', '2026-10-21']);
  const applied = applyReviewMoves(reviews, plan.moves);
  assert.equal(applied.length, 2);
  assert.deepEqual(reviews.map(item => item.date), ['2026-11-02', '2026-11-02']);
  reviews[1].date = '2026-11-10';
  const reverted = revertReviewMoves(reviews, applied);
  assert.deepEqual(reverted.map(move => move.id), ['a']);
  assert.deepEqual(reviews.map(item => item.date), ['2026-10-20', '2026-11-10']);
});
