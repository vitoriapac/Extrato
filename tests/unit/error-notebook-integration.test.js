import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  addErrorFlashcard,
  createErrorFlashcard,
  findQuestionsAwaitingFlashcard,
} from '../../src/domain/notebook/error-notebook-engine.js';
import { ErrorNotebookDueNotice } from '../../src/ui/components/ErrorNotebookDueNotice.js';
import { ErrorNotebookView } from '../../src/ui/views/ErrorNotebookView.js';

/** @returns {import('../../src/core/types.js').QuestionRecord} */
function question(overrides = {}) {
  return {
    id: 'q1',
    date: '2026-10-20',
    subjectId: 's1',
    topicId: 't1',
    resolved: 10,
    correct: 6,
    errorBreakdown: { naoSabia: 1, interpretacao: 3 },
    ...overrides,
  };
}

const baseInput = {
  id: 'efc_a',
  subjectId: 's1',
  topicId: 't1',
  questionId: 'q1',
  statementSummary: 'Cabe MS contra ato de gestão comercial?',
  correctConcept: 'Não cabe (Súmula 333/STJ).',
  todayDate: '2026-10-27',
};

test('findQuestionsAwaitingFlashcard lista só registros com erro e sem cartão vinculado', () => {
  const questions = [
    question({ id: 'q-com-erro' }),
    question({ id: 'q-perfeito', resolved: 5, correct: 5 }),
    question({ id: 'q-vazio', resolved: 0, correct: 0 }),
    question({ id: 'q-ja-tem-cartao' }),
  ];
  const cards = [createErrorFlashcard({ ...baseInput, questionId: 'q-ja-tem-cartao' })];
  const drafts = findQuestionsAwaitingFlashcard(questions, cards);
  assert.deepEqual(
    drafts.map(d => d.questionId),
    ['q-com-erro']
  );
  assert.equal(drafts[0].errorCount, 4);
});

test('findQuestionsAwaitingFlashcard sugere a categoria dominante e ordena do mais recente', () => {
  const drafts = findQuestionsAwaitingFlashcard([
    question({ id: 'antigo', date: '2026-10-01' }),
    question({ id: 'novo', date: '2026-10-25', errorBreakdown: { calculo: 5, chute: 1 } }),
    question({
      id: 'sem-detalhe',
      date: '2026-10-10',
      errorBreakdown: {},
      errorCategory: 'esqueci',
    }),
  ]);
  assert.deepEqual(
    drafts.map(d => d.questionId),
    ['novo', 'sem-detalhe', 'antigo']
  );
  assert.equal(drafts[0].errorCategory, 'calculo');
  assert.equal(drafts[1].errorCategory, 'esqueci');
  assert.equal(drafts[2].errorCategory, 'interpretacao');
});

test('findQuestionsAwaitingFlashcard preserva tópico ausente e não altera as entradas', () => {
  const questions = [question({ topicId: null })];
  const cards = [];
  const snapshot = JSON.stringify({ questions, cards });
  const drafts = findQuestionsAwaitingFlashcard(questions, cards);
  assert.equal(drafts[0].topicId, null);
  assert.equal(JSON.stringify({ questions, cards }), snapshot);
});

test('addErrorFlashcard inclui o cartão sem alterar a lista original', () => {
  const original = [];
  const result = addErrorFlashcard(original, baseInput);
  assert.equal(result.created, true);
  assert.equal(result.cards.length, 1);
  assert.equal(original.length, 0);
  assert.equal(result.card.questionId, 'q1');
  assert.equal(result.card.status, 'pending');
});

test('addErrorFlashcard é idempotente para o mesmo contexto e enunciado (duplo clique)', () => {
  const first = addErrorFlashcard([], baseInput);
  const retry = addErrorFlashcard(first.cards, {
    ...baseInput,
    id: 'efc_outro',
    statementSummary: '  cabe MS contra ato de   gestão comercial?  ',
  });
  assert.equal(retry.created, false);
  assert.equal(retry.cards, first.cards);
  assert.equal(retry.card.id, 'efc_a');
});

test('addErrorFlashcard permite vários cartões de enunciados diferentes no mesmo registro', () => {
  const first = addErrorFlashcard([], baseInput);
  const second = addErrorFlashcard(first.cards, {
    ...baseInput,
    id: 'efc_b',
    statementSummary: 'Outro erro do mesmo registro',
  });
  assert.equal(second.created, true);
  assert.equal(second.cards.length, 2);
  // Com um cartão vinculado o registro deixa de ser sugerido.
  assert.deepEqual(findQuestionsAwaitingFlashcard([question()], second.cards), []);
});

test('ErrorNotebookDueNotice não renderiza sem cartões e informa a quantidade quando há', () => {
  assert.equal(render(h(ErrorNotebookDueNotice, { dueCount: 0 })), '');
  assert.equal(render(h(ErrorNotebookDueNotice, { dueCount: Number.NaN })), '');
  const one = render(h(ErrorNotebookDueNotice, { dueCount: 1 }));
  assert.ok(one.includes('1 flashcard para revisar'));
  assert.ok(one.includes('Revisar agora'));
  assert.ok(one.includes('role="status"'));
  assert.ok(
    render(h(ErrorNotebookDueNotice, { dueCount: 7 })).includes('7 flashcards para revisar')
  );
});

test('ErrorNotebookView mostra as sugestões de flashcard com limite de 5 itens', () => {
  const subjects = [{ id: 's1', name: 'Direito', topics: [{ id: 't1', name: 'Atos' }] }];
  const drafts = Array.from({ length: 7 }, (_, index) => ({
    questionId: `q${index}`,
    subjectId: 's1',
    topicId: 't1',
    date: '2026-10-2' + index,
    errorCount: 2,
  }));
  const html = render(h(ErrorNotebookView, { flashcards: [], subjects, questionDrafts: drafts }));
  assert.ok(html.includes('7 registros de questões com erros ainda não viraram flashcard'));
  assert.equal(html.split('Criar flashcard').length - 1, 5);
  assert.ok(html.includes('+2 registros'));
  assert.ok(
    !render(h(ErrorNotebookView, { flashcards: [], subjects })).includes('error-notebook-drafts')
  );
});
