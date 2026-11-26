import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTodayReviewLoad } from '../../src/application/reviews/build-today-review-load.js';

const review = (date, status = 'Pendente') => ({ id: date + status, date, status });

test('fila única soma revisões de tópico e flashcards em minutos contra o teto diário', () => {
  const load = buildTodayReviewLoad({
    reviews: [
      review('2026-11-20'),
      review('2026-11-26'),
      review('2026-11-30'),
      review('2026-11-01', 'Concluído'),
    ],
    flashcards: [],
    today: '2026-11-26',
    dailyGoalMinutes: 120,
  });
  assert.equal(load.topicCount, 2);
  assert.equal(load.overdueTopics, 1);
  assert.equal(load.totalMinutes, 30);
  assert.equal(load.capMinutes, 30, '25% padrão de 2 h');
  assert.equal(load.overCap, false);
});

test('passa do teto quando a dívida em minutos excede o orçamento; sem meta diária não há teto', () => {
  const reviews = ['2026-11-20', '2026-11-21', '2026-11-22'].map(d => review(d));
  const over = buildTodayReviewLoad({
    reviews,
    today: '2026-11-26',
    dailyGoalMinutes: 120,
    budgetPct: 20,
  });
  assert.equal(over.capMinutes, 24);
  assert.equal(over.overCap, true);
  const noGoal = buildTodayReviewLoad({ reviews, today: '2026-11-26' });
  assert.equal(noGoal.capMinutes, null);
  assert.equal(noGoal.overCap, false);
});
