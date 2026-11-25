import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createErrorFlashcard,
  selectWarmupFlashcards,
} from '../../src/domain/notebook/error-notebook-engine.js';

test('selectWarmupFlashcards filtra por disciplina, banca e erro sem mutar o agendamento SM-2', () => {
  const card1 = createErrorFlashcard({
    id: 'c1',
    subjectId: 's-dir',
    topicId: 't-atos',
    statementSummary: 'Questão FGV sobre revogação',
    correctConcept: 'A administração pode revogar por conveniência.',
    errorCategory: 'pegadinha',
    banca: 'FGV',
    reference: 'Súmula 473 STF',
    todayDate: '2026-11-20',
    createdAt: '2026-11-20T10:00:00.000Z',
  });
  card1.easeFactor = 1.9;
  card1.nextReviewDate = '2026-12-01';

  const card2 = createErrorFlashcard({
    id: 'c2',
    subjectId: 's-port',
    topicId: 't-crase',
    statementSummary: 'Questão Cebraspe sobre crase',
    correctConcept: 'Antes de pronome de posse é facultativa.',
    errorCategory: 'desatencao',
    banca: 'Cebraspe',
    todayDate: '2026-11-21',
    createdAt: '2026-11-21T10:00:00.000Z',
  });

  const warmupFgv = selectWarmupFlashcards([card1, card2], {
    subjectId: 's-dir',
    banca: 'fgv',
    errorCategory: 'pegadinha',
  });

  assert.equal(warmupFgv.length, 1);
  assert.equal(warmupFgv[0].id, 'c1');
  assert.equal(warmupFgv[0].reference, 'Súmula 473 STF');
  assert.equal(warmupFgv[0].nextReviewDate, '2026-12-01');
  assert.equal(warmupFgv[0].intervalDays, 1);
});
