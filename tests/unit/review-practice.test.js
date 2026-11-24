import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { suggestReviewRating } from '../../src/domain/reviews.js';
import { ReviewRatingSheet } from '../../src/ui/modals/ReviewRatingSheet.js';

test('sugere a avaliação pelo acerto com os limites do intervalo adaptativo', () => {
  assert.equal(suggestReviewRating(0, 0), null);
  assert.deepEqual(suggestReviewRating(10, 4, 70), { rating: 'again', accuracy: 40 });
  assert.deepEqual(suggestReviewRating(10, 6, 70), { rating: 'hard', accuracy: 60 });
  assert.deepEqual(suggestReviewRating(10, 7, 70), { rating: 'good', accuracy: 70 });
  assert.deepEqual(suggestReviewRating(20, 17, 70), { rating: 'easy', accuracy: 85 });
  // A meta da disciplina muda a sugestão: 80% com meta 85 ainda é difícil.
  assert.equal(suggestReviewRating(10, 8, 85).rating, 'hard');
  // Acertos acima do total são limitados ao total.
  assert.equal(suggestReviewRating(5, 9).accuracy, 100);
});

test('folha de avaliação oferece o registro opcional de questões', () => {
  const html = render(
    h(ReviewRatingSheet, {
      open: true,
      topicLabel: 'Português — Crase',
      onRate() {},
      onCancel() {},
    })
  );
  assert.match(html, /Revisou resolvendo questões\? \(opcional\)/);
  assert.match(html, /id="reviewPracticeResolved"/);
  assert.match(html, /Já resolvidas antes/);
  assert.match(html, /alimentam Domínio e Retenção/);
});
