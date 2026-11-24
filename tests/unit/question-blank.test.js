import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeErrorBreakdown,
  normalizeQuestionBlank,
  questionErrorCount,
} from '../../src/domain/diagnostics/error-categories.ts';
import { buildQuestionViewModel } from '../../src/ui/view-models/question-view-model.ts';

test('em branco não é erro e fica entre 0 e resolvidas − acertos', () => {
  assert.equal(questionErrorCount({ resolved: 20, correct: 12, blank: 5 }), 3);
  assert.equal(questionErrorCount({ resolved: 20, correct: 12 }), 8);
  assert.equal(normalizeQuestionBlank({ resolved: 20, correct: 12, blank: 15 }), 8);
  assert.equal(normalizeQuestionBlank({ resolved: 20, correct: 12, blank: -3 }), 0);
  // Ausente continua ausente: registro antigo não informa se houve branco.
  assert.equal(normalizeQuestionBlank({ resolved: 20, correct: 12 }), null);
  assert.equal(normalizeQuestionBlank({ resolved: 20, correct: 12, blank: '' }), null);
});

test('categorias de erro e linha da tabela contam só os erros, sem os brancos', () => {
  const question = {
    resolved: 20,
    correct: 12,
    blank: 5,
    errorBreakdown: { naoSabia: 2, interpretacao: 4 },
  };
  const breakdown = normalizeErrorBreakdown(question);
  assert.equal(
    Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    3
  );
  const vm = buildQuestionViewModel(question, {
    formatDate: d => d,
    getSubjectName: () => 'X',
    getTopicName: () => 'Y',
    subjectIdOf: () => 's',
    accuracy: () => 0,
  });
  assert.equal(vm.errors, 3);
});
