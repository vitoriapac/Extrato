import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createErrorFlashcard,
  reviewErrorFlashcard,
  getDueFlashcards,
  calculateFlashcardDeckStats,
  filterFlashcards,
} from '../../src/domain/notebook/error-notebook-engine.js';

test('createErrorFlashcard — inicializa card com valores padrão e status pending', () => {
  const card = createErrorFlashcard({
    topicId: 't1',
    subjectId: 's1',
    statementSummary: 'O princípio da legalidade estrita admite exceção por decreto autônomo?',
    bancaTrap: 'Confundir medida provisória com decreto regulamentar',
    correctConcept: 'Não admite, salvo hipóteses taxativas do art. 84, VI da CF/88.',
    errorCategory: 'interpretacao',
    todayDate: '2026-10-27',
  });

  assert.ok(card.id.startsWith('efc_'));
  assert.equal(card.status, 'pending');
  assert.equal(card.reviewCount, 0);
  assert.equal(card.consecutiveSuccesses, 0);
  assert.equal(card.intervalDays, 1);
  assert.equal(card.easeFactor, 2.5);
  assert.equal(card.nextReviewDate, '2026-10-27');
  assert.equal(card.errorCategory, 'interpretacao');
});

test('reviewErrorFlashcard — rating again reseta intervalo para 1 dia e reduz easeFactor', () => {
  const initial = createErrorFlashcard({
    topicId: 't1',
    subjectId: 's1',
    statementSummary: 'Questão sobre juros compostos',
    correctConcept: 'M = C * (1 + i)^t',
    todayDate: '2026-10-27',
  });

  const reviewed = reviewErrorFlashcard(initial, 'again', {
    todayDate: '2026-10-27',
    nowISO: '2026-10-27T10:00:00Z',
  });

  assert.equal(reviewed.status, 'reviewing');
  assert.equal(reviewed.reviewCount, 1);
  assert.equal(reviewed.consecutiveSuccesses, 0);
  assert.equal(reviewed.intervalDays, 1);
  assert.equal(reviewed.nextReviewDate, '2026-10-28');
  assert.equal(reviewed.easeFactor, 2.3);
});

test('reviewErrorFlashcard — rating good progride intervalos e atinge mastered após 3 sucessos consecutivos', () => {
  const initial = createErrorFlashcard({
    topicId: 't1',
    subjectId: 's1',
    statementSummary: 'Conceito de ato discricionário',
    correctConcept: 'Margem de escolha da Administração nos limites da lei',
    todayDate: '2026-10-01',
  });

  // 1ª revisão: good -> intervalo 2 dias
  const rev1 = reviewErrorFlashcard(initial, 'good', { todayDate: '2026-10-01' });
  assert.equal(rev1.intervalDays, 2);
  assert.equal(rev1.consecutiveSuccesses, 1);
  assert.equal(rev1.status, 'reviewing');
  assert.equal(rev1.nextReviewDate, '2026-10-03');

  // 2ª revisão: good -> intervalo 4 dias
  const rev2 = reviewErrorFlashcard(rev1, 'good', { todayDate: '2026-10-03' });
  assert.equal(rev2.intervalDays, 4);
  assert.equal(rev2.consecutiveSuccesses, 2);
  assert.equal(rev2.status, 'reviewing');
  assert.equal(rev2.nextReviewDate, '2026-10-07');

  // 3ª revisão: good -> intervalo 4 * 2.5 = 10 dias, atinge mastered
  const rev3 = reviewErrorFlashcard(rev2, 'good', { todayDate: '2026-10-07' });
  assert.equal(rev3.intervalDays, 10);
  assert.equal(rev3.consecutiveSuccesses, 3);
  assert.equal(rev3.status, 'mastered');
  assert.equal(rev3.nextReviewDate, '2026-10-17');
});

test('getDueFlashcards e calculateFlashcardDeckStats — filtram corretamente vencidos e contabilizam status', () => {
  const c1 = createErrorFlashcard({
    topicId: 't1',
    subjectId: 's1',
    statementSummary: 'A',
    correctConcept: 'A',
    todayDate: '2026-10-27',
  });
  /** @type {import('../../src/core/types.js').ErrorFlashcard} */
  const c2 = {
    ...createErrorFlashcard({
      topicId: 't2',
      subjectId: 's1',
      statementSummary: 'B',
      correctConcept: 'B',
    }),
    status: 'reviewing',
    nextReviewDate: '2026-10-25',
  };
  /** @type {import('../../src/core/types.js').ErrorFlashcard} */
  const c3 = {
    ...createErrorFlashcard({
      topicId: 't3',
      subjectId: 's2',
      statementSummary: 'C',
      correctConcept: 'C',
    }),
    status: 'reviewing',
    nextReviewDate: '2026-11-01',
  };
  /** @type {import('../../src/core/types.js').ErrorFlashcard} */
  const c4 = {
    ...createErrorFlashcard({
      topicId: 't4',
      subjectId: 's2',
      statementSummary: 'D',
      correctConcept: 'D',
    }),
    status: 'mastered',
    nextReviewDate: '2026-10-20',
  };

  const cards = [c1, c2, c3, c4];
  const due = getDueFlashcards(cards, '2026-10-27');

  // c1 (pending) e c2 (reviewing com data 25 <= 27) devem estar no due; c3 é futuro (01/11); c4 é mastered
  assert.equal(due.length, 2);
  assert.ok(due.some(c => c.id === c1.id));
  assert.ok(due.some(c => c.id === c2.id));

  const stats = calculateFlashcardDeckStats(cards, '2026-10-27');
  assert.equal(stats.total, 4);
  assert.equal(stats.dueCount, 2);
  assert.equal(stats.pendingCount, 1);
  assert.equal(stats.reviewingCount, 2);
  assert.equal(stats.masteredCount, 1);

  // Filtro por disciplina
  const s1Cards = filterFlashcards(cards, { subjectId: 's1' });
  assert.equal(s1Cards.length, 2);

  // Filtro por busca textual
  const searchResult = filterFlashcards(cards, { query: 'B' });
  assert.equal(searchResult.length, 1);
  assert.equal(searchResult[0].statementSummary, 'B');
});
